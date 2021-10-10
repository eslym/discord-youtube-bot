import {Client, CommandInteraction, Intents} from "discord.js";
import {REST} from "@discordjs/rest";
import {Routes} from "discord-api-types/v9";
import {get as config} from "./config";
import {SlashCommandBuilder} from "@discordjs/builders";
import {SearchCommand} from "./commands/SearchCommand";
import {logger} from "./logger";

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
    'search': SearchCommand
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

bot.on('ready', () => {
    (async () => {
        let guilds = await bot.guilds.fetch();
        let cmds = await bot.application.commands.fetch();
        for (let g of guilds.values()) {
            let guild = await g.fetch();
            if (!guild.commands) continue;
            for (let command of cmds.values()) {
                try {
                    await command.permissions.add({
                        guild,
                        permissions: [
                            {
                                id: guild.ownerId,
                                type: 'USER',
                                permission: true,
                            }
                        ]
                    });
                } catch (err) {
                    logger.warn(`Failed to set permissions for /${command.name} on ${guild.name}`);
                }
            }
        }
    })().catch(logger.error);
});

bot.on('interactionCreate', (interaction) => {
    if (interaction.isCommand() && interaction.commandName === 'youtube') {
        let cmd = interaction.options.getSubcommand(true);
        commands[cmd].handle(interaction).catch(logger.error);
    }
});
