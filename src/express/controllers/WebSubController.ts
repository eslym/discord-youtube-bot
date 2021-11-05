import {BaseController} from "./BaseController";
import {parseStringPromise} from "xml2js";
import * as moment from "moment";
import {logger} from "../../logger";
import {WebSub} from "../../models/WebSub";
import {Subscription} from "../../models/Subscription";
import {Notification} from "../../models/Notification";
import {Op} from "sequelize";
import {YoutubeVideo} from "../../models/YoutubeVideo";
import {NotificationType} from "../../manager/SubscriptionManager";
import crypto = require("crypto");

export class WebSubController extends BaseController {
    async subscribe() {
        let websub: WebSub = await this.resolveParam<Promise<WebSub>>('websub', (id)=>WebSub.findByPk(id), true);
        this.response.send(this.request.query['hub.challenge']);
        let data = await websub.fetchYoutubeChannelMeta();
        let title = data.snippet.title;
        if (this.request.query['hub.mode'] === 'subscribe') {
            if (websub.expires_at === null) {
                logger.info(`[WebSub] Subscribed ${title}`);
            } else {
                logger.info(`[WebSub] Renewed ${title}`);
            }
            websub.expires_at = moment()
                .add({second: Number.parseInt(this.request.query['hub.lease_seconds'] as string)})
                .toDate();
            websub.save();
        } else if (this.request.query['hub.mode'] === 'unsubscribe') {
            logger.info(`[WebSub] Unsubscribed ${title}`);
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
        let data = await websub.fetchYoutubeChannelMeta();
        let title = data.snippet.title;
        logger.info(`[WebSub] Notification received from ${title}`);
        if(this.request.body.feed['at:deleted-entry'] !== undefined){
            let entry = this.request.body.feed['at:deleted-entry'][0];
            let id = (entry.$.ref as string).split(':').pop();
            let video = await YoutubeVideo.findOne({
                where: {
                    video_id: id,
                }
            });
            if(video){
                video.deleted_at = moment(entry.$.when).toDate();
                await video.save();
                await Notification.destroy({
                    where: {
                        video_id: id,
                    }
                });
                logger.info(`Video deleted: ${id}`);
            }
        } else {
            for (let video of this.request.body.feed.entry) {
                let id = video['yt:videoId'][0] as string;
                let url = video.link[0].$.href as string;
                let channelSnippet = await websub.fetchYoutubeChannelMeta();
                let ytVideo = await YoutubeVideo.findByPk(id);
                logger.info(`[WebSub] Video: ${id}`);
                if(!ytVideo){
                    ytVideo = await YoutubeVideo.create({
                        video_id: id,
                        sub_id: websub.id,
                    });
                    let videoSnippet = await ytVideo.fetchYoutubeVideoMeta();
                    if(!videoSnippet){
                        continue;
                    }
                    if(videoSnippet.liveStreamingDetails){
                        if(!videoSnippet.liveStreamingDetails.actualStartTime){
                            if(!videoSnippet.liveStreamingDetails.scheduledStartTime){
                                continue;
                            }
                            let schedule = moment(videoSnippet.liveStreamingDetails.scheduledStartTime);
                            ytVideo.live_at = schedule.toDate();
                            ytVideo.save();
                            schedule = schedule.subtract({minute: 5}).startOf('minute');
                            for(let sub of await websub.$get('subscriptions')){
                                await sub.notify(NotificationType.LIVE, ytVideo);
                                await Notification.create({
                                    subscription_id: sub.id,
                                    video_id: id,
                                    scheduled_at: schedule.toDate()
                                });
                            }
                            continue;
                        }
                    }
                    for(let sub of await websub.$get('subscriptions')){
                        await sub.notify(NotificationType.VIDEO, ytVideo);
                    }
                    continue;
                }
                if(ytVideo.deleted_at){
                    continue;
                }
                let videoSnippet = await ytVideo.fetchYoutubeVideoMeta();
                if(!videoSnippet){
                    continue;
                }
                if(
                    !videoSnippet.liveStreamingDetails ||
                    !videoSnippet.liveStreamingDetails.scheduledStartTime ||
                    videoSnippet.liveStreamingDetails.actualStartTime
                ){
                    continue;
                }
                let newLive = moment(videoSnippet.liveStreamingDetails.scheduledStartTime);
                if(!newLive.isSame(ytVideo.live_at)){
                    ytVideo.live_at = newLive.toDate();
                    ytVideo.save();
                    let notifications = await Notification.findAll({
                        where: {
                            video_id: id,
                        }
                    });
                    let schedule = newLive.subtract({minute: 5}).startOf('minute').toDate();
                    for (let notification of notifications) {
                        notification.scheduled_at = schedule;
                        notification.notified_at = null;
                        await notification.save();
                    }
                    let subs = await websub.$get('subscriptions');
                    for(let sub of subs){
                        await sub.notify(NotificationType.RESCHEDULE, ytVideo);
                    }
                }
            }
        }
    }
}