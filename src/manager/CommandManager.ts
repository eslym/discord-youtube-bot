import {ApplicationCommand, ApplicationCommandData, CommandInteraction, Guild, Interaction} from "discord.js";
import {bot} from "../bot";
import {catchLog} from "../utils/catchLog";
import {YoutubeCommand} from "../command/YoutubeCommand";
import {CommandMap} from "../models/CommandMap";
import {Op} from "sequelize";
import Dict = NodeJS.Dict;
import {logger} from "../logger";

export module CommandManager {

    const commands: Dict<Command> = {};
    const mapping: Dict<string> = {};

    function register(command: Command) {
        commands[command.id] = command;
    }

    async function syncCommand(guild: Guild) {
        let cmds = await guild.commands.fetch();
        await CommandMap.destroy({
            where: {
                id: {[Op.notIn]: Array.from(cmds.keys())},
                guild_id: guild.id,
            }
        });
        let mappings: Dict<CommandMap> = await CommandMap.findAll({
            where: {
                guild_id: guild.id,
            }
        }).then(m => m.map(c => [c.id, c])).then(e => Object.fromEntries(e));
        let previous: Dict<ApplicationCommand> = Object.fromEntries(cmds.entries());
        let missing: Dict<Command> = Object.fromEntries(Object.entries(commands));
        for (let cmd of guild.commands.cache.values()) {
            if (mappings.hasOwnProperty(cmd.id)) {
                let cmd_id = mappings[cmd.id].command_id;
                delete missing[cmd_id];
                delete previous[cmd.id];
                await cmd.edit(commands[cmd_id].definition);
                mapping[cmd.id] = cmd_id;
            }
        }
        for (let cmd of Object.values(previous)) {
            await cmd.delete();
        }
        for (let def of Object.values(missing)) {
            let cmd = await guild.commands.create(def.definition);
            await cmd.permissions.set({
                permissions: [{
                    type: "USER",
                    id: guild.ownerId,
                    permission: true
                }]
            });
            mapping[cmd.id] = def.id;
            await CommandMap.create({
                id: cmd.id,
                command_id: def.id,
                guild_id: guild.id,
            });
        }
        logger.info(`Command synced for ${guild.id}(${guild.name}).`);
    }

    export async function boot() {
        bot.on('interactionCreate', catchLog(CommandManager.execute));
        register(YoutubeCommand);
        let guilds = await bot.guilds.fetch();
        for(let guild of guilds.values()){
            await syncCommand(await guild.fetch())
                .catch(logger.warn);
        }
        bot.on('guildCreate', catchLog(syncCommand));
        bot.on('guildDelete', catchLog(async (guild: Guild)=>{
            let ids = await CommandMap.findAll({
                where: {
                    guild_id: guild.id,
                }
            }).then(m=>m.map(c=>c.id));
            for(let id of ids){
                delete mapping[id];
            }
            await CommandMap.destroy({
                where: {
                    guild_id: guild.id,
                }
            });
        }))
    }

    export async function execute(interaction: Interaction) {
        if (interaction.isCommand()) {
            let cmd_id = mapping[interaction.commandId];
            await commands[cmd_id].handle(interaction);
        }
    }
}

export interface Command {
    id: string;
    definition: ApplicationCommandData;

    handle(interaction: CommandInteraction): Promise<unknown> | unknown;
}
