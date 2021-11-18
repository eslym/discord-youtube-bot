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
exports.WebSub = void 0;
const sequelize_typescript_1 = require("sequelize-typescript");
const sequelize_1 = require("sequelize");
const discord_js_1 = require("discord.js");
const YoutubeVideo_1 = require("./YoutubeVideo");
const Subscription_1 = require("./Subscription");
const axios_1 = require("axios");
const config_1 = require("../config");
const googleapis_1 = require("googleapis");
const logger_1 = require("../logger");
const redis_1 = require("../redis");
const crypto = require("crypto");
let WebSub = class WebSub extends sequelize_typescript_1.Model {
    static makeId(self) {
        if (!self.id) {
            self.id = discord_js_1.SnowflakeUtil.generate();
        }
        if (!self.secret) {
            self.secret = crypto.randomBytes(20).toString('base64');
        }
    }
    get topic_url() {
        let url = new URL('https://www.youtube.com/xml/feeds/videos.xml');
        let params = new URLSearchParams([['channel_id', this.youtube_channel_id]]);
        url.search = params.toString();
        return url.toString();
    }
    async fetchYoutubeChannelMeta() {
        let cache = await redis_1.redis.get(`ytChannel:${this.youtube_channel_id}`);
        if (cache) {
            return JSON.parse(cache);
        }
        let res = await googleapis_1.google.youtube('v3').channels.list({
            id: [this.youtube_channel_id],
            part: ['snippet'],
        });
        if (res.data.pageInfo.totalResults === 0) {
            return null;
        }
        await redis_1.redis.set(`ytChannel:${this.youtube_channel_id}`, JSON.stringify(res.data.items[0]), {
            EX: 5
        });
        return res.data.items[0];
    }
    async subscribe(mode = 'subscribe') {
        let data = new URLSearchParams();
        data.append('hub.callback', `${(0, config_1.get)('websub.url')}/websub/${this.id}`);
        data.append('hub.mode', mode);
        data.append('hub.topic', this.topic_url);
        data.append('hub.secret', this.secret);
        await axios_1.default.post('https://pubsubhubbub.appspot.com/subscribe', data)
            .catch((_) => {
            logger_1.logger.warn(`[WebSub] Failed to ${mode} ` + this.topic_url);
        });
    }
};
__decorate([
    (0, sequelize_typescript_1.Column)({ type: sequelize_1.DataTypes.BIGINT.UNSIGNED, primaryKey: true }),
    __metadata("design:type", Number)
], WebSub.prototype, "id", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({ type: sequelize_1.DataTypes.STRING, allowNull: false, unique: true }),
    __metadata("design:type", String)
], WebSub.prototype, "youtube_channel_id", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({ type: sequelize_1.DataTypes.STRING, allowNull: false }),
    __metadata("design:type", String)
], WebSub.prototype, "secret", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({ type: sequelize_1.DataTypes.DATE, allowNull: true }),
    __metadata("design:type", Date)
], WebSub.prototype, "created_at", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({ type: sequelize_1.DataTypes.DATE, allowNull: true }),
    __metadata("design:type", Date)
], WebSub.prototype, "updated_at", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({ type: sequelize_1.DataTypes.DATE, allowNull: true }),
    __metadata("design:type", Date)
], WebSub.prototype, "expires_at", void 0);
__decorate([
    (0, sequelize_typescript_1.HasMany)(() => YoutubeVideo_1.YoutubeVideo, { foreignKey: 'websub_id' }),
    __metadata("design:type", Array)
], WebSub.prototype, "videos", void 0);
__decorate([
    (0, sequelize_typescript_1.HasMany)(() => Subscription_1.Subscription, { foreignKey: 'websub_id' }),
    __metadata("design:type", Array)
], WebSub.prototype, "subscriptions", void 0);
__decorate([
    sequelize_typescript_1.BeforeValidate,
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [WebSub]),
    __metadata("design:returntype", void 0)
], WebSub, "makeId", null);
WebSub = __decorate([
    (0, sequelize_typescript_1.Table)({ tableName: 'web_subs', createdAt: 'created_at', updatedAt: 'updated_at', collate: 'utf8_bin' })
], WebSub);
exports.WebSub = WebSub;

//# sourceMappingURL=WebSub.js.map
