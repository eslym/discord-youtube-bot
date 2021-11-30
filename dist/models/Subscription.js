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
var Subscription_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.Subscription = void 0;
const discord_js_1 = require("discord.js");
const sequelize_typescript_1 = require("sequelize-typescript");
const sequelize_1 = require("sequelize");
const WebSub_1 = require("./WebSub");
const SubscriptionManager_1 = require("../manager/SubscriptionManager");
let Subscription = Subscription_1 = class Subscription extends sequelize_typescript_1.Model {
    static makeId(self) {
        if (!self.id) {
            self.id = discord_js_1.SnowflakeUtil.generate();
        }
    }
    notify(type, video) {
        return SubscriptionManager_1.SubscriptionManager.get(this.discord_channel_id.toString())
            .then(m => m.notify(type, this, video));
    }
    static async tryFind(channel_id, channel) {
        let websub = await WebSub_1.WebSub.findOne({
            where: {
                youtube_channel: channel_id,
            }
        });
        if (!websub) {
            websub = new WebSub_1.WebSub({
                youtube_channel: channel_id,
            });
        }
        let subscription = await Subscription_1.findOne({
            where: {
                sub_id: websub.id,
                discord_channel_id: channel.id,
            }
        });
        return { websub, subscription };
    }
};
__decorate([
    (0, sequelize_typescript_1.Column)({ type: sequelize_1.DataTypes.BIGINT.UNSIGNED, primaryKey: true }),
    __metadata("design:type", Number)
], Subscription.prototype, "id", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({ type: sequelize_1.DataTypes.BIGINT.UNSIGNED, allowNull: true }),
    __metadata("design:type", Number)
], Subscription.prototype, "discord_guild_id", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({ type: sequelize_1.DataTypes.BIGINT.UNSIGNED, allowNull: false }),
    __metadata("design:type", Number)
], Subscription.prototype, "discord_channel_id", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({ type: sequelize_1.DataTypes.BIGINT.UNSIGNED, allowNull: false }),
    __metadata("design:type", Number)
], Subscription.prototype, "websub_id", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({ type: sequelize_1.DataTypes.JSON, allowNull: true }),
    __metadata("design:type", Array)
], Subscription.prototype, "mention", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({ type: sequelize_1.DataTypes.BOOLEAN, defaultValue: true }),
    __metadata("design:type", Object)
], Subscription.prototype, "notify_video", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({ type: sequelize_1.DataTypes.BOOLEAN, defaultValue: true }),
    __metadata("design:type", Object)
], Subscription.prototype, "notify_live", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({ type: sequelize_1.DataTypes.BOOLEAN, defaultValue: true }),
    __metadata("design:type", Object)
], Subscription.prototype, "notify_reschedule", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({ type: sequelize_1.DataTypes.BOOLEAN, defaultValue: true }),
    __metadata("design:type", Object)
], Subscription.prototype, "notify_starting", void 0);
__decorate([
    (0, sequelize_typescript_1.BelongsTo)(() => WebSub_1.WebSub, 'websub_id'),
    __metadata("design:type", WebSub_1.WebSub)
], Subscription.prototype, "websub", void 0);
__decorate([
    sequelize_typescript_1.BeforeValidate,
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [WebSub_1.WebSub]),
    __metadata("design:returntype", void 0)
], Subscription, "makeId", null);
Subscription = Subscription_1 = __decorate([
    (0, sequelize_typescript_1.Table)({
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
], Subscription);
exports.Subscription = Subscription;

//# sourceMappingURL=Subscription.js.map
