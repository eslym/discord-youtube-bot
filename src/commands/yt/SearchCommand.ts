import {SlashCommandSubcommandBuilder} from "@discordjs/builders";
import {CommandInteraction, Message, MessageActionRow, MessageEmbed, MessageSelectMenu} from "discord.js";
import {google, youtube_v3} from "googleapis";
import {MessageComponentTypes} from "discord.js/typings/enums";
import {embed} from "../../utils/embed";
import {SubCommand} from "../CommandManager";
import Dict = NodeJS.Dict;

export const SearchCommand: SubCommand = {
    definition: new SlashCommandSubcommandBuilder()
        .setName('search')
        .setDescription('Search youtube channel')
        .addStringOption(
            opt => opt.setName('keyword')
                .setDescription('Keyword to for searching channel')
                .setRequired(true)
        ),
    async handle(interaction: CommandInteraction){
        let keyword = interaction.options.getString('keyword');
        await interaction.reply({
            embeds: [embed.log(`Searching on "${keyword}" on youtube.`)],
            ephemeral: true
        });
        let res = await google.youtube('v3').search.list({
            q: keyword, type: ['channel'], part: ['snippet', 'id'], maxResults: 10
        });
        if(res.data.pageInfo.totalResults === 0){
            await interaction.editReply({embeds: [embed.warn(`No search result for "${keyword}" :(`)]});
            return;
        }
        let channels: Dict<youtube_v3.Schema$SearchResult> = {};
        let menu = new MessageSelectMenu();
        menu.setCustomId('youtube_search');
        menu.setPlaceholder('Select a channel to view details');
        menu.addOptions(
            res.data.items.map(item => {
                channels[item.id.channelId] = item;
                return {
                    label: item.snippet.title,
                    description: item.snippet.description.length > 100 ?
                        item.snippet.description.slice(0, 97) + '...' :
                        item.snippet.description,
                    value: item.id.channelId,
                };
            })
        );
        let message = await interaction.editReply({
            embeds: [embed.info(`Search results for "${keyword}":`)],
            components: [new MessageActionRow().setComponents(menu)],
        });
        if(!(message instanceof Message)){
            message = await interaction.channel.messages.fetch(message.id);
        }
        let collector = message.createMessageComponentCollector({
            componentType: MessageComponentTypes.SELECT_MENU, time: 60000
        });
        collector.on('collect', async (imenu)=>{
            let meta = new MessageEmbed();
            let channel = channels[imenu.values[0]];
            meta.setColor('GREEN');
            meta.setTitle(channel.snippet.title);
            meta.setURL(`https://youtube.com/channel/${channel.id.channelId}`);
            meta.setThumbnail(channel.snippet.thumbnails.default.url);
            meta.setDescription(channel.snippet.description);
            meta.addField('Channel ID', channel.id.channelId);
            await interaction.editReply({
                embeds: [embed.info(`Search results for "${keyword}":`)],
                components: [new MessageActionRow().setComponents(menu)]
            });
            await imenu.reply({
                embeds: [meta], ephemeral: true
            });
        });
        collector.on('end', ()=>{
            menu.setPlaceholder("Expired.");
            menu.setDisabled(true);
            interaction.editReply({
                embeds: [embed.info(`Search results for "${keyword}":`)],
                components: [new MessageActionRow().setComponents(menu)]
            });
        });
    }
}