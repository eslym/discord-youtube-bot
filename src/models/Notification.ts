import {BeforeValidate, BelongsTo, Column, ForeignKey, Model, Table} from "sequelize-typescript";
import {Subscription} from "./Subscription";
import {YoutubeVideo} from "./YoutubeVideo";
import {DataTypes} from "sequelize";
import {WebSub} from "./WebSub";
import {SnowflakeUtil} from "discord.js";

@Table({tableName: 'notifications', createdAt: 'created_at', updatedAt: 'updated_at', collate: 'utf8_bin'})
export class Notification extends Model<Notification>{

    @BeforeValidate
    protected static makeId(self: WebSub) {
        if (!self.id) {
            self.id = SnowflakeUtil.generate() as any;
        }
    }
    
    @Column({type: DataTypes.BIGINT.UNSIGNED, primaryKey: true})
    public id: number;

    @ForeignKey(() => Subscription)
    @Column({type: DataTypes.BIGINT.UNSIGNED, allowNull: false, unique: 'video_notification_on_subscription'})
    public subscription_id: number;

    @ForeignKey(() => YoutubeVideo)
    @Column({type: DataTypes.STRING, allowNull: false, unique: 'video_notification_on_subscription'})
    public video_id: string;

    @Column({type: DataTypes.DATE, allowNull: true})
    public scheduled_at: Date;

    @Column({type: DataTypes.DATE, allowNull: true})
    public notified_at: Date;

    @Column({type: DataTypes.DATE, allowNull: true})
    public created_at: Date;

    @Column({type: DataTypes.DATE, allowNull: true})
    public updated_at: Date;

    @BelongsTo(()=>YoutubeVideo, {foreignKey: 'video_id', onDelete: 'cascade', onUpdate: 'restrict'})
    public video: YoutubeVideo;

    @BelongsTo(()=>Subscription, {foreignKey: 'subscription_id', onDelete: 'cascade', onUpdate: 'restrict'})
    public subscription: Subscription;
}
