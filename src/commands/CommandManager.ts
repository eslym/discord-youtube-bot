import {
    SlashCommandBuilder,
    SlashCommandSubcommandBuilder,
    SlashCommandSubcommandGroupBuilder
} from "@discordjs/builders";
import {CommandInteraction} from "discord.js";
import Dict = NodeJS.Dict;

export type SlashCommand = Command<SlashCommandBuilder>;
export type SubCommand = Command<SlashCommandSubcommandBuilder>;
export type SubCommandGroup = Command<SlashCommandSubcommandGroupBuilder>;

const commands: Dict<SlashCommand> = {};

export module CommandManager {
    export function addCommand(command: SlashCommand){
        commands[command.definition.name] = command;
        return CommandManager;
    }

    export function getDefinitions(){
        return Object.values(commands).map(def=>def.definition.toJSON());
    }

    export async function handle(interaction: CommandInteraction){
        if(commands.hasOwnProperty(interaction.commandName)){
            return commands[interaction.commandName].handle(interaction);
        }
    }
}

export class SubCommandController {
    protected _commands: Dict<SubCommand> = {};
    addCommand(command: SubCommand){
        this._commands[command.definition.name] = command;
        return this;
    }

    addToParent(parent: Command<SlashCommandBuilder | SlashCommandSubcommandGroupBuilder>){
        Object.values(this._commands).forEach(def=>parent.definition.addSubcommand(def.definition));
    }

    async handle(interaction: CommandInteraction){
        let subcommand = interaction.options.getSubcommand(true);
        if(this._commands.hasOwnProperty(subcommand)){
            return this._commands[subcommand].handle(interaction);
        }
    }
}

export class SubCommandGroupController {
    protected _groups: Dict<SubCommandGroup> = {};
    addGroup(group: SubCommandGroup){
        this._groups[group.definition.name] = group;
        return this;
    }

    addToParent(parent: Command<SlashCommandBuilder>){
        Object.values(this._groups).forEach(def=>parent.definition.addSubcommandGroup(def.definition));
    }

    async handle(interaction: CommandInteraction){
        let group = interaction.options.getSubcommand(true);
        if(this._groups.hasOwnProperty(group)){
            return this._groups[group].handle(interaction);
        }
    }
}

export interface Command<T extends SlashCommandBuilder | SlashCommandSubcommandBuilder | SlashCommandSubcommandGroupBuilder> {
    definition: T
    handle(interaction: CommandInteraction): Promise<void>
}
