import {BeforeValidate, Column, HasMany, Model, Table} from "sequelize-typescript";
import {DataTypes} from "sequelize";
import {parseStringPromise as parsexml} from "xml2js";
import {SnowflakeUtil} from "discord.js";
import crypto = require("crypto");
import {YoutubeVideo} from "./YoutubeVideo";
import { Subscription } from "./Subscription";

const fetch = require("node-fetch");

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
    public youtube_channel: string;

    @Column({type: DataTypes.STRING, allowNull: false})
    public secret: string;

    @Column({type: DataTypes.TEXT, allowNull: false})
    public message: string;

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

    public get rss_url(): string {
        let url = new URL('https://www.youtube.com/feeds/videos.xml');
        let params = new URLSearchParams([['channel_id', this.youtube_channel]]);
        url.search = params.toString();
        return url.toString();
    }

    public get youtube_url(): string {
        return `https://www.youtube.com/channel/${this.youtube_channel}`;
    }

    public async getTitle(): Promise<string | null> {
        try {
            let res = await fetch(this.rss_url);
            let xml = await res.text();
            let data = await parsexml(xml);
            return data.feed.title;
        } catch (_) {
            return null;
        }
    }

    public async subscribe(mode: 'subscribe' | 'unsubscribe' = 'subscribe') {
        let data = new URLSearchParams();
        data.append('hub.callback', `${process.env.WEBSUB_CALLBACK}/${this.id}`);
        data.append('hub.mode', mode);
        data.append('hub.topic', this.topic_url);
        data.append('hub.secret', this.secret);
        await fetch('https://pubsubhubbub.appspot.com/subscribe', {
            method: 'post',
            body: data,
        }).catch((_) => {
            console.error("Failed to subscribe " + this.topic_url);
        });
    }
}