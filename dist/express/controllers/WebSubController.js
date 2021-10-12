"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WebSubController = void 0;
const BaseController_1 = require("./BaseController");
const xml2js_1 = require("xml2js");
const moment = require("moment");
const logger_1 = require("../../logger");
const WebSub_1 = require("../../models/WebSub");
const Subscription_1 = require("../../models/Subscription");
const Notification_1 = require("../../models/Notification");
const sequelize_1 = require("sequelize");
const YoutubeVideo_1 = require("../../models/YoutubeVideo");
const crypto = require("crypto");
class WebSubController extends BaseController_1.BaseController {
    subscribe() {
        return __awaiter(this, void 0, void 0, function* () {
            let websub = yield this.resolveParam('websub', (id) => WebSub_1.WebSub.findByPk(id), true);
            this.response.send(this.request.query['hub.challenge']);
            let data = yield websub.fetchSnippet();
            let title = data.snippet.title;
            if (this.request.query['hub.mode'] === 'subscribe') {
                if (websub.expires_at === null) {
                    logger_1.logger.info(`[WebSub] Subscribed ${title}`);
                }
                else {
                    logger_1.logger.info(`[WebSub] Renewed ${title}`);
                }
                websub.expires_at = moment()
                    .add({ second: Number.parseInt(this.request.query['hub.lease_seconds']) })
                    .toDate();
                websub.save();
            }
            else if (this.request.query['hub.mode'] === 'unsubscribe') {
                logger_1.logger.info(`[WebSub] Unsubscribed ${title}`);
                yield YoutubeVideo_1.YoutubeVideo.destroy({
                    where: {
                        sub_id: websub.id
                    }
                });
                let ids = yield Subscription_1.Subscription.findAll({
                    attributes: ['id'],
                    where: {
                        sub_id: websub.id,
                    }
                }).map(s => s.id);
                yield Notification_1.Notification.destroy({
                    where: {
                        subscription_id: { [sequelize_1.Op.in]: ids }
                    }
                });
                yield Subscription_1.Subscription.destroy({
                    where: {
                        id: { [sequelize_1.Op.in]: ids }
                    }
                });
                yield websub.destroy();
            }
        });
    }
    callback() {
        return __awaiter(this, void 0, void 0, function* () {
            let websub = yield this.resolveParam('websub', (id) => WebSub_1.WebSub.findByPk(id), true);
            this.response.send('OK');
            this.request.body = yield (0, xml2js_1.parseStringPromise)(this.request.raw.toString());
            let [algo, sig] = this.request.headers['x-hub-signature'].split('=', 2);
            let hmac = crypto.createHmac(algo, websub.secret);
            hmac.update(this.request.raw);
            let compute = hmac.digest().toString('hex');
            if (sig.toLowerCase() !== compute) {
                logger_1.logger.warn(`[WebSub] Invalid signature ${sig}`);
                return;
            }
            let data = yield websub.fetchSnippet();
            let title = data.snippet.title;
            logger_1.logger.info(`[WebSub] Notification received from ${title}`);
            if (this.request.body.feed['at:deleted-entry'] !== undefined) {
                let entry = this.request.body.feed['at:deleted-entry'][0];
                let id = entry.$.ref.split(':').pop();
                let video = yield YoutubeVideo_1.YoutubeVideo.findOne({
                    where: {
                        video_id: id,
                    }
                });
                if (video) {
                    video.deleted_at = moment(entry.$.when).toDate();
                    yield video.save();
                    yield Notification_1.Notification.destroy({
                        where: {
                            video_id: id,
                        }
                    });
                    logger_1.logger.info(`Video deleted: ${id}`);
                }
            }
            else {
                for (let video of this.request.body.feed.entry) {
                    let id = video['yt:videoId'][0];
                    let url = video.link[0].$.href;
                    let channelSnippet = yield websub.fetchSnippet();
                    let ytVideo = yield YoutubeVideo_1.YoutubeVideo.findByPk(id);
                    if (!ytVideo) {
                        ytVideo = yield YoutubeVideo_1.YoutubeVideo.create({
                            video_id: id,
                            sub_id: websub.id,
                        });
                        let videoSnippet = yield ytVideo.fetchSnippet();
                        if (videoSnippet.liveStreamingDetails) {
                            if (!videoSnippet.liveStreamingDetails.scheduledStartTime) {
                                continue;
                            }
                            let schedule = moment(videoSnippet.liveStreamingDetails.scheduledStartTime);
                            ytVideo.live_at = schedule.toDate();
                            ytVideo.save();
                            schedule = schedule.subtract({ minute: 5 }).startOf('minute');
                            for (let sub of yield websub.$get('subscriptions')) {
                                yield sub.notifyPublish(url, channelSnippet.snippet.title, ytVideo.live_at);
                                yield Notification_1.Notification.create({
                                    subscription_id: sub.id,
                                    video_id: id,
                                    scheduled_at: schedule.toDate()
                                });
                            }
                            continue;
                        }
                        for (let sub of yield websub.$get('subscriptions')) {
                            yield sub.notifyPublish(url, channelSnippet.snippet.title);
                        }
                        continue;
                    }
                    if (ytVideo.deleted_at) {
                        continue;
                    }
                    let videoSnippet = yield ytVideo.fetchSnippet();
                    if (!videoSnippet.liveStreamingDetails || !videoSnippet.liveStreamingDetails.scheduledStartTime) {
                        continue;
                    }
                    let newLive = moment(videoSnippet.liveStreamingDetails.scheduledStartTime);
                    if (!newLive.isSame(ytVideo.live_at)) {
                        ytVideo.live_at = newLive.toDate();
                        ytVideo.save();
                        let notifications = yield Notification_1.Notification.findAll({
                            where: {
                                video_id: id,
                            }
                        });
                        let schedule = newLive.subtract({ minute: 5 }).startOf('minute').toDate();
                        for (let notification of notifications) {
                            notification.scheduled_at = schedule;
                            notification.notified_at = null;
                            yield notification.save();
                            let sub = yield notification.$get('subscription');
                            yield sub.notifyReschedule(url, channelSnippet.snippet.title, ytVideo.live_at);
                        }
                    }
                }
            }
        });
    }
}
exports.WebSubController = WebSubController;

//# sourceMappingURL=WebSubController.js.map
