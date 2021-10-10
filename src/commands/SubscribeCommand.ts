import {SlashCommandSubcommandBuilder} from "@discordjs/builders";
import {CommandInteraction, TextChannel} from "discord.js";
import {WebSub} from "../models/WebSub";
import {Subscription} from "../models/Subscription";
import {embed} from "../utils/embed";

export const SubscribeCommand = {
    definition: new SlashCommandSubcommandBuilder()
        .setName('subscribe')
        .setDescription('Subscribe a youtube channel for this text channel.')
        .addStringOption(
            opt => opt.setName('channel_id')
                .setDescription('Youtube channel id to unsubscribe.')
                .setRequired(true)
        )
        .addMentionableOption(
            opt => opt.setName('mention')
                .setDescription('Mention when received notification.')
                .setRequired(false)
        ),

    async handle(interaction: CommandInteraction){
        let channel_id = interaction.options.getString('channel_id');
        let channel: TextChannel = interaction.channel as TextChannel;
        let websub = await WebSub.findOne({
            where: {
                youtube_channel: channel_id,
            }
        });
        let title;
        if(!websub){
            websub = new WebSub({
                youtube_channel: channel_id,
            });
            let snippet = await websub.fetchSnippet();
            if(snippet === null){
                await interaction.reply({
                    embeds: [embed.error(`Cannot find youtube channel with ID: \`${channel_id}\`.`)]
                });
                return;
            }
            await websub.save();
            websub.subscribe().then();
            title = snippet.snippet.title;
        } else {
            let snippet = await websub.fetchSnippet();
            title = snippet.snippet.title;
        }
        let sub = await Subscription.count({
            where: {
                sub_id: websub.id,
                discord_channel_id: channel.id,
            }
        });
        if(sub > 0){
            await interaction.reply({embeds: [embed.warn(`${channel} already have this subscription!`)]});
            return
        }
        let mention = interaction.options.getMentionable('mention');
        await Subscription.create({
            sub_id: websub.id,
            discord_channel_id: channel.id,
            mention: mention === null ? null : mention.toString()
        });
        await interaction.reply({embeds: [embed.info(`Subscribed ${title} for ${channel}.`)]})
    }
}
