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
exports.YoutubeVideo = void 0;
const sequelize_typescript_1 = require("sequelize-typescript");
const sequelize_1 = require("sequelize");
const WebSub_1 = require("./WebSub");
const Notification_1 = require("./Notification");
let YoutubeVideo = class YoutubeVideo extends sequelize_typescript_1.Model {
};
__decorate([
    (0, sequelize_typescript_1.Column)({ type: sequelize_1.DataTypes.STRING, primaryKey: true }),
    __metadata("design:type", String)
], YoutubeVideo.prototype, "video_id", void 0);
__decorate([
    (0, sequelize_typescript_1.ForeignKey)(() => WebSub_1.WebSub),
    (0, sequelize_typescript_1.Column)({ type: sequelize_1.DataTypes.BIGINT.UNSIGNED, allowNull: false }),
    __metadata("design:type", Number)
], YoutubeVideo.prototype, "sub_id", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({ type: sequelize_1.DataTypes.STRING, allowNull: false }),
    __metadata("design:type", String)
], YoutubeVideo.prototype, "youtube_channel", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({ type: sequelize_1.DataTypes.DATE, allowNull: true }),
    __metadata("design:type", Date)
], YoutubeVideo.prototype, "live_at", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({ type: sequelize_1.DataTypes.DATE, allowNull: true }),
    __metadata("design:type", Date)
], YoutubeVideo.prototype, "deleted_at", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({ type: sequelize_1.DataTypes.DATE, allowNull: true }),
    __metadata("design:type", Date)
], YoutubeVideo.prototype, "created_at", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({ type: sequelize_1.DataTypes.DATE, allowNull: true }),
    __metadata("design:type", Date)
], YoutubeVideo.prototype, "updated_at", void 0);
__decorate([
    (0, sequelize_typescript_1.BelongsTo)(() => WebSub_1.WebSub, { foreignKey: 'sub_id', onDelete: 'cascade', onUpdate: 'restrict' }),
    __metadata("design:type", WebSub_1.WebSub)
], YoutubeVideo.prototype, "subscription", void 0);
__decorate([
    (0, sequelize_typescript_1.HasMany)(() => Notification_1.Notification, 'video_id'),
    __metadata("design:type", Array)
], YoutubeVideo.prototype, "notifications", void 0);
YoutubeVideo = __decorate([
    (0, sequelize_typescript_1.Table)({ tableName: 'youtube_videos', createdAt: 'created_at', updatedAt: 'updated_at', collate: 'utf8_bin' })
], YoutubeVideo);
exports.YoutubeVideo = YoutubeVideo;

//# sourceMappingURL=YoutubeVideo.js.map
