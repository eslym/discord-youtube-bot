import {BeforeValidate, Column, HasMany, Model, Table} from "sequelize-typescript";
import {DataTypes} from "sequelize";
import {SnowflakeUtil} from "discord.js";
import {YoutubeVideo} from "./YoutubeVideo";
import {Subscription} from "./Subscription";
import axios from "axios";
import {google, youtube_v3} from "googleapis";
import {logger} from "../logger";
import {redis} from "../redis";
import crypto = require("crypto");
import config = require("config");
import Schema$Channel = youtube_v3.Schema$Channel;

@Table({tableName: 'web_subs', createdAt: 'created_at', updatedAt: 'updated_at', collate: 'utf8_bin'})
export class WebSub extends Model<WebSub> {

    @BeforeValidate
    protected static makeId(self: WebSub) {
        if (!self.id) {
            self.id = SnowflakeUtil.generate() as any;
        }
        if (!self.secret) {
            self.secret = crypto.randomBytes(20).toString('base64');
        }
    }

    @Column({type: DataTypes.BIGINT.UNSIGNED, primaryKey: true})
    public id: number;

    @Column({type: DataTypes.STRING, allowNull: false})
    public youtube_channel_id: string;

    @Column({type: DataTypes.STRING, allowNull: false})
    public secret: string;

    @Column({type: DataTypes.DATE, allowNull: true})
    public created_at: Date;

    @Column({type: DataTypes.DATE, allowNull: true})
    public updated_at: Date;

    @Column({type: DataTypes.DATE, allowNull: true})
    public expires_at: Date;

    @HasMany(() => YoutubeVideo, {foreignKey: 'websub_id'})
    public videos: YoutubeVideo[];

    @HasMany(() => Subscription, {foreignKey: 'websub_id'})
    public subscriptions: Subscription[];

    public get topic_url(): string {
        let url = new URL('https://www.youtube.com/xml/feeds/videos.xml');
        let params = new URLSearchParams([['channel_id', this.youtube_channel_id]]);
        url.search = params.toString();
        return url.toString();
    }

    public async fetchYoutubeChannelMeta(): Promise<Schema$Channel> {
        let cache = await redis.get(`ytChannel:${this.youtube_channel_id}`);
        if (cache) {
            return JSON.parse(cache);
        }
        let res = await google.youtube('v3').channels.list({
            id: [this.youtube_channel_id],
            part: ['snippet', 'statistics'],
        });
        if (res.data.pageInfo.totalResults === 0) {
            return null;
        }
        await redis.set(
            `ytChannel:${this.youtube_channel_id}`,
            JSON.stringify(res.data.items[0]),
            {
                EX: 5
            }
        );
        return res.data.items[0];
    }

    public async subscribe(mode: 'subscribe' | 'unsubscribe' = 'subscribe') {
        let data = new URLSearchParams();
        data.append('hub.callback', `${config.get('websub.url')}/websub/${this.id}`);
        data.append('hub.mode', mode);
        data.append('hub.topic', this.topic_url);
        data.append('hub.secret', this.secret);
        await axios.post('https://pubsubhubbub.appspot.com/subscribe', data)
            .catch((_) => {
                logger.warn(`[WebSub] Failed to ${mode} ` + this.topic_url);
            });
    }
}