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
exports.Notification = void 0;
const sequelize_typescript_1 = require("sequelize-typescript");
const Subscription_1 = require("./Subscription");
const YoutubeVideo_1 = require("./YoutubeVideo");
const sequelize_1 = require("sequelize");
const WebSub_1 = require("./WebSub");
const discord_js_1 = require("discord.js");
let Notification = class Notification extends sequelize_typescript_1.Model {
    static makeId(self) {
        if (!self.id) {
            self.id = discord_js_1.SnowflakeUtil.generate();
        }
    }
};
__decorate([
    (0, sequelize_typescript_1.Column)({ type: sequelize_1.DataTypes.BIGINT.UNSIGNED, primaryKey: true }),
    __metadata("design:type", Number)
], Notification.prototype, "id", void 0);
__decorate([
    (0, sequelize_typescript_1.ForeignKey)(() => Subscription_1.Subscription),
    (0, sequelize_typescript_1.Column)({ type: sequelize_1.DataTypes.BIGINT.UNSIGNED, allowNull: false, unique: 'video_notification_on_subscription' }),
    __metadata("design:type", Number)
], Notification.prototype, "subscription_id", void 0);
__decorate([
    (0, sequelize_typescript_1.ForeignKey)(() => YoutubeVideo_1.YoutubeVideo),
    (0, sequelize_typescript_1.Column)({ type: sequelize_1.DataTypes.STRING, allowNull: false, unique: 'video_notification_on_subscription' }),
    __metadata("design:type", String)
], Notification.prototype, "video_id", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({ type: sequelize_1.DataTypes.DATE, allowNull: true }),
    __metadata("design:type", Date)
], Notification.prototype, "scheduled_at", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({ type: sequelize_1.DataTypes.DATE, allowNull: true }),
    __metadata("design:type", Date)
], Notification.prototype, "notified_at", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({ type: sequelize_1.DataTypes.DATE, allowNull: true }),
    __metadata("design:type", Date)
], Notification.prototype, "created_at", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({ type: sequelize_1.DataTypes.DATE, allowNull: true }),
    __metadata("design:type", Date)
], Notification.prototype, "updated_at", void 0);
__decorate([
    (0, sequelize_typescript_1.BelongsTo)(() => YoutubeVideo_1.YoutubeVideo, { foreignKey: 'video_id', onDelete: 'cascade', onUpdate: 'restrict' }),
    __metadata("design:type", YoutubeVideo_1.YoutubeVideo)
], Notification.prototype, "video", void 0);
__decorate([
    (0, sequelize_typescript_1.BelongsTo)(() => Subscription_1.Subscription, { foreignKey: 'subscription_id', onDelete: 'cascade', onUpdate: 'restrict' }),
    __metadata("design:type", Subscription_1.Subscription)
], Notification.prototype, "subscription", void 0);
__decorate([
    sequelize_typescript_1.BeforeValidate,
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [WebSub_1.WebSub]),
    __metadata("design:returntype", void 0)
], Notification, "makeId", null);
Notification = __decorate([
    (0, sequelize_typescript_1.Table)({ tableName: 'notifications', createdAt: 'created_at', updatedAt: 'updated_at', collate: 'utf8_bin' })
], Notification);
exports.Notification = Notification;

//# sourceMappingURL=Notification.js.map
