import {Client, Intents} from "discord.js";
import {logger} from "./logger";
import {SubscriptionManager} from "./manager/SubscriptionManager";

let intents = new Intents();

intents.add(
    Intents.FLAGS.GUILDS,
    Intents.FLAGS.GUILD_MEMBERS,
    Intents.FLAGS.GUILD_INTEGRATIONS,
    Intents.FLAGS.GUILD_MESSAGES,
    Intents.FLAGS.DIRECT_MESSAGES,
)

export const bot = new Client({intents});

bot.on('ready', () => {
    logger.info('Discord bot ready.');
    SubscriptionManager.boot();
});

bot.on('interactionCreate', (interaction) => {
    if (interaction.isCommand()) {

    }
});
