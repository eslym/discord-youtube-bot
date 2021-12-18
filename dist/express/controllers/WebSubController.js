"use strict";
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
const SubscriptionManager_1 = require("../../manager/SubscriptionManager");
const crypto = require("crypto");
class WebSubController extends BaseController_1.BaseController {
    async subscribe() {
        let websub = await this.resolveParam('websub', (id) => WebSub_1.WebSub.findByPk(id), true);
        this.response.send(this.request.query['hub.challenge']);
        let data = await websub.fetchYoutubeChannelMeta();
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
            let videos = await YoutubeVideo_1.YoutubeVideo.findAll({
                attributes: ['video_id'],
                where: {
                    websub_id: websub.id
                }
            }).map(v => v.video_id);
            await Notification_1.Notification.destroy({
                where: {
                    video_id: { [sequelize_1.Op.in]: videos }
                }
            });
            await YoutubeVideo_1.YoutubeVideo.destroy({
                where: {
                    video_id: { [sequelize_1.Op.in]: videos }
                }
            });
            let ids = await Subscription_1.Subscription.findAll({
                attributes: ['id'],
                where: {
                    websub_id: websub.id,
                }
            }).map(s => s.id);
            await Subscription_1.Subscription.destroy({
                where: {
                    id: { [sequelize_1.Op.in]: ids }
                }
            });
            await websub.destroy();
        }
    }
    async callback() {
        let websub = await this.resolveParam('websub', (id) => WebSub_1.WebSub.findByPk(id), true);
        this.response.send('OK');
        this.request.body = await (0, xml2js_1.parseStringPromise)(this.request.raw.toString());
        let [algo, sig] = this.request.headers['x-hub-signature'].split('=', 2);
        let hmac = crypto.createHmac(algo, websub.secret);
        hmac.update(this.request.raw);
        let compute = hmac.digest().toString('hex');
        if (sig.toLowerCase() !== compute) {
            logger_1.logger.warn(`[WebSub] Invalid signature ${sig}`);
            return;
        }
        let data = await websub.fetchYoutubeChannelMeta();
        let title = data.snippet.title;
        logger_1.logger.info(`[WebSub] Notification received from ${title}`);
        if (this.request.body.feed['at:deleted-entry'] !== undefined) {
            let entry = this.request.body.feed['at:deleted-entry'][0];
            let id = entry.$.ref.split(':').pop();
            let video = await YoutubeVideo_1.YoutubeVideo.findOne({
                where: {
                    video_id: id,
                }
            });
            if (video) {
                video.deleted_at = moment(entry.$.when).toDate();
                await video.save();
                await Notification_1.Notification.destroy({
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
                let ytVideo = await YoutubeVideo_1.YoutubeVideo.findByPk(id);
                logger_1.logger.info(`[WebSub] Video: ${id}`);
                if (!ytVideo) {
                    ytVideo = await YoutubeVideo_1.YoutubeVideo.create({
                        video_id: id,
                        websub_id: websub.id,
                    });
                    let videoSnippet;
                    try {
                        videoSnippet = await ytVideo.fetchYoutubeVideoMeta();
                    }
                    catch (_) {
                        continue;
                    }
                    if (videoSnippet.liveStreamingDetails) {
                        if (!videoSnippet.liveStreamingDetails.actualStartTime) {
                            if (!videoSnippet.liveStreamingDetails.scheduledStartTime) {
                                continue;
                            }
                            let schedule = moment(videoSnippet.liveStreamingDetails.scheduledStartTime);
                            ytVideo.live_at = schedule.toDate();
                            ytVideo.save();
                            schedule = schedule.subtract({ minute: 5 }).startOf('minute');
                            for (let sub of await websub.$get('subscriptions')) {
                                await sub.notify(SubscriptionManager_1.NotificationType.LIVE, ytVideo);
                            }
                            await Notification_1.Notification.create({
                                type: SubscriptionManager_1.NotificationType.STARTING,
                                video_id: id,
                                scheduled_at: schedule.toDate()
                            });
                            await Notification_1.Notification.create({
                                type: SubscriptionManager_1.NotificationType.LIVE,
                                video_id: id,
                                scheduled_at: new Date(),
                                notified_at: new Date(),
                            });
                            continue;
                        }
                        else if (videoSnippet.liveStreamingDetails.actualStartTime &&
                            !videoSnippet.liveStreamingDetails.actualEndTime) {
                            let subs = await websub.$get('subscriptions');
                            for (let sub of subs) {
                                await sub.notify(SubscriptionManager_1.NotificationType.STARTED, video);
                            }
                            await Notification_1.Notification.create({
                                type: SubscriptionManager_1.NotificationType.STARTED,
                                video_id: id,
                                scheduled_at: new Date(),
                                notified_at: new Date(),
                            });
                            continue;
                        }
                    }
                    for (let sub of await websub.$get('subscriptions')) {
                        await sub.notify(SubscriptionManager_1.NotificationType.VIDEO, ytVideo);
                    }
                    await Notification_1.Notification.create({
                        type: SubscriptionManager_1.NotificationType.VIDEO,
                        video_id: id,
                        scheduled_at: new Date(),
                        notified_at: new Date(),
                    });
                    continue;
                }
                if (ytVideo.deleted_at) {
                    continue;
                }
                let videoSnippet = await ytVideo.fetchYoutubeVideoMeta();
                if (!videoSnippet) {
                    continue;
                }
                if (!videoSnippet.liveStreamingDetails ||
                    !videoSnippet.liveStreamingDetails.scheduledStartTime) {
                    continue;
                }
                if (videoSnippet.liveStreamingDetails.actualStartTime) {
                    let subs = await websub.$get('subscriptions');
                    await Notification_1.Notification.destroy({
                        where: {
                            video_id: id,
                            type: SubscriptionManager_1.NotificationType.STARTING,
                        }
                    });
                    for (let sub of subs) {
                        await sub.notify(SubscriptionManager_1.NotificationType.STARTED, video);
                    }
                    await Notification_1.Notification.create({
                        type: SubscriptionManager_1.NotificationType.STARTED,
                        video_id: id,
                        scheduled_at: new Date(),
                        notified_at: new Date(),
                    });
                    continue;
                }
                let newLive = moment(videoSnippet.liveStreamingDetails.scheduledStartTime);
                if (!newLive.isSame(ytVideo.live_at)) {
                    ytVideo.live_at = newLive.toDate();
                    ytVideo.save();
                    let notifications = await Notification_1.Notification.findAll({
                        where: {
                            video_id: id,
                            type: SubscriptionManager_1.NotificationType.STARTING,
                        }
                    });
                    let schedule = newLive.subtract({ minute: 5 }).startOf('minute').toDate();
                    for (let notification of notifications) {
                        notification.scheduled_at = schedule;
                        notification.notified_at = null;
                        await notification.save();
                    }
                    let subs = await websub.$get('subscriptions');
                    for (let sub of subs) {
                        await sub.notify(SubscriptionManager_1.NotificationType.RESCHEDULE, ytVideo);
                    }
                    await Notification_1.Notification.create({
                        type: SubscriptionManager_1.NotificationType.RESCHEDULE,
                        video_id: id,
                        scheduled_at: new Date(),
                        notified_at: new Date(),
                    });
                }
            }
        }
    }
}
exports.WebSubController = WebSubController;

//# sourceMappingURL=WebSubController.js.map
