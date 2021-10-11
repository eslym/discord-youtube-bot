import {SubCommand} from "../../CommandManager";
import {SlashCommandSubcommandBuilder} from "@discordjs/builders";
import {cmd} from "../../../utils/cmd";
import {embed} from "../../../utils/embed";

export const ClearMentionCommand: SubCommand = {
    definition: new SlashCommandSubcommandBuilder()
        .setName('clear')
        .setDescription('Clear mentions for subscription notification')
        .addStringOption(
            opt => opt.setName('channel_id')
                .setDescription('Youtube channel id')
                .setRequired(true)
        ),

    async handle(interaction){
        let verify = await cmd.verifySubscription(interaction);
        if(!verify){
            return;
        }
        let {subscription, channelData} = verify;
        if(subscription.mention){
            subscription.mention = null;
        }
        if(subscription.changed()){
            await subscription.save();
        }
        await interaction.reply({
            embeds: [embed.info(`Removed mention from notification for ${channelData.snippet.title}`)]
        });
    }
}