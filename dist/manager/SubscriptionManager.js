"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationType = exports.SubscriptionManager = void 0;
const bot_1 = require("../bot");
const Subscription_1 = require("../models/Subscription");
const WebSub_1 = require("../models/WebSub");
const sequelize_1 = require("sequelize");
const catchLog_1 = require("../utils/catchLog");
const YoutubeVideo_1 = require("../models/YoutubeVideo");
const format_1 = require("../format");
const Notification_1 = require("../models/Notification");
const logger_1 = require("../logger");
const googleapis_1 = require("googleapis");
const cron = require("node-cron");
const moment = require("moment");
const config = require("config");
const redis_1 = require("../redis");
let booted = false;
async function cleanUpWebSub() {
    let subs = await WebSub_1.WebSub.findAll({
        attributes: {
            include: ['WebSub.id', [(0, sequelize_1.fn)('COUNT', (0, sequelize_1.col)('subscriptions.id')), 'subs']],
            exclude: Object.keys(WebSub_1.WebSub.rawAttributes).filter(k => k !== 'id'),
        },
        include: [{
                model: Subscription_1.Subscription,
                attributes: { exclude: Object.keys(Subscription_1.Subscription.rawAttributes) }
            }],
        group: ['WebSub.id'],
        having: {
            subs: 0
        }
    });
    subs = await WebSub_1.WebSub.findAll({
        where: {
            id: { [sequelize_1.Op.in]: subs.map(s => s.id) }
        }
    });
    for (let websub of subs) {
        await websub.subscribe('unsubscribe');
    }
}
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
        bot_1.bot.on('guildDelete', (0, catchLog_1.catchLog)(async (guild) => {
            let destroyed = await Subscription_1.Subscription.destroy({
                where: {
                    discord_guild_id: guild.id,
                }
            });
            if (destroyed > 0) {
                await cleanUpWebSub();
            }
        }));
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
        let ids = notifications.map(n => n.video_id);
        let res = await googleapis_1.google.youtube('v3').videos.list({
            id: ids, part: ['id', 'snippet', 'liveStreamingDetails']
        });
        for (let schema of res.data.items) {
            await redis_1.redis.set(`ytVideo:${schema.id}`, JSON.stringify(schema), {
                EX: 5
            });
        }
        for (let notification of notifications) {
            try {
                let video = notification.video;
                logger_1.logger.log(`Sending scheduled notification for '${video.video_id}'`);
                let schema = await video.fetchYoutubeVideoMeta();
                let websub = await video.$get('subscription');
                let subscriptions = await websub.$get('subscriptions');
                if (schema.liveStreamingDetails.actualStartTime) {
                    logger_1.logger.log(`Video '${video.video_id}' started before notification.`);
                    notification.type = NotificationType.STARTED;
                }
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
        logger_1.logger.log('Checking for video updates.');
        let videos = await YoutubeVideo_1.YoutubeVideo.findAll({
            include: [Notification_1.Notification],
            where: {
                live_at: { [sequelize_1.Op.gt]: new Date() },
                '$notifications.notified_at$': null,
            }
        });
        if (videos.length === 0) {
            logger_1.logger.log('No video is pending for checking, skipping.');
            return;
        }
        let ids = videos.map(v => v.video_id);
        let dict = Object
            .fromEntries(videos.map(v => [v.video_id, v]));
        let res = await googleapis_1.google.youtube('v3').videos.list({
            id: ids, part: ['id', 'snippet', 'liveStreamingDetails']
        });
        for (let schema of res.data.items) {
            if (!schema.liveStreamingDetails ||
                !schema.liveStreamingDetails.scheduledStartTime) {
                continue;
            }
            await redis_1.redis.set(`ytVideo:${schema.id}`, JSON.stringify(schema), {
                EX: 5
            });
            let video = dict[schema.id];
            if (schema.liveStreamingDetails.actualStartTime) {
                logger_1.logger.log(`Video '${schema.id}' started before notification.`);
                await Notification_1.Notification.destroy({
                    where: {
                        video_id: schema.id,
                        type: NotificationType.STARTING,
                    }
                });
                let websub = await video.$get('subscription');
                let subs = await websub.$get('subscriptions');
                for (let sub of subs) {
                    await sub.notify(NotificationType.STARTED, video);
                }
                await Notification_1.Notification.create({
                    type: NotificationType.STARTED,
                    video_id: schema.id,
                    scheduled_at: new Date(),
                    notified_at: new Date(),
                });
                continue;
            }
            let newLive = moment(schema.liveStreamingDetails.scheduledStartTime);
            if (!newLive.isSame(video.live_at)) {
                logger_1.logger.log(`Video '${schema.id}' re-scheduled.`);
                video.live_at = newLive.toDate();
                video.save();
                let notifications = await Notification_1.Notification.findAll({
                    where: {
                        video_id: schema.id,
                        type: NotificationType.STARTING,
                    }
                });
                let schedule = newLive.subtract({ minute: 5 }).startOf('minute').toDate();
                if (notifications.length > 0) {
                    for (let notification of notifications) {
                        notification.scheduled_at = schedule;
                        notification.notified_at = null;
                        await notification.save();
                    }
                }
                else {
                    await Notification_1.Notification.create({
                        type: NotificationType.STARTING,
                        video_id: schema.id,
                        scheduled_at: schedule,
                    });
                }
                let websub = await video.$get('subscription');
                let subs = await websub.$get('subscriptions');
                for (let sub of subs) {
                    await sub.notify(NotificationType.RESCHEDULE, video);
                }
                await Notification_1.Notification.create({
                    type: NotificationType.RESCHEDULE,
                    video_id: schema.id,
                    scheduled_at: new Date(),
                    notified_at: new Date(),
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
            await cleanUpWebSub();
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
        let notification = {
            mentions: subscription.mention ?? [],
            channel: meta.snippet.channelTitle,
            title: meta.snippet.title,
            url: video.url,
        };
        if (video.live_at) {
            notification['schedule'] = moment(video.live_at)
                .locale(config.get('notification.locale'))
                .format(config.get('notification.timeFormat'));
        }
        await this._channel.send(format_1.format[type](notification).trim());
        return true;
    }
}
var NotificationType;
(function (NotificationType) {
    NotificationType["VIDEO"] = "video";
    NotificationType["LIVE"] = "live";
    NotificationType["RESCHEDULE"] = "reschedule";
    NotificationType["STARTING"] = "starting";
    NotificationType["STARTED"] = "started";
})(NotificationType = exports.NotificationType || (exports.NotificationType = {}));

//# sourceMappingURL=SubscriptionManager.js.map
