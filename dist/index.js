"use strict";
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
const config = require("./config");
const sql_1 = require("./sql");
const logger_1 = require("./logger");
const Notification_1 = require("./models/Notification");
const Subscription_1 = require("./models/Subscription");
const WebSub_1 = require("./models/WebSub");
const YoutubeVideo_1 = require("./models/YoutubeVideo");
const RolePermission_1 = require("./models/RolePermission");
const MemberPermission_1 = require("./models/MemberPermission");
sql_1.sequelize.addModels([
    Notification_1.Notification,
    Subscription_1.Subscription,
    WebSub_1.WebSub,
    YoutubeVideo_1.YoutubeVideo,
    RolePermission_1.RolePermission,
    MemberPermission_1.MemberPermission,
]);
(() => __awaiter(void 0, void 0, void 0, function* () {
    if (config.get('database.sync')) {
        yield sql_1.sequelize.sync({ alter: true });
        logger_1.logger.info("DB Synced.");
    }
}))().catch(e => logger_1.logger.error(e));

//# sourceMappingURL=index.js.map
