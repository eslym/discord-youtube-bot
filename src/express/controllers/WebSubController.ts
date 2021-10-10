import {BaseController} from "./BaseController";
import crypto = require("crypto");
import {parseStringPromise} from "xml2js";
import * as moment from "moment";
import {logger} from "../../logger";
import {WebSub} from "../../models/WebSub";
import {Subscription} from "../../models/Subscription";
import {Notification} from "../../models/Notification";
import {Op} from "sequelize";
import {YoutubeVideo} from "../../models/YoutubeVideo";

export class WebSubController extends BaseController {
    async subscribe() {
        let websub: WebSub = await this.resolveParam<Promise<WebSub>>('websub', (id)=>WebSub.findByPk(id), true);
        this.response.send(this.request.query['hub.challenge']);
        let data = await websub.fetchSnippet();
        let title = data.snippet.title;
        if (this.request.query['hub.mode'] === 'subscribe') {
            if (websub.expires_at === null) {
                console.info(`[WebSub] Subscribed ${title}`);
            } else {
                console.info(`[WebSub] Renewed ${title}`);
            }
            websub.expires_at = moment()
                .add({second: Number.parseInt(this.request.query['hub.lease_seconds'] as string)})
                .toDate();
            websub.save();
        } else if (this.request.query['hub.mode'] === 'unsubscribe') {
            logger.log(`[WebSub] Unsubscribed ${title}`);
            await YoutubeVideo.destroy({
                where: {
                    sub_id: websub.id
                }
            });
            let ids = await Subscription.findAll({
                attributes: ['id'],
                where: {
                    sub_id: websub.id,
                }
            }).map(s => s.id);
            await Notification.destroy({
                where: {
                    subscription_id: {[Op.in]: ids}
                }
            });
            await Subscription.destroy({
                where: {
                    id: {[Op.in]: ids}
                }
            })
            await websub.destroy();
        }
    }

    async callback() {
        let websub: WebSub = await this.resolveParam<Promise<WebSub>>('websub', (id)=>WebSub.findByPk(id), true);
        this.response.send('OK');
        this.request.body = await parseStringPromise(this.request.raw.toString());
        let [algo, sig] = (this.request.headers['x-hub-signature'] as string).split('=', 2);
        let hmac = crypto.createHmac(algo, websub.secret);
        hmac.update(this.request.raw);
        let compute = hmac.digest().toString('hex');
        if (sig.toLowerCase() !== compute) {
            logger.warn(`[WebSub] Invalid signature ${sig}`)
            return;
        }
        let data = await websub.fetchSnippet();
        let title = data.snippet.title;
        logger.info(`[WebSub] Notification received for ${title}`);
        if(this.request.body.feed['at:deleted-entry'] !== undefined){
            let entry = this.request.body.feed['at:deleted-entry'][0];
            let id = entry.$.ref;
            let video = await YoutubeVideo.findOne({
                where: {
                    video_id: id,
                }
            });
            if(video){
                video.deleted_at = moment(entry.$.when).toDate();
                video.save();
            }
        } else {

        }
    }
}