import {Client, Intents} from "discord.js";
import {logger} from "./logger";
import {SubscriptionManager} from "./manager/SubscriptionManager";
import {CommandManager} from "./manager/CommandManager";
import {catchLog} from "./utils/catchLog";
import config = require("config");

let intents = new Intents();

intents.add(
    Intents.FLAGS.GUILDS,
    Intents.FLAGS.GUILD_MEMBERS,
    Intents.FLAGS.GUILD_INTEGRATIONS,
    Intents.FLAGS.GUILD_MESSAGES,
    Intents.FLAGS.DIRECT_MESSAGES,
)

export const bot = new Client({intents});

bot.on('ready', catchLog(async () => {
    logger.info('Discord bot ready.');
    if (config.get('discord.inviteLink')) {
        let url = new URL('https://discord.com/oauth2/authorize');
        url.searchParams.set('client_id', bot.application.id);
        url.searchParams.set('scope', 'bot applications.commands');
        url.searchParams.set('permissions', '224256');
        logger.info('Use the following link to add this bot into server.');
        logger.info(url.toString());
    }
    SubscriptionManager.boot();
    await CommandManager.boot();
}));
