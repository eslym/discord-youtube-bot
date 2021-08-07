import {BelongsTo, Column, ForeignKey, HasMany, Model, Table} from "sequelize-typescript";
import {DataTypes} from "sequelize";
import {WebSub} from "./WebSub";
import { Notification } from "./Notification";

@Table({tableName: 'youtube_videos', createdAt: 'created_at', updatedAt: 'updated_at', collate: 'utf8_bin'})
export class YoutubeVideo extends Model<YoutubeVideo> {

    @Column({type: DataTypes.STRING, primaryKey: true})
    public video_id: string;

    @ForeignKey(() => WebSub)
    @Column({type: DataTypes.BIGINT.UNSIGNED, allowNull: false})
    public sub_id: number;

    @Column({type: DataTypes.STRING, allowNull: false})
    public youtube_channel: string;

    @Column({type: DataTypes.DATE, allowNull: true})
    public live_at: Date;

    @Column({type: DataTypes.DATE, allowNull: true})
    public deleted_at: Date;

    @Column({type: DataTypes.DATE, allowNull: true})
    public created_at: Date;

    @Column({type: DataTypes.DATE, allowNull: true})
    public updated_at: Date;

    @BelongsTo(() => WebSub, {foreignKey: 'sub_id', onDelete: 'cascade', onUpdate: 'restrict'})
    public subscription: WebSub;

    @HasMany(() => Notification, 'video_id')
    public notifications: Notification[];
}
