import {SnowflakeUtil, TextBasedChannels} from "discord.js";
import {BeforeValidate, BelongsTo, Column, Model, Table} from "sequelize-typescript";
import {DataTypes} from "sequelize";
import {WebSub} from "./WebSub";
import {NotificationType, SubscriptionManager} from "../manager/SubscriptionManager";
import {YoutubeVideo} from "./YoutubeVideo";

@Table({
    tableName: 'subscriptions',
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [{
        name: 'websub_notification_on_channel',
        unique: true,
        fields: ['discord_channel_id', 'websub_id']
    }
    ]
})
export class Subscription extends Model<Subscription> {

    @BeforeValidate
    protected static makeId(self: WebSub) {
        if (!self.id) {
            self.id = SnowflakeUtil.generate() as any;
        }
    }

    @Column({type: DataTypes.BIGINT.UNSIGNED, primaryKey: true})
    public id: number;

    @Column({type: DataTypes.BIGINT.UNSIGNED, allowNull: true})
    public discord_guild_id: number;

    @Column({type: DataTypes.BIGINT.UNSIGNED, allowNull: false})
    public discord_channel_id: number;

    @Column({type: DataTypes.BIGINT.UNSIGNED, allowNull: false})
    public websub_id: number;

    @Column({type: DataTypes.JSON, allowNull: true})
    public mention: string[];

    @Column({type: DataTypes.BOOLEAN, defaultValue: true})
    public notify_video;

    @Column({type: DataTypes.BOOLEAN, defaultValue: true})
    public notify_live;

    @Column({type: DataTypes.BOOLEAN, defaultValue: true})
    public notify_reschedule;

    @Column({type: DataTypes.BOOLEAN, defaultValue: true})
    public notify_starting;

    @Column({type: DataTypes.BOOLEAN, defaultValue: true})
    public notify_started;

    @BelongsTo(() => WebSub, 'websub_id')
    public websub: WebSub;

    public notify(type: NotificationType, video: YoutubeVideo): Promise<boolean> {
        return SubscriptionManager.get(this.discord_channel_id.toString())
            .then(m => m.notify(type, this, video));
    }

    public static async tryFind(channel_id: string, channel: TextBasedChannels) {
        let websub = await WebSub.findOne({
            where: {
                youtube_channel: channel_id,
            }
        });
        if (!websub) {
            websub = new WebSub({
                youtube_channel: channel_id,
            });
        }
        let subscription = await Subscription.findOne({
            where: {
                sub_id: websub.id,
                discord_channel_id: channel.id,
            }
        });
        return {websub, subscription};
    }
}
