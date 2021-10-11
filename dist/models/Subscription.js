"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var Subscription_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.Subscription = void 0;
const discord_js_1 = require("discord.js");
const sequelize_typescript_1 = require("sequelize-typescript");
const sequelize_1 = require("sequelize");
const Notification_1 = require("./Notification");
const WebSub_1 = require("./WebSub");
const bot_1 = require("../bot");
const logger_1 = require("../logger");
const channel_1 = require("../utils/channel");
const moment = require("moment");
let Subscription = Subscription_1 = class Subscription extends sequelize_typescript_1.Model {
    static makeId(self) {
        if (!self.id) {
            self.id = discord_js_1.SnowflakeUtil.generate();
        }
    }
    notifyPublish(video_url, channel_title, live) {
        return __awaiter(this, void 0, void 0, function* () {
            let channel = yield bot_1.bot.channels.fetch(this.discord_channel_id.toString());
            let notification = `${channel_title} has publish a new video.\n${video_url}`;
            if (live) {
                let schedule = moment(live).format("D MMM YYYY, HH:MM");
                notification = `${channel_title} scheduled a live streaming at ${schedule}\n${video_url}`;
            }
            if (this.mention) {
                notification = this.mention + notification;
            }
            yield channel.send(notification);
            logger_1.logger.info(`Video notification from ${channel_title} to ${channel_1.channel.name(channel)}.`);
        });
    }
    notifyReschedule(video_url, channel_title, live) {
        return __awaiter(this, void 0, void 0, function* () {
            let channel = yield bot_1.bot.channels.fetch(this.discord_channel_id.toString());
            let schedule = moment(live).format("D MMM YYYY, HH:MM");
            let notification = `${channel_title} re-scheduled a live streaming to ${schedule}\n${video_url}`;
            if (this.mention) {
                notification = this.mention + notification;
            }
            yield channel.send(notification);
            logger_1.logger.info(`Re-schedule notification from ${channel_title} to ${channel_1.channel.name(channel)}.`);
        });
    }
    notifyStarting(video_url, channel_title) {
        return __awaiter(this, void 0, void 0, function* () {
            let channel = yield bot_1.bot.channels.fetch(this.discord_channel_id.toString());
            let notification = `${channel_title} is gonna to start a live streaming.\n${video_url}`;
            if (this.mention) {
                notification = this.mention + notification;
            }
            yield channel.send(notification);
            logger_1.logger.info(`Live starting notification from ${channel_title} to ${channel_1.channel.name(channel)}.`);
        });
    }
    static tryFind(channel_id, channel) {
        return __awaiter(this, void 0, void 0, function* () {
            let websub = yield WebSub_1.WebSub.findOne({
                where: {
                    youtube_channel: channel_id,
                }
            });
            if (!websub) {
                websub = new WebSub_1.WebSub({
                    youtube_channel: channel_id,
                });
            }
            let subscription = yield Subscription_1.findOne({
                where: {
                    sub_id: websub.id,
                    discord_channel_id: channel.id,
                }
            });
            return { websub, subscription };
        });
    }
};
__decorate([
    (0, sequelize_typescript_1.Column)({ type: sequelize_1.DataTypes.BIGINT.UNSIGNED, primaryKey: true }),
    __metadata("design:type", Number)
], Subscription.prototype, "id", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({ type: sequelize_1.DataTypes.BIGINT.UNSIGNED, allowNull: false, unique: 'websub_notification_on_channel' }),
    __metadata("design:type", Number)
], Subscription.prototype, "discord_channel_id", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({ type: sequelize_1.DataTypes.BIGINT.UNSIGNED, allowNull: false, unique: 'websub_notification_on_channel' }),
    __metadata("design:type", Number)
], Subscription.prototype, "sub_id", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({ type: sequelize_1.DataTypes.STRING, allowNull: true }),
    __metadata("design:type", String)
], Subscription.prototype, "mention", void 0);
__decorate([
    (0, sequelize_typescript_1.HasMany)(() => Notification_1.Notification, 'subscription_id'),
    __metadata("design:type", Array)
], Subscription.prototype, "notifications", void 0);
__decorate([
    sequelize_typescript_1.BeforeValidate,
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [WebSub_1.WebSub]),
    __metadata("design:returntype", void 0)
], Subscription, "makeId", null);
Subscription = Subscription_1 = __decorate([
    (0, sequelize_typescript_1.Table)({ tableName: 'subscriptions', createdAt: 'created_at', updatedAt: 'updated_at' })
], Subscription);
exports.Subscription = Subscription;

//# sourceMappingURL=Subscription.js.map
