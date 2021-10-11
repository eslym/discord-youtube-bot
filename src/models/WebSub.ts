import {BeforeValidate, Column, HasMany, Model, Table} from "sequelize-typescript";
import {DataTypes} from "sequelize";
import {SnowflakeUtil} from "discord.js";
import {YoutubeVideo} from "./YoutubeVideo";
import {Subscription} from "./Subscription";
import axios from "axios";
import {get as config} from "../config";
import {google, youtube_v3} from "googleapis";
import {logger} from "../logger";
import crypto = require("crypto");

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

    @Column({type: DataTypes.STRING, allowNull: false, unique: true})
    public youtube_channel: string;

    @Column({type: DataTypes.STRING, allowNull: false})
    public secret: string;

    @Column({type: DataTypes.DATE, allowNull: true})
    public created_at: Date;

    @Column({type: DataTypes.DATE, allowNull: true})
    public updated_at: Date;

    @Column({type: DataTypes.DATE, allowNull: true})
    public expires_at: Date;

    @HasMany(() => YoutubeVideo, {foreignKey: 'sub_id'})
    public videos: YoutubeVideo[];

    @HasMany(() => Subscription, {foreignKey: 'sub_id'})
    public subscriptions: Subscription[];

    public get topic_url(): string {
        let url = new URL('https://www.youtube.com/xml/feeds/videos.xml');
        let params = new URLSearchParams([['channel_id', this.youtube_channel]]);
        url.search = params.toString();
        return url.toString();
    }

    public async fetchSnippet(): Promise<youtube_v3.Schema$Channel>{
        try{
            let res = await google.youtube('v3').channels.list({
                id: [this.youtube_channel],
                part: ['snippet'],
            });
            return res.data.items[0];
        } catch (_) {
            return null;
        }
    }

    public async subscribe(mode: 'subscribe' | 'unsubscribe' = 'subscribe') {
        let data = new URLSearchParams();
        data.append('hub.callback', `${config('websub.url')}/websub/${this.id}`);
        data.append('hub.mode', mode);
        data.append('hub.topic', this.topic_url);
        data.append('hub.secret', this.secret);
        await axios.post('https://pubsubhubbub.appspot.com/subscribe', data)
            .catch((_) => {
                logger.warn(`[WebSub] Failed to ${mode} ` + this.topic_url);
            });
    }
}