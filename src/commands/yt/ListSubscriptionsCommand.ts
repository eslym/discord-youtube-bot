import {SlashCommandSubcommandBuilder} from "@discordjs/builders";
import {
    CommandInteraction,
    MessageActionRow,
    MessageEmbed,
    MessageSelectMenu,
    MessageSelectOptionData,
} from "discord.js";
import {WebSub} from "../../models/WebSub";
import {Subscription} from "../../models/Subscription";
import {embed} from "../../utils/embed";
import {google, youtube_v3} from "googleapis";
import {MessageComponentTypes} from "discord.js/typings/enums";
import {SubCommand} from "../CommandManager";
import Dict = NodeJS.Dict;
import Schema$ChannelSnippet = youtube_v3.Schema$ChannelSnippet;

export const ListSubscriptionsCommand: SubCommand = {
    definition: new SlashCommandSubcommandBuilder()
        .setName('ls')
        .setDescription('List the subscriptions for current channel.'),

    async handle(interaction: CommandInteraction) {
        await interaction.reply({
            embeds: [embed.log(`Querying subscriptions for ${interaction.channel}.`)]
        });
        let subs = await WebSub.findAll({
            include: [Subscription],
            where: {
                '$subscriptions.discord_channel_id$': interaction.channelId
            }
        });
        if(subs.length === 0){
            await interaction.editReply({
                embeds: [embed.warn(`No subscriptions for ${interaction.channel}.`)]
            });
            return;
        }
        let res = await google.youtube('v3').channels.list({
            part: ['id', 'snippet'],
            id: subs.map(s => s.youtube_channel),
            maxResults: subs.length,
        });
        let channels: Dict<Schema$ChannelSnippet> = {};
        let options: MessageSelectOptionData[] = [];
        for(let channel of res.data.items){
            options.push({
                label: channel.snippet.title,
                description: channel.snippet.description.length > 100 ?
                    channel.snippet.description.slice(0, 97) + '...' :
                    channel.snippet.description,
                value: channel.id
            });
            channels[channel.id] = channel.snippet;
        }
        let menu = new MessageSelectMenu();
        menu.setCustomId('youtube_subscriptions');
        menu.setPlaceholder('Select a channel to view details');
        menu.setOptions(options);
        let msg = await interaction.editReply({
            embeds: [embed.info(`Subscriptions for ${interaction.channel}:`)],
            components: [new MessageActionRow().setComponents(menu)]
        });
        let message = await interaction.channel.messages.fetch(msg.id);
        let collector = message.createMessageComponentCollector({
            componentType: MessageComponentTypes.SELECT_MENU, time: 60000
        });
        collector.on('collect', async (imenu)=>{
            let embed = new MessageEmbed();
            let channel = channels[imenu.values[0]];
            embed.setColor('GREEN');
            embed.setTitle(channel.title);
            embed.setURL(`https://youtube.com/channel/${imenu.values[0]}`);
            embed.setThumbnail(channel.thumbnails.default.url);
            embed.setDescription(channel.description);
            embed.addField('Channel ID', imenu.values[0]);
            await imenu.reply({embeds: [embed]});
        });
        collector.on('end', ()=>{
            menu.setPlaceholder("Expired.");
            menu.setDisabled(true);
            message.edit({
                embeds: [embed.info(`Subscriptions for ${interaction.channel}:`)],
                components: [new MessageActionRow().setComponents(menu)]
            });
        });
    }
}