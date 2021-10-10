import { SnowflakeUtil } from "discord.js";
import { BeforeValidate, Column, HasMany, Model, Table } from "sequelize-typescript";
import { DataTypes } from "sequelize";
import { Notification } from "./Notification";
import { WebSub } from "./WebSub";

@Table({tableName: 'notificatons', createdAt: 'created_at', updatedAt: 'updated_at'})
export class Subscription extends Model<Subscription>{

    @BeforeValidate
    protected static makeId(self: WebSub) {
        if (!self.id) {
            self.id = SnowflakeUtil.generate() as any;
        }
    }

    @Column({type: DataTypes.BIGINT.UNSIGNED, primaryKey: true})
    public id: number;

    @Column({type: DataTypes.BIGINT.UNSIGNED, allowNull: false, unique: 'websub_notification_on_channel'})
    public discord_channel_id: number;
    
    @Column({type: DataTypes.BIGINT.UNSIGNED, allowNull: false, unique: 'websub_notification_on_channel'})
    public sub_id: number;

    @HasMany(()=>Notification, 'subscription_id')
    public notifications: Notification[];
}