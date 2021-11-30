"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationType = exports.SubscriptionManager = void 0;
const bot_1 = require("../bot");
const Subscription_1 = require("../models/Subscription");
const WebSub_1 = require("../models/WebSub");
const sequelize_1 = require("sequelize");
const catchLog_1 = require("../utils/catchLog");
const YoutubeVideo_1 = require("../models/YoutubeVideo");
const config_1 = require("../config");
const Notification_1 = require("../models/Notification");
const logger_1 = require("../logger");
const googleapis_1 = require("googleapis");
const cron = require("node-cron");
const moment = require("moment");
let booted = false;
var SubscriptionManager;
(function (SubscriptionManager) {
    async function get(channel) {
        let ch = channel;
        if (typeof channel === 'string') {
            ch = bot_1.bot.channels.resolve(channel);
            if (!ch) {
                ch = await bot_1.bot.channels.fetch(channel);
            }
            if (!ch) {
                return null;
            }
        }
        if (ch.type !== 'DM' && ch.type !== 'GUILD_TEXT' && ch.type !== 'GUILD_NEWS') {
            throw new TypeError('Channel is not text based.');
        }
        return new Manager(ch);
    }
    SubscriptionManager.get = get;
    function boot() {
        if (booted)
            return;
        booted = true;
        cron.schedule('* * * * *', (0, catchLog_1.catchLog)(SubscriptionManager.checkNotification));
        cron.schedule('*/5 * * * *', (0, catchLog_1.catchLog)(SubscriptionManager.checkVideoUpdates));
    }
    SubscriptionManager.boot = boot;
    async function checkNotification() {
        let notifications = await Notification_1.Notification.findAll({
            include: [YoutubeVideo_1.YoutubeVideo],
            where: {
                type: NotificationType.STARTING,
                scheduled_at: { [sequelize_1.Op.lte]: new Date() },
                notified_at: null,
            }
        });
        for (let notification of notifications) {
            try {
                let video = notification.video;
                let websub = await video.$get('subscription');
                let subscriptions = await websub.get('subscriptions');
                for (let sub of subscriptions) {
                    await sub.notify(notification.type, video);
                }
                notification.notified_at = new Date();
                notification.save();
            }
            catch (error) {
                logger_1.logger.warn(error);
            }
        }
    }
    SubscriptionManager.checkNotification = checkNotification;
    async function checkVideoUpdates() {
        let videos = await YoutubeVideo_1.YoutubeVideo.findAll({
            include: [Notification_1.Notification],
            where: {
                live_at: { [sequelize_1.Op.gt]: new Date() },
                '$notifications.notified_at$': null,
            }
        });
        if (videos.length === 0) {
            return;
        }
        let ids = videos.map(v => v.video_id);
        let dict = Object
            .fromEntries(videos.map(v => [v.video_id, v]));
        let res = await googleapis_1.google.youtube('v3').videos.list({
            id: ids, part: ['id', 'liveStreamingDetails']
        });
        for (let schema of res.data.items) {
            if (!schema.liveStreamingDetails ||
                !schema.liveStreamingDetails.scheduledStartTime ||
                schema.liveStreamingDetails.actualStartTime) {
                continue;
            }
            let newLive = moment(schema.liveStreamingDetails.scheduledStartTime);
            let video = dict[schema.id];
            if (!newLive.isSame(video.live_at)) {
                video.live_at = newLive.toDate();
                video.save();
                let notifications = await Notification_1.Notification.findAll({
                    where: {
                        video_id: schema.id,
                        type: NotificationType.STARTING,
                    }
                });
                let schedule = newLive.subtract({ minute: 5 }).startOf('minute').toDate();
                for (let notification of notifications) {
                    notification.scheduled_at = schedule;
                    notification.notified_at = null;
                    await notification.save();
                }
                let websub = await video.$get('subscription');
                let subs = await websub.$get('subscriptions');
                for (let sub of subs) {
                    await sub.notify(NotificationType.RESCHEDULE, video);
                }
                await Notification_1.Notification.create({
                    type: NotificationType.RESCHEDULE,
                    video_id: schema.id,
                    scheduled_at: new Date()
                });
            }
        }
    }
    SubscriptionManager.checkVideoUpdates = checkVideoUpdates;
})(SubscriptionManager = exports.SubscriptionManager || (exports.SubscriptionManager = {}));
class Manager {
    constructor(channel) {
        this._channel = channel;
    }
    getChannel() {
        return this._channel;
    }
    async hasSubscription(youtube_channel) {
        return await Subscription_1.Subscription.count({
            include: [WebSub_1.WebSub],
            where: {
                discord_channel_id: this._channel.id,
                '$websub.youtube_channel_id$': youtube_channel,
            }
        }) > 0;
    }
    async subscribe(youtube_channel, options) {
        let data = {
            youtube_channel_id: youtube_channel
        };
        let [websub, created] = await WebSub_1.WebSub.findOrCreate({
            where: data,
            defaults: data,
        });
        data = {
            websub_id: websub.id,
            discord_channel_id: this._channel.id,
        };
        if (this._channel.type !== 'DM') {
            data.discord_guild_id = this._channel.guildId;
        }
        let [_, newSub] = await Subscription_1.Subscription.findOrCreate({
            where: data,
            defaults: {
                ...data, ...options
            },
        });
        if (created) {
            await websub.subscribe();
        }
        return newSub;
    }
    async unsubscribe(youtube_channel) {
        let subscription = await Subscription_1.Subscription.findOne({
            include: [WebSub_1.WebSub],
            where: {
                discord_channel_id: this._channel.id,
                '$websub.youtube_channel_id$': youtube_channel,
            }
        });
        if (!subscription) {
            return false;
        }
        let websub = subscription.websub;
        await subscription.destroy();
        if (await websub.$count('subscriptions') === 0) {
            await websub.subscribe('unsubscribe');
        }
        return true;
    }
    async unsubscribeAll() {
        let destroyed = await Subscription_1.Subscription.destroy({
            where: {
                discord_channel_id: this._channel.id,
            }
        });
        if (destroyed > 0) {
            let subs = await WebSub_1.WebSub.findAll({
                include: [Subscription_1.Subscription],
                group: ['websub.id'],
                where: (0, sequelize_1.where)((0, sequelize_1.fn)('COUNT', (0, sequelize_1.col)('subscription.id')), '0')
            });
            for (let websub of subs) {
                await websub.subscribe('unsubscribe');
            }
        }
        return destroyed;
    }
    async listSubscription() {
        return Subscription_1.Subscription.findAll({
            include: [WebSub_1.WebSub],
            where: {
                discord_channel_id: this._channel.id,
            }
        });
    }
    async getSubscription(youtube_channel) {
        return Subscription_1.Subscription.findOne({
            include: [WebSub_1.WebSub],
            where: {
                discord_channel_id: this._channel.id,
                '$websub.youtube_channel_id$': youtube_channel,
            }
        });
    }
    async notify(type, subscription, video) {
        if (!subscription["notify_" + type]) {
            return false;
        }
        let meta = await video.fetchYoutubeVideoMeta();
        let data = {
            channel: meta.snippet.channelTitle,
            title: meta.snippet.title,
            url: video.url,
        };
        if (subscription.mention && subscription.mention.length > 0) {
            data['mentions'] = (0, config_1.format)((0, config_1.get)('$.notification.mentions'), {
                mentions: subscription.mention.map(m => `<@&${m}>`).join('')
            });
        }
        if (video.live_at) {
            data['schedule'] = moment(video.live_at)
                .locale((0, config_1.get)('$.notification.locale'))
                .format((0, config_1.get)('$.notification.timeFormat'));
        }
        let notification = (0, config_1.format)((0, config_1.get)(`$.notification.${type}`), data);
        await this._channel.send(notification);
        return true;
    }
}
var NotificationType;
(function (NotificationType) {
    NotificationType["VIDEO"] = "video";
    NotificationType["LIVE"] = "live";
    NotificationType["RESCHEDULE"] = "reschedule";
    NotificationType["STARTING"] = "starting";
})(NotificationType = exports.NotificationType || (exports.NotificationType = {}));

//# sourceMappingURL=SubscriptionManager.js.map
