import {Channel, ChannelResolvable, TextBasedChannels} from "discord.js";
import {bot} from "../bot";
import {Subscription} from "../models/Subscription";
import {WebSub} from "../models/WebSub";
import {col, fn, where} from "sequelize";
import {catchLog} from "../utils/catchLog";
import {YoutubeVideo} from "../models/YoutubeVideo";
import {format, get as config} from "../config";
import cron = require("node-cron");
import moment = require("moment");

interface ChannelSubscribeOptions {
    notify_video?: boolean;
    notify_live?: boolean;
    notify_reschedule?: boolean;
    notify_starting?: boolean;
}

let booted = false;

export module SubscriptionManager {
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
        return new ChannelSubscriptionManager(ch as TextBasedChannels);
    }

    export function boot() {
        if (booted) return;
        booted = true;
        cron.schedule('* * * * *', catchLog(SubscriptionManager.checkNotification));
        cron.schedule('*/5 * * * *', catchLog(SubscriptionManager.checkVideoUpdates));
    }

    export async function checkNotification() {

    }

    export async function checkVideoUpdates() {

    }
}

class ChannelSubscriptionManager {
    protected _channel: TextBasedChannels;

    constructor(channel: TextBasedChannels) {
        this._channel = channel;
    }

    async hasSubscription(youtube_channel: string): Promise<boolean> {
        return await Subscription.count({
            include: [WebSub],
            where: {
                discord_channel_id: this._channel.id,
                '$web_subs.youtube_channel_id$': youtube_channel,
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
            websub_id: youtube_channel,
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
                '$web_subs.youtube_channel_id$': youtube_channel,
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
            let subs = await WebSub.findAll({
                include: [Subscription],
                group: ['websubs.id'],
                where: where(fn('COUNT', col('subscriptions.id')), '0')
            });
            for (let websub of subs) {
                await websub.subscribe('unsubscribe');
            }
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
                '$web_subs.youtube_channel_id$': youtube_channel,
            }
        });
    }

    async notify(type: NotificationType, subscription: Subscription, video: YoutubeVideo): Promise<boolean> {
        if (!subscription["notify_" + type]) {
            return false;
        }
        let meta = await video.fetchYoutubeVideoMeta();
        let data = {
            channel: meta.snippet.channelTitle,
            title: meta.snippet.title,
            url: video.url,
        }
        if (subscription.mention) {
            data['mentions'] = format(config('$.notifications.mentions'), {mentions: subscription.mention});
        }
        if (video.live_at) {
            data['schedule'] = moment(video.live_at)
                .locale(config('$.notification.locale'))
                .format(config('$.notification.timeFormat'));
        }
        let notification = format(config(`$.notification.${type}`), data);
        await this._channel.send(notification);
        return true;
    }
}

export enum NotificationType {
    VIDEO = 'video',
    LIVE = 'live',
    RESCHEDULE = 'reschedule',
    STARTING = 'starting',
}
