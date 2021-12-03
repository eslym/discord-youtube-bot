"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CommandManager = void 0;
const bot_1 = require("../bot");
const catchLog_1 = require("../utils/catchLog");
const YoutubeCommand_1 = require("../command/YoutubeCommand");
const CommandMap_1 = require("../models/CommandMap");
const sequelize_1 = require("sequelize");
const logger_1 = require("../logger");
const PermissionCommand_1 = require("../command/PermissionCommand");
var CommandManager;
(function (CommandManager) {
    const commands = {};
    const mapping = {};
    function register(command) {
        commands[command.id] = command;
    }
    async function syncCommand(guild) {
        let cmds = await guild.commands.fetch();
        await CommandMap_1.CommandMap.destroy({
            where: {
                id: { [sequelize_1.Op.notIn]: Array.from(cmds.keys()) },
                guild_id: guild.id,
            }
        });
        let mappings = await CommandMap_1.CommandMap.findAll({
            where: {
                guild_id: guild.id,
            }
        }).then(m => m.map(c => [c.id, c])).then(e => Object.fromEntries(e));
        let previous = Object.fromEntries(cmds.entries());
        let missing = Object.fromEntries(Object.entries(commands));
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
            await CommandMap_1.CommandMap.create({
                id: cmd.id,
                command_id: def.id,
                guild_id: guild.id,
            });
        }
        logger_1.logger.info(`Command synced for ${guild.id}(${guild.name}).`);
    }
    async function boot() {
        bot_1.bot.on('interactionCreate', (0, catchLog_1.catchLog)(CommandManager.execute));
        register(YoutubeCommand_1.YoutubeCommand);
        register(PermissionCommand_1.PermissionCommand);
        let guilds = await bot_1.bot.guilds.fetch();
        for (let guild of guilds.values()) {
            await syncCommand(await guild.fetch())
                .catch(logger_1.logger.warn);
        }
        bot_1.bot.on('guildCreate', (0, catchLog_1.catchLog)(syncCommand));
        bot_1.bot.on('guildDelete', (0, catchLog_1.catchLog)(async (guild) => {
            let ids = await CommandMap_1.CommandMap.findAll({
                where: {
                    guild_id: guild.id,
                }
            }).then(m => m.map(c => c.id));
            for (let id of ids) {
                delete mapping[id];
            }
            await CommandMap_1.CommandMap.destroy({
                where: {
                    guild_id: guild.id,
                }
            });
        }));
    }
    CommandManager.boot = boot;
    async function execute(interaction) {
        if (interaction.isCommand()) {
            let cmd_id = mapping[interaction.commandId];
            await commands[cmd_id].handle(interaction);
        }
    }
    CommandManager.execute = execute;
    async function findCommand(guild, uuid) {
        let commands = await guild.commands.fetch();
        for (let cmd of commands.values()) {
            if (mapping[cmd.id] === uuid) {
                return cmd;
            }
        }
        return null;
    }
    CommandManager.findCommand = findCommand;
})(CommandManager = exports.CommandManager || (exports.CommandManager = {}));

//# sourceMappingURL=CommandManager.js.map
