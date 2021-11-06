import {BelongsTo, Column, ForeignKey, HasMany, Model, Table} from "sequelize-typescript";
import {DataTypes} from "sequelize";
import {WebSub} from "./WebSub";
import {Notification} from "./Notification";
import {google, youtube_v3} from "googleapis";
import {redis} from "../redis";
import {NotificationType} from "../manager/SubscriptionManager";
import Schema$Video = youtube_v3.Schema$Video;

@Table({tableName: 'youtube_videos', createdAt: 'created_at', updatedAt: 'updated_at', collate: 'utf8_bin'})
export class YoutubeVideo extends Model<YoutubeVideo> {

    @Column({type: DataTypes.STRING, primaryKey: true})
    public video_id: string;

    @ForeignKey(() => WebSub)
    @Column({type: DataTypes.BIGINT.UNSIGNED, allowNull: false})
    public websub_id: number;

    @Column({type: DataTypes.STRING, allowNull: false})
    public type: NotificationType;

    @Column({type: DataTypes.DATE, allowNull: true})
    public live_at: Date;

    @Column({type: DataTypes.DATE, allowNull: true})
    public deleted_at: Date;

    @Column({type: DataTypes.DATE, allowNull: true})
    public created_at: Date;

    @Column({type: DataTypes.DATE, allowNull: true})
    public updated_at: Date;

    @BelongsTo(() => WebSub, {foreignKey: 'websub_id', onDelete: 'cascade', onUpdate: 'restrict'})
    public subscription: WebSub;

    @HasMany(() => Notification, 'video_id')
    public notifications: Notification[];

    public get url(): string {
        return `https://www.youtube.com/watch?v=${this.video_id}`;
    }

    public async fetchYoutubeVideoMeta(): Promise<Schema$Video> {
        let cache = await redis.get(`ytVideo:${this.video_id}`);
        if (cache) {
            return JSON.parse(cache);
        }
        let res = await google.youtube('v3').videos.list({
            id: [this.video_id],
            part: ['snippet', 'liveStreamingDetails']
        });
        if (res.data.pageInfo.totalResults === 0) {
            return null;
        }
        await redis.set(
            `ytVideo:${this.video_id}`,
            JSON.stringify(res.data.items[0]),
            {
                EX: 5
            }
        );
        return res.data.items[0];
    }
}
