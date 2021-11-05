import {
    ApplicationCommand,
    ApplicationCommandPermissionData,
    Client,
    Collection,
    Guild,
    GuildResolvable,
    Intents,
    Snowflake
} from "discord.js";
import {REST} from "@discordjs/rest";
import {Routes} from "discord-api-types/v9";
import {get as config} from "./config";
import {logger} from "./logger";
import {catchLog} from "./utils/catchLog";
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
