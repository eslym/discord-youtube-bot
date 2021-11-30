"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.bot = void 0;
const discord_js_1 = require("discord.js");
const logger_1 = require("./logger");
const SubscriptionManager_1 = require("./manager/SubscriptionManager");
const CommandManager_1 = require("./manager/CommandManager");
const config = require("./config");
const catchLog_1 = require("./utils/catchLog");
let intents = new discord_js_1.Intents();
intents.add(discord_js_1.Intents.FLAGS.GUILDS, discord_js_1.Intents.FLAGS.GUILD_MEMBERS, discord_js_1.Intents.FLAGS.GUILD_INTEGRATIONS, discord_js_1.Intents.FLAGS.GUILD_MESSAGES, discord_js_1.Intents.FLAGS.DIRECT_MESSAGES);
exports.bot = new discord_js_1.Client({ intents });
exports.bot.on('ready', (0, catchLog_1.catchLog)(async () => {
    logger_1.logger.info('Discord bot ready.');
    if (config.get('discord.inviteLink')) {
        let url = new URL('https://discord.com/oauth2/authorize');
        url.searchParams.set('client_id', exports.bot.application.id);
        url.searchParams.set('scope', 'bot applications.commands');
        url.searchParams.set('permissions', '224256');
        logger_1.logger.info('Use the following link to add this bot into server.');
        logger_1.logger.info(url.toString());
    }
    SubscriptionManager_1.SubscriptionManager.boot();
    await CommandManager_1.CommandManager.boot();
}));

//# sourceMappingURL=bot.js.map
