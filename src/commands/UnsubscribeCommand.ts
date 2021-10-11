import {SlashCommandSubcommandBuilder} from "@discordjs/builders";
import {CommandInteraction, TextChannel} from "discord.js";
import {WebSub} from "../models/WebSub";
import {embed} from "../utils/embed";
import {Subscription} from "../models/Subscription";
import {Notification} from "../models/Notification";

export const UnsubscribeCommand = {
    definition: new SlashCommandSubcommandBuilder()
        .setName('remove')
        .setDescription('Unsubscribe a youtube channel from this text channel.')
        .addStringOption(
            opt => opt.setName('channel_id')
                .setDescription('Youtube channel id to unsubscribe.')
                .setRequired(true)
        ),

    async handle(interaction: CommandInteraction) {
        let channel_id = interaction.options.getString('channel_id');
        let channel: TextChannel = interaction.channel as TextChannel;
        let websub = await WebSub.findOne({
            where: {
                youtube_channel: channel_id,
            }
        });
        if (!websub) {
            websub = new WebSub({
                youtube_channel: channel_id,
            });
            let snippet = await websub.fetchSnippet();
            if (snippet === null) {
                await interaction.reply({
                    embeds: [embed.error(`Cannot find youtube channel with ID: \`${channel_id}\`.`)]
                });
                return;
            }
            let title = snippet.snippet.title;
            await interaction.reply({
                embeds: [embed.error(`${channel} does not subscribe ${title}!`)]
            });
            return;
        }
        let snippet = await websub.fetchSnippet();
        let title = snippet.snippet.title;
        let sub = await Subscription.findOne({
            where: {
                sub_id: websub.id,
                discord_channel_id: channel.id,
            }
        });
        if (!sub) {
            await interaction.reply({
                embeds: [embed.error(`${channel} does not subscribe ${title}!`)]
            });
            return
        }
        await Notification.destroy({
            where: {
                subscription_id: sub.id,
            }
        });
        await sub.destroy();
        let count = await Subscription.count({
            where: {
                sub_id: websub.id,
            }
        });
        if(count === 0){
            await websub.subscribe('unsubscribe');
        }
        await interaction.reply({embeds: [embed.info(`Unsubscribed ${title} for ${channel}.`)]})
    }
}
