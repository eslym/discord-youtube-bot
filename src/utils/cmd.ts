import {CommandInteraction, TextChannel} from "discord.js";
import {Subscription} from "../models/Subscription";
import {embed} from "./embed";

export const cmd = {
    async verifySubscription(interaction: CommandInteraction){
        let channel_id = interaction.options.getString('channel_id');
        let channel: TextChannel = interaction.channel as TextChannel;
        let {websub, subscription} = await Subscription.tryFind(channel_id, channel);
        let snippet = await websub.fetchSnippet();
        if (snippet === null) {
            await interaction.reply({
                embeds: [embed.error(`Cannot find youtube channel with ID: \`${channel_id}\`.`)]
            });
            return null;
        }
        let title = snippet.snippet.title;
        if (!subscription) {
            await interaction.reply({
                embeds: [embed.error(`${channel} does not subscribe ${title}!`)]
            });
            return null;
        }
        return {websub, subscription, channelData: snippet};
    }
}