import {BeforeValidate, BelongsTo, Column, ForeignKey, Model, Table} from "sequelize-typescript";
import {YoutubeVideo} from "./YoutubeVideo";
import {DataTypes} from "sequelize";
import {WebSub} from "./WebSub";
import {SnowflakeUtil} from "discord.js";
import {NotificationType} from "../manager/SubscriptionManager";

@Table({tableName: 'notifications', createdAt: 'created_at', updatedAt: 'updated_at', collate: 'utf8_bin'})
export class Notification extends Model<Notification> {

    @BeforeValidate
    protected static makeId(self: WebSub) {
        if (!self.id) {
            self.id = SnowflakeUtil.generate() as any;
        }
    }

    @Column({type: DataTypes.BIGINT.UNSIGNED, primaryKey: true})
    public id: number;

    @Column({type: DataTypes.STRING, allowNull: false})
    public type: NotificationType;

    @ForeignKey(() => YoutubeVideo)
    @Column({type: DataTypes.STRING, allowNull: false})
    public video_id: string;

    @Column({type: DataTypes.DATE, allowNull: true})
    public scheduled_at: Date;

    @Column({type: DataTypes.DATE, allowNull: true})
    public notified_at: Date;

    @Column({type: DataTypes.DATE, allowNull: true})
    public created_at: Date;

    @Column({type: DataTypes.DATE, allowNull: true})
    public updated_at: Date;

    @BelongsTo(() => YoutubeVideo, {foreignKey: 'video_id', onDelete: 'cascade', onUpdate: 'restrict'})
    public video: YoutubeVideo;
}
