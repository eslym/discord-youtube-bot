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
Object.defineProperty(exports, "__esModule", { value: true });
exports.Subscription = void 0;
const discord_js_1 = require("discord.js");
const sequelize_typescript_1 = require("sequelize-typescript");
const sequelize_1 = require("sequelize");
const Notification_1 = require("./Notification");
const WebSub_1 = require("./WebSub");
let Subscription = class Subscription extends sequelize_typescript_1.Model {
    static makeId(self) {
        if (!self.id) {
            self.id = discord_js_1.SnowflakeUtil.generate();
        }
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
Subscription = __decorate([
    (0, sequelize_typescript_1.Table)({ tableName: 'subscriptions', createdAt: 'created_at', updatedAt: 'updated_at' })
], Subscription);
exports.Subscription = Subscription;

//# sourceMappingURL=Subscription.js.map
