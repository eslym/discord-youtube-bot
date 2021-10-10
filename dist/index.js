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
const server_1 = require("./express/server");
const googleapis_1 = require("googleapis");
const bot_1 = require("./bot");
sql_1.sequelize.addModels([
    Notification_1.Notification,
    Subscription_1.Subscription,
    WebSub_1.WebSub,
    YoutubeVideo_1.YoutubeVideo,
]);
(() => __awaiter(void 0, void 0, void 0, function* () {
    if (config.get('discord.inviteLink')) {
        let url = new URL('https://discord.com/oauth2/authorize');
        url.searchParams.set('client_id', config.get('discord.appId'));
        url.searchParams.set('scope', 'bot applications.commands');
        url.searchParams.set('permissions', '224256');
        logger_1.logger.info('Use the following link to add this bot into server.');
        logger_1.logger.info(url.toString());
    }
    if (config.get('database.sync')) {
        yield sql_1.sequelize.sync({ alter: true });
        logger_1.logger.info("DB synced.");
    }
    googleapis_1.google.options({ auth: config.get('youtube.key') });
    server_1.server.listen(config.get('websub.port', config.get('websub.host')), () => {
        logger_1.logger.info('Websub listener ready.');
    });
    yield (0, bot_1.setupCommands)();
    logger_1.logger.info('Command refreshed.');
    yield bot_1.bot.login(config.get('discord.token'));
    logger_1.logger.info('Discord bot ready.');
}))().catch(e => {
    logger_1.logger.error(e);
    process.exit(1);
});

//# sourceMappingURL=index.js.map
