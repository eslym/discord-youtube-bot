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
Object.defineProperty(exports, "__esModule", { value: true });
exports.WebSub = void 0;
const sequelize_typescript_1 = require("sequelize-typescript");
const sequelize_1 = require("sequelize");
const discord_js_1 = require("discord.js");
const crypto = require("crypto");
const YoutubeVideo_1 = require("./YoutubeVideo");
const Subscription_1 = require("./Subscription");
const axios_1 = require("axios");
const config_1 = require("../config");
const googleapis_1 = require("googleapis");
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
        let params = new URLSearchParams([['channel_id', this.youtube_channel]]);
        url.search = params.toString();
        return url.toString();
    }
    fetchSnippet() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                let res = yield googleapis_1.google.youtube('v3').channels.list({
                    id: [this.youtube_channel],
                    part: ['snippet'],
                });
                return res.data.items[0];
            }
            catch (_) {
                return null;
            }
        });
    }
    subscribe(mode = 'subscribe') {
        return __awaiter(this, void 0, void 0, function* () {
            let data = new URLSearchParams();
            data.append('hub.callback', `${(0, config_1.get)('websub.url')}/websub/${this.id}`);
            data.append('hub.mode', mode);
            data.append('hub.topic', this.topic_url);
            data.append('hub.secret', this.secret);
            yield axios_1.default.post('https://pubsubhubbub.appspot.com/subscribe', data)
                .catch((_) => {
                console.error("Failed to subscribe " + this.topic_url);
            });
        });
    }
};
__decorate([
    (0, sequelize_typescript_1.Column)({ type: sequelize_1.DataTypes.BIGINT.UNSIGNED, primaryKey: true }),
    __metadata("design:type", Number)
], WebSub.prototype, "id", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({ type: sequelize_1.DataTypes.STRING, allowNull: false }),
    __metadata("design:type", String)
], WebSub.prototype, "youtube_channel", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({ type: sequelize_1.DataTypes.STRING, allowNull: false }),
    __metadata("design:type", String)
], WebSub.prototype, "secret", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({ type: sequelize_1.DataTypes.TEXT, allowNull: false }),
    __metadata("design:type", String)
], WebSub.prototype, "message", void 0);
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
    (0, sequelize_typescript_1.HasMany)(() => YoutubeVideo_1.YoutubeVideo, { foreignKey: 'sub_id' }),
    __metadata("design:type", Array)
], WebSub.prototype, "videos", void 0);
__decorate([
    (0, sequelize_typescript_1.HasMany)(() => Subscription_1.Subscription, { foreignKey: 'sub_id' }),
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
