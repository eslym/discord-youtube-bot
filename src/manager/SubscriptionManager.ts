import {Channel, ChannelResolvable, TextBasedChannels} from "discord.js";
import {bot} from "../bot";
import {Subscription} from "../models/Subscription";
import {WebSub} from "../models/WebSub";

export module SubscriptionManager {
    export async function get(channel: ChannelResolvable){
        let ch = channel as Channel;
        if(typeof channel === 'string'){
            ch = bot.channels.resolve(channel);
            if(!ch){
                ch = await bot.channels.fetch(channel);
            }
            if(!ch){
                return null;
            }
        }
        if(ch.type !== 'DM' && ch.type !== 'GUILD_TEXT' && ch.type !== 'GUILD_NEWS'){
            throw new TypeError('Channel is not text based.');
        }
        return new ChannelSubscriptionManager(ch as TextBasedChannels);
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
            where:{
               discord_channel_id: this._channel.id,
                '$web_subs.youtube_channel_id$': youtube_channel,
            }
        }) > 0;
    }

    async subscribe(youtube_channel: string): Promise<boolean> {
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
        if(this._channel.type !== 'DM'){
            data.discord_guild_id = this._channel.guildId;
        }
        let [_, newSub] = await Subscription.findOrCreate({
            where: data,
            defaults: data,
        });
        if(created){
            await websub.subscribe();
        }
        return newSub;
    }

    async unsubscribeAll(){

    }
}