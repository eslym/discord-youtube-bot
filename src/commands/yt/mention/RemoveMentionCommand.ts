import {SubCommand} from "../../CommandManager";
import {SlashCommandSubcommandBuilder} from "@discordjs/builders";
import {cmd} from "../../../utils/cmd";
import {embed} from "../../../utils/embed";

export const RemoveMentionCommand: SubCommand = {
    definition: new SlashCommandSubcommandBuilder()
        .setName('remove')
        .setDescription('Remove mention from subscription notification')
        .addStringOption(
            opt => opt.setName('channel_id')
                .setDescription('Youtube channel id')
                .setRequired(true)
        )
        .addMentionableOption(
            opt => opt.setName('mention')
                .setDescription('Mentionable')
                .setRequired(true)
        ),

    async handle(interaction){
        let verify = await cmd.verifySubscription(interaction);
        if(!verify){
            return;
        }
        let {subscription, channelData} = verify;
        let mention = interaction.options.getMentionable('mention').toString();
        if(subscription.mention){
            subscription.mention = subscription.mention.replace(mention, '');
            if(subscription.mention === ''){
                subscription.mention = null;
            }
        }
        if(subscription.changed()){
            await subscription.save();
        }
        await interaction.reply({
            embeds: [embed.info(`Removed mention from notification for ${channelData.snippet.title}`)]
        });
    }
}