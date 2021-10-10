import {SlashCommandSubcommandBuilder} from "@discordjs/builders";
import {CommandInteraction, MessageActionRow, MessageSelectMenu, SnowflakeUtil} from "discord.js";
import {google} from "googleapis";
import {MessageComponentTypes} from "discord.js/typings/enums";

export const SearchCommand = {
    definition: new SlashCommandSubcommandBuilder()
        .setName('search')
        .setDescription('Search youtube channel')
        .addStringOption(
            opt => opt.setName('channel')
                .setDescription('Keyword to for searching channel')
                .setRequired(true)
        ),
    async handle(interaction: CommandInteraction){
        let keyword = interaction.options.getString('channel');
        await interaction.reply(`Searching on "${keyword}" on youtube.`);
        let res = await google.youtube('v3').search.list({
            q: keyword, type: ['channel'], part: ['snippet', 'id'], maxResults: 10
        });
        if(res.data.pageInfo.totalResults === 0){
            await interaction.followUp(`No search result for "${keyword}" :(`);
            return;
        }
        let channels = {};
        let menu = new MessageSelectMenu();
        menu.setCustomId('youtube_subscribe_' + SnowflakeUtil.generate());
        menu.setPlaceholder('Select a channel to subscribe');
        menu.addOptions(
            res.data.items.map(item => {
                channels[item.id.channelId] = item.snippet.title;
                return {
                    label: item.snippet.title,
                    description: item.snippet.description.length > 100 ?
                        item.snippet.description.slice(0, 97) + '...' :
                        item.snippet.description,
                    value: item.id.channelId,
                };
            })
        );
        let msg = await interaction.followUp({
            content: `Search results for "${keyword}":`,
            components: [new MessageActionRow().setComponents(menu)]
        });
        let message = await interaction.channel.messages.fetch(msg.id);
        let collector = message.createMessageComponentCollector({
            componentType: MessageComponentTypes.SELECT_MENU, time: 20000
        });
        collector.on('collect', async (imenu)=>{
            if(imenu.user.id !== interaction.user.id){
                await imenu.reply(`${interaction.user} you can't do this!`);
                return;
            }
            imenu.reply(imenu.values[0]);
            menu.setPlaceholder(`Subscribed to ${channels[imenu.values[0]]}`);
            menu.setDisabled(true);
            await message.edit({
                content: `Search results for ${keyword}:`,
                components: [new MessageActionRow().setComponents(menu)]
            });
            collector.removeAllListeners('end');
        });
        collector.on('end', ()=>{
            menu.setPlaceholder("Expired.");
            menu.setDisabled(true);
            message.edit({
                content: `Search results for ${keyword}:`,
                components: [new MessageActionRow().setComponents(menu)]
            });
        });
    }
}