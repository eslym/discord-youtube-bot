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
import {Notification} from "./models/Notification";
import {Op} from "sequelize";
import {YoutubeVideo} from "./models/YoutubeVideo";
import {google, youtube_v3} from "googleapis";
import {CommandManager} from "./commands/CommandManager";
import {YoutubeCommand} from "./commands/YoutubeCommand";
import cron = require('node-cron');
import moment = require("moment");
import Dict = NodeJS.Dict;
import Schema$Video = youtube_v3.Schema$Video;
import Schema$VideoSnippet = youtube_v3.Schema$VideoSnippet;

let intents = new Intents();

intents.add(
    Intents.FLAGS.GUILDS,
    Intents.FLAGS.GUILD_MEMBERS,
    Intents.FLAGS.GUILD_INTEGRATIONS,
    Intents.FLAGS.GUILD_MESSAGES,
    Intents.FLAGS.DIRECT_MESSAGES,
)

export const bot = new Client({intents});

let client = new REST({version: '9'});
client.setToken(config('discord.token'));

CommandManager.addCommand(YoutubeCommand);

export async function setupCommands() {
    const appId = config('discord.appId')
    let route = Routes.applicationCommands(appId);
    await client.put(route, {
        body: CommandManager.getDefinitions()
    });
}

async function setGuildCommandPermissions(guild: Guild, cmds: Collection<Snowflake, ApplicationCommand<{ guild: GuildResolvable }>>) {
    if (!guild.commands) return;
    for (let command of cmds.values()) {
        let permissions: ApplicationCommandPermissionData[] = [
            {
                id: guild.ownerId,
                type: 'USER',
                permission: true,
            }
        ];
        await command.permissions.add({
            guild, permissions
        }).catch(_ => logger.warn(`Failed to set permissions for /${command.name} on ${guild.name}`));
    }
}

bot.on('ready', () => {
    (async () => {
        let guilds = await bot.guilds.fetch();
        let cmds = await bot.application.commands.fetch();
        for (let g of guilds.values()) {
            let guild = await g.fetch();
            await setGuildCommandPermissions(guild, cmds);
        }
        bot.on('guildCreate', (guild) => {
            (async () => {
                guild = await guild.fetch();
                await setGuildCommandPermissions(guild, cmds);
            })().catch((error) => {
                logger.error(error);
            });
        });
    })().catch(logger.error);
});

bot.on('interactionCreate', (interaction) => {
    if (interaction.isCommand()) {
        CommandManager.handle(interaction).catch(logger.error);
    }
});
