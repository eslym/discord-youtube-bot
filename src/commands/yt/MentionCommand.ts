import {SubCommandController, SubCommandGroup} from "../CommandManager";
import {SlashCommandSubcommandGroupBuilder} from "@discordjs/builders";
import {AddMentionCommand} from "./mention/AddMentionCommand";
import {RemoveMentionCommand} from "./mention/RemoveMentionCommand";
import {ClearMentionCommand} from "./mention/ClearMentionCommand";

const SubCommands = new SubCommandController()
    .addCommand(AddMentionCommand)
    .addCommand(RemoveMentionCommand)
    .addCommand(ClearMentionCommand)

export const MentionCommand: SubCommandGroup = {
    definition: new SlashCommandSubcommandGroupBuilder()
        .setName('mention')
        .setDescription('Modify mentions on a notifications'),

    async handle(interaction){
        return SubCommands.handle(interaction);
    }
}

SubCommands.addToParent(MentionCommand);
