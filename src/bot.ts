import {Client, Intents, Interaction} from "discord.js";
import {logger} from "./logger";
import {SubscriptionManager} from "./manager/SubscriptionManager";
import {catchLog} from "./utils/catchLog";

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

bot.on('interactionCreate', catchLog(async (interaction: Interaction) => {
    if (interaction.isCommand()) {

    }
}));
