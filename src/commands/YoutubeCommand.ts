import {SlashCommand, SubCommandController} from "./CommandManager";
import {SearchCommand} from "./yt/SearchCommand";
import {SubscribeCommand} from "./yt/SubscribeCommand";
import {UnsubscribeCommand} from "./yt/UnsubscribeCommand";
import {ListSubscriptionsCommand} from "./yt/ListSubscriptionsCommand";
import {SlashCommandBuilder} from "@discordjs/builders";
import {CommandInteraction} from "discord.js";
import {MentionCommand} from "./yt/MentionCommand";

const SubCommands = new SubCommandController()
    .addCommand(SearchCommand)
    .addCommand(SubscribeCommand)
    .addCommand(UnsubscribeCommand)
    .addCommand(ListSubscriptionsCommand)
    .addCommand(MentionCommand);

export const YoutubeCommand: SlashCommand = {
    definition: new SlashCommandBuilder()
        .setDefaultPermission(false)
        .setName('yt')
        .setDescription('Youtube notification services'),
    async handle(interaction: CommandInteraction) {
        return SubCommands.handle(interaction);
    }
}

SubCommands.addToParent(YoutubeCommand);
