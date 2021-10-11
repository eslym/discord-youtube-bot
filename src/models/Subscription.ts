import {SnowflakeUtil, TextChannel} from "discord.js";
import { BeforeValidate, Column, HasMany, Model, Table } from "sequelize-typescript";
import { DataTypes } from "sequelize";
import { Notification } from "./Notification";
import { WebSub } from "./WebSub";
import {bot} from "../bot";
import moment = require("moment");

@Table({tableName: 'subscriptions', createdAt: 'created_at', updatedAt: 'updated_at'})
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

    @Column({type: DataTypes.STRING, allowNull: true})
    public mention: string;

    @HasMany(()=>Notification, 'subscription_id')
    public notifications: Notification[];

    public async notifyPublish(video_url: string, channel_title: string, live?: Date){
        let channel = await bot.channels.fetch(this.discord_channel_id.toString()) as TextChannel;
        let notification = `${channel_title} has publish a new video.\n${video_url}`;
        if(live){
            let schedule = moment(live).format("D MMM YYYY, HH:MM");
            notification = `${channel_title} scheduled a live streaming at ${schedule}\n${video_url}`;
        }
        if(this.mention) {
            notification = this.mention + notification;
        }
        await channel.send(notification);
    }

    public async notifyReschedule(video_url: string, channel_title: string, live: Date){
        let channel = await bot.channels.fetch(this.discord_channel_id.toString()) as TextChannel;
        let schedule = moment(live).format("D MMM YYYY, HH:MM");
        let notification = `${channel_title} re-scheduled a live streaming to ${schedule}\n${video_url}`;
        if(this.mention) {
            notification = this.mention + notification;
        }
        await channel.send(notification);
    }

    public async notifyStarting(video_url: string, channel_title: string){
        let channel = await bot.channels.fetch(this.discord_channel_id.toString()) as TextChannel;
        let notification = `${channel_title} is gonna to start a live streaming.\n${video_url}`;
        if(this.mention) {
            notification = this.mention + notification;
        }
        await channel.send(notification);
    }


}