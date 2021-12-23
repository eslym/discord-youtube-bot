import {Channel, ChannelResolvable, Guild, TextBasedChannels} from "discord.js";
import {bot} from "../bot";
import {Subscription} from "../models/Subscription";
import {WebSub} from "../models/WebSub";
import {col, fn, Op} from "sequelize";
import {catchLog} from "../utils/catchLog";
import {YoutubeVideo} from "../models/YoutubeVideo";
import {format} from "../format";
import {Notification} from "../models/Notification";
import {logger} from "../logger";
import {google} from "googleapis";
import cron = require("node-cron");
import moment = require("moment");
import config = require('config');
import {redis} from "../redis";

interface ChannelSubscribeOptions {
    notify_video?: boolean;
    notify_live?: boolean;
    notify_reschedule?: boolean;
    notify_starting?: boolean;
}

let booted = false;

async function cleanUpWebSub() {
    let subs = await WebSub.findAll({
        attributes: {
            include: ['WebSub.id', [fn('COUNT', col('subscriptions.id')), 'subs']],
            exclude: Object.keys(WebSub.rawAttributes).filter(k => k !== 'id'),
        },
        include: [{
            model: Subscription,
            attributes: {exclude: Object.keys(Subscription.rawAttributes)}
        }],
        group: ['WebSub.id'],
        having: {
            subs: 0
        }
    });
    subs = await WebSub.findAll({
        where: {
            id: {[Op.in]: subs.map(s => s.id)}
        }
    });
    for (let websub of subs) {
        await websub.subscribe('unsubscribe');
    }
}

export module SubscriptionManager {
    import Dict = NodeJS.Dict;

    export async function get(channel: ChannelResolvable): Promise<ChannelSubscriptionManager> {
        let ch = channel as Channel;
        if (typeof channel === 'string') {
            ch = bot.channels.resolve(channel);
            if (!ch) {
                ch = await bot.channels.fetch(channel);
            }
            if (!ch) {
                return null;
            }
        }
        if (ch.type !== 'DM' && ch.type !== 'GUILD_TEXT' && ch.type !== 'GUILD_NEWS') {
            throw new TypeError('Channel is not text based.');
        }
        return new Manager(ch as TextBasedChannels);
    }

    export function boot() {
        if (booted) return;
        booted = true;
        cron.schedule('* * * * *', catchLog(SubscriptionManager.checkNotification));
        cron.schedule('*/5 * * * *', catchLog(SubscriptionManager.checkVideoUpdates));
        bot.on('guildDelete', catchLog(async (guild: Guild) => {
            let destroyed = await Subscription.destroy({
                where: {
                    discord_guild_id: guild.id,
                }
            });
            if (destroyed > 0) {
                await cleanUpWebSub();
            }
        }));
    }

    export async function checkNotification() {
        let notifications = await Notification.findAll({
            include: [YoutubeVideo],
            where: {
                type: NotificationType.STARTING,
                scheduled_at: {[Op.lte]: new Date()},
                notified_at: null,
            }
        });
        let ids = notifications.map(n=>n.video_id);
        let res = await google.youtube('v3').videos.list({
            id: ids, part: ['id', 'snippet', 'liveStreamingDetails']
        });
        for (let schema of res.data.items) {
            await redis.set(
                `ytVideo:${schema.id}`,
                JSON.stringify(schema),
                {
                    EX: 5
                }
            );
        }
        for (let notification of notifications) {
            try {
                let video = notification.video;
                logger.log(`Sending scheduled notification for '${video.video_id}'`);
                let schema = await video.fetchYoutubeVideoMeta();
                let websub = await video.$get('subscription');
                let subscriptions = await websub.$get('subscriptions');
                if(schema.liveStreamingDetails.actualStartTime){
                    logger.log(`Video '${video.video_id}' started before notification.`);
                    notification.type = NotificationType.STARTED;
                }
                for (let sub of subscriptions) {
                    await sub.notify(notification.type, video);
                }
                notification.notified_at = new Date();
                notification.save();
            } catch (error) {
                logger.warn(error);
            }
        }
    }

    export async function checkVideoUpdates() {
        logger.log('Checking for video updates.');
        let videos = await YoutubeVideo.findAll({
            include: [Notification],
            where: {
                live_at: {[Op.gt]: new Date()},
                '$notifications.notified_at$': null,
            }
        });
        if (videos.length === 0) {
            logger.log('No video is pending for checking, skipping.');
            return;
        }
        let ids = videos.map(v => v.video_id);
        let dict: Dict<YoutubeVideo> = Object
            .fromEntries(videos.map(v => [v.video_id, v]));
        let res = await google.youtube('v3').videos.list({
            id: ids, part: ['id', 'snippet', 'liveStreamingDetails']
        });
        for (let schema of res.data.items) {
            if (
                !schema.liveStreamingDetails ||
                !schema.liveStreamingDetails.scheduledStartTime
            ) {
                continue;
            }
            await redis.set(
                `ytVideo:${schema.id}`,
                JSON.stringify(schema),
                {
                    EX: 5
                }
            );
            let video = dict[schema.id];
            if (schema.liveStreamingDetails.actualStartTime){
                logger.log(`Video '${schema.id}' started before notification.`);
                await Notification.destroy({
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
                await Notification.create({
                    type: NotificationType.STARTED,
                    video_id: schema.id,
                    scheduled_at: new Date(),
                    notified_at: new Date(),
                });
                continue;
            }
            let newLive = moment(schema.liveStreamingDetails.scheduledStartTime);
            if (!newLive.isSame(video.live_at)) {
                logger.log(`Video '${schema.id}' re-scheduled.`);
                video.live_at = newLive.toDate();
                video.save();
                let notifications = await Notification.findAll({
                    where: {
                        video_id: schema.id,
                        type: NotificationType.STARTING,
                    }
                });
                let schedule = newLive.subtract({minute: 5}).startOf('minute').toDate();
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
                await Notification.create({
                    type: NotificationType.RESCHEDULE,
                    video_id: schema.id,
                    scheduled_at: new Date()
                });
            }
        }
    }
}

export interface ChannelSubscriptionManager {
    getChannel(): TextBasedChannels;

    hasSubscription(youtube_channel: string): Promise<boolean>;

    subscribe(youtube_channel: string, options?: ChannelSubscribeOptions): Promise<boolean>;

    unsubscribe(youtube_channel: string): Promise<boolean>;

    unsubscribeAll(): Promise<number>;

    listSubscription(): Promise<Subscription[]>;

    getSubscription(youtube_channel: string): Promise<Subscription>;

    notify(type: NotificationType, subscription: Subscription, video: YoutubeVideo): Promise<boolean>;
}

class Manager implements ChannelSubscriptionManager {
    protected _channel: TextBasedChannels;

    constructor(channel: TextBasedChannels) {
        this._channel = channel;
    }

    getChannel() {
        return this._channel;
    }

    async hasSubscription(youtube_channel: string): Promise<boolean> {
        return await Subscription.count({
            include: [WebSub],
            where: {
                discord_channel_id: this._channel.id,
                '$websub.youtube_channel_id$': youtube_channel,
            }
        }) > 0;
    }

    async subscribe(youtube_channel: string, options?: ChannelSubscribeOptions): Promise<boolean> {
        let data: any = {
            youtube_channel_id: youtube_channel
        };
        let [websub, created] = await WebSub.findOrCreate({
            where: data,
            defaults: data,
        });
        data = {
            websub_id: websub.id,
            discord_channel_id: this._channel.id,
        }
        if (this._channel.type !== 'DM') {
            data.discord_guild_id = this._channel.guildId;
        }
        let [_, newSub] = await Subscription.findOrCreate({
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

    async unsubscribe(youtube_channel: string): Promise<boolean> {
        let subscription = await Subscription.findOne({
            include: [WebSub],
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

    async unsubscribeAll(): Promise<number> {
        let destroyed = await Subscription.destroy({
            where: {
                discord_channel_id: this._channel.id,
            }
        });
        if (destroyed > 0) {
            await cleanUpWebSub();
        }
        return destroyed;
    }

    async listSubscription(): Promise<Subscription[]> {
        return Subscription.findAll({
            include: [WebSub],
            where: {
                discord_channel_id: this._channel.id,
            }
        });
    }

    async getSubscription(youtube_channel: string): Promise<Subscription> {
        return Subscription.findOne({
            include: [WebSub],
            where: {
                discord_channel_id: this._channel.id,
                '$websub.youtube_channel_id$': youtube_channel,
            }
        });
    }

    async notify(type: NotificationType, subscription: Subscription, video: YoutubeVideo): Promise<boolean> {
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
        await this._channel.send(format[type](notification).trim());
        return true;
    }
}

export enum NotificationType {
    VIDEO = 'video',
    LIVE = 'live',
    RESCHEDULE = 'reschedule',
    STARTING = 'starting',
    STARTED = 'started',
}
