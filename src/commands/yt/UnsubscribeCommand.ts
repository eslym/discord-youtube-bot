import {SlashCommandSubcommandBuilder} from "@discordjs/builders";
import {CommandInteraction, TextChannel} from "discord.js";
import {embed} from "../../utils/embed";
import {Subscription} from "../../models/Subscription";
import {Notification} from "../../models/Notification";
import {SubCommand} from "../CommandManager";
import {cmd} from "../../utils/cmd";

export const UnsubscribeCommand: SubCommand = {
    definition: new SlashCommandSubcommandBuilder()
        .setName('remove')
        .setDescription('Unsubscribe a youtube channel from this text channel.')
        .addStringOption(
            opt => opt.setName('channel_id')
                .setDescription('Youtube channel id to unsubscribe.')
                .setRequired(true)
        ),

    async handle(interaction: CommandInteraction) {
        let channel: TextChannel = interaction.channel as TextChannel;
        let verify = await cmd.verifySubscription(interaction);
        if(!verify){
            return;
        }
        let {websub, subscription, channelData} = verify;
        await Notification.destroy({
            where: {
                subscription_id: subscription.id,
            }
        });
        await subscription.destroy();
        let count = await Subscription.count({
            where: {
                sub_id: websub.id,
            }
        });
        if(count === 0){
            await websub.subscribe('unsubscribe');
        }
        await interaction.reply({embeds: [embed.info(`Unsubscribed ${channelData.snippet.title} for ${channel}.`)]})
    }
}
