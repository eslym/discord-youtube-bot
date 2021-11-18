"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.bot = void 0;
const discord_js_1 = require("discord.js");
const logger_1 = require("./logger");
const SubscriptionManager_1 = require("./manager/SubscriptionManager");
const catchLog_1 = require("./utils/catchLog");
let intents = new discord_js_1.Intents();
intents.add(discord_js_1.Intents.FLAGS.GUILDS, discord_js_1.Intents.FLAGS.GUILD_MEMBERS, discord_js_1.Intents.FLAGS.GUILD_INTEGRATIONS, discord_js_1.Intents.FLAGS.GUILD_MESSAGES, discord_js_1.Intents.FLAGS.DIRECT_MESSAGES);
exports.bot = new discord_js_1.Client({ intents });
exports.bot.on('ready', () => {
    logger_1.logger.info('Discord bot ready.');
    SubscriptionManager_1.SubscriptionManager.boot();
});
exports.bot.on('interactionCreate', (0, catchLog_1.catchLog)(async (interaction) => {
    if (interaction.isCommand()) {
    }
}));

//# sourceMappingURL=bot.js.map
