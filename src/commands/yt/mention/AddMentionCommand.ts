import {SubCommand} from "../../CommandManager";
import {SlashCommandSubcommandBuilder} from "@discordjs/builders";
import {embed} from "../../../utils/embed";
import {cmd} from "../../../utils/cmd";

export const AddMentionCommand: SubCommand = {
    definition: new SlashCommandSubcommandBuilder()
        .setName('add')
        .setDescription('Add mention to subscription notification')
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
        if(!subscription.mention){
            subscription.mention = mention;
        } else if (subscription.mention.search(mention) === -1) {
            subscription.mention += mention;
        }
        if(subscription.changed()){
            await subscription.save();
        }
        await interaction.reply({
            embeds: [embed.info(`Added mention to notification for ${channelData.snippet.title}`)]
        });
    }
}