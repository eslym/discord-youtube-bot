"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SubCommandController = exports.CommandManager = void 0;
const builders_1 = require("@discordjs/builders");
const commands = {};
var CommandManager;
(function (CommandManager) {
    function addCommand(command) {
        commands[command.definition.name] = command;
        return CommandManager;
    }
    CommandManager.addCommand = addCommand;
    function getDefinitions() {
        return Object.values(commands).map(def => def.definition.toJSON());
    }
    CommandManager.getDefinitions = getDefinitions;
    function handle(interaction) {
        return __awaiter(this, void 0, void 0, function* () {
            if (commands.hasOwnProperty(interaction.commandName)) {
                return commands[interaction.commandName].handle(interaction);
            }
        });
    }
    CommandManager.handle = handle;
})(CommandManager = exports.CommandManager || (exports.CommandManager = {}));
class SubCommandController {
    constructor() {
        this._commands = {};
    }
    addCommand(command) {
        this._commands[command.definition.name] = command;
        return this;
    }
    addToParent(parent) {
        Object.values(this._commands).forEach(def => {
            if (def.definition instanceof builders_1.SlashCommandSubcommandGroupBuilder) {
                if (parent.definition instanceof builders_1.SlashCommandBuilder) {
                    parent.definition.addSubcommandGroup(def.definition);
                }
                else {
                    throw new TypeError('Sub command group can only add to command root.');
                }
            }
            else {
                parent.definition.addSubcommand(def.definition);
            }
        });
    }
    handle(interaction) {
        return __awaiter(this, void 0, void 0, function* () {
            let group = interaction.options.getSubcommandGroup(false);
            if (group && this._commands.hasOwnProperty(group)) {
                return this._commands[group].handle(interaction);
            }
            let subcommand = interaction.options.getSubcommand(true);
            if (this._commands.hasOwnProperty(subcommand)) {
                return this._commands[subcommand].handle(interaction);
            }
        });
    }
}
exports.SubCommandController = SubCommandController;

//# sourceMappingURL=CommandManager.js.map
