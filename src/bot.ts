import {
    ApplicationCommand, ApplicationCommandPermissionData,
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
import {SlashCommandBuilder} from "@discordjs/builders";
import {SearchCommand} from "./commands/SearchCommand";
import {logger} from "./logger";
import {SubscribeCommand} from "./commands/SubscribeCommand";
import {UnsubscribeCommand} from "./commands/UnsubscribeCommand";

let intents = new Intents();

intents.add(
    Intents.FLAGS.GUILDS,
    Intents.FLAGS.GUILD_MEMBERS,
    Intents.FLAGS.GUILD_INTEGRATIONS,
    Intents.FLAGS.GUILD_MESSAGES
)

export const bot = new Client({intents});

let client = new REST({version: '9'});
client.setToken(config('discord.token'));

let commands = {
    'search': SearchCommand,
    'subscribe': SubscribeCommand,
    'unsubscribe': UnsubscribeCommand,
};

export async function setupCommands() {
    const appId = config('discord.appId')
    let route = Routes.applicationCommands(appId);
    let command = new SlashCommandBuilder()
        .setDefaultPermission(false)
        .setName('youtube')
        .setDescription('Youtube notification services');
    Object.values(commands).forEach(c => {
        command.addSubcommand(c.definition);
    });
    await client.put(route, {
        body: [command.toJSON()]
    });
}

async function setGuildCommandPermissions(guild: Guild, cmds: Collection<Snowflake, ApplicationCommand<{ guild: GuildResolvable }>>) {
    if (!guild.commands) return;
    for (let command of cmds.values()) {
        try {
            let permissions: ApplicationCommandPermissionData[] = [
                {
                    id: guild.ownerId,
                    type: 'USER',
                    permission: true,
                }
            ];
            await command.permissions.add({
                guild, permissions
            });
        } catch (err) {
            logger.warn(`Failed to set permissions for /${command.name} on ${guild.name}`);
        }
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
    if (interaction.isCommand() && interaction.commandName === 'youtube') {
        let cmd = interaction.options.getSubcommand(true);
        logger.info(`${interaction.user.tag}:${interaction.user.id} run a command "/${interaction.commandName} ${cmd}"`)
        commands[cmd].handle(interaction).catch(logger.error);
    }
});
