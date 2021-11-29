import {Command} from "../manager/CommandManager";
import {
    ButtonInteraction,
    CommandInteraction, Interaction,
    MessageActionRow,
    MessageButton, MessageEmbed,
    MessageSelectMenu,
    MessageSelectOptionData, SelectMenuInteraction
} from "discord.js";
import {ApplicationCommandTypes} from "discord.js/typings/enums";
import {embed} from "../utils/embed";
import {google, youtube_v3} from "googleapis";
import Dict = NodeJS.Dict;
import Schema$SearchResultSnippet = youtube_v3.Schema$SearchResultSnippet;
import Schema$SearchListResponse = youtube_v3.Schema$SearchListResponse;
import {logger} from "../logger";
import {SubscriptionManager} from "../manager/SubscriptionManager";
import {catchLog} from "../utils/catchLog";

function limit(str: string, length: number){
    if(str.length <= length){
        return str;
    }
    return str.slice(0, length - 3) + '...';
}

function buildSearchResult(res: Schema$SearchListResponse): MessageActionRow[]{
    let select = new MessageSelectMenu()
        .setCustomId('youtube-search-result')
        .setOptions(res.items.map(i=>({
            label: i.snippet.title,
            description: limit(i.snippet.description, 100),
            value: i.id.channelId,
        } as MessageSelectOptionData)))
        .setPlaceholder('Select a channel to view details.');
    let prev = new MessageButton()
        .setStyle('SECONDARY')
        .setCustomId('youtube-search-prev')
        .setLabel('Previous Page')
        .setDisabled(!res.prevPageToken);
    let next = new MessageButton()
        .setStyle('SECONDARY')
        .setCustomId('youtube-search-next')
        .setLabel('Next Page')
        .setDisabled(!res.nextPageToken);
    return [
        new MessageActionRow({components: [select]}),
        new MessageActionRow({components: [prev, next]}),
    ];
}

function makeSubscribeButton(state: boolean){
    let button = new MessageButton()
        .setLabel(state ? 'Unsubscribe' : 'Subscribe')
        .setStyle(state ? "SECONDARY" : "DANGER")
        .setEmoji(state ? '❌' : '➕')
        .setCustomId('youtube-subscribe');
    return new MessageActionRow()
        .addComponents(button);
}

async function sendDetailPage(interaction: SelectMenuInteraction, snippet: Schema$SearchResultSnippet){
    let manager = await SubscriptionManager.get(interaction.channelId);
    let embed = new MessageEmbed()
        .setTitle(snippet.channelTitle)
        .setDescription(snippet.description)
        .setURL(`https://youtube.com/channel/${snippet.channelId}`)
        .setThumbnail(snippet.thumbnails.medium.url)
        .setFooter(snippet.channelId);
    let reply = await interaction.reply({
        embeds: [embed],
        components: [makeSubscribeButton(await manager.hasSubscription(snippet.channelId))],
        ephemeral: true,
        fetchReply: true,
    });
    let msg = await interaction.channel.messages.fetch(reply.id);
    let buttonHandler = msg.createMessageComponentCollector({componentType: "BUTTON", time: 60000});
    buttonHandler.on('collect', catchLog(async (i: ButtonInteraction) => {
        if(await manager.hasSubscription(snippet.channelId)){
            await manager.unsubscribe(snippet.channelId);
        } else {
            await manager.subscribe(snippet.channelId);
        }
        await i.update({
            embeds: [embed],
            components: [makeSubscribeButton(await manager.hasSubscription(snippet.channelId))],
        });
    }));
    buttonHandler.on('end', ()=>{
        interaction.editReply({
            embeds: [embed],
            components: []
        }).catch(logger.error);
    });
}

const handlers: Dict<(interaction: CommandInteraction) => Promise<unknown>> = {
    async search(interaction: CommandInteraction){
        let keyword = interaction.options.getString('keyword', true);
        await interaction.reply({
            embeds: [embed.info(`Searching for "${keyword}"`)],
            ephemeral: true,
        });
        let res = await google.youtube('v3').search.list({
            q: keyword, type: ['channel'], part: ['snippet', 'id'], maxResults: 10
        });
        if(res.data.pageInfo.totalResults === 0){
            await interaction.editReply({
                embeds: [embed.warn(`No search results for "${keyword}"`)]
            });
            return;
        }
        let dict: Dict<Schema$SearchResultSnippet> = Object
            .fromEntries(res.data.items.map(d => [d.id.channelId, d.snippet]));
        let message = embed.info(`Search results for ${keyword}`)
            .setFooter(`${res.data.pageInfo.totalResults} Results`);
        let reply = await interaction.editReply({
            embeds: [message],
            components: buildSearchResult(res.data)
        });
        let msg = await interaction.channel.messages.fetch(reply.id);
        let menuHandler = msg.createMessageComponentCollector({time: 300000});
        menuHandler.on('collect', catchLog(async (i: Interaction) => {
            if(i.isSelectMenu()){
                let selected = dict[i.values[0]];
                await sendDetailPage(i, selected);
                await interaction.editReply({
                    embeds: [message],
                    components: buildSearchResult(res.data)
                });
            } else if(i.isButton()) {
                let pageToken = i.customId === 'youtube-search-prev' ?
                    res.data.prevPageToken : res.data.nextPageToken;
                res = await google.youtube('v3').search.list({
                    q: keyword, type: ['channel'], part: ['snippet', 'id'], maxResults: 10, pageToken
                });
                dict = Object.fromEntries(res.data.items.map(d => [d.id.channelId, d.snippet]));
                await i.update({
                    embeds: [message],
                    components: buildSearchResult(res.data)
                });
            }
        }));
        menuHandler.on('end', () => {
            interaction.editReply({
                embeds: [embed.warn('Search expired.')],
                components: []
            }).catch(logger.error);
        });
    },
    async subscribe(interaction: CommandInteraction){

    },
    async unsubscribe(interaction: CommandInteraction){

    },
    async list(interaction: CommandInteraction){

    }
}

const mentions: Dict<(interaction: CommandInteraction) => Promise<unknown>> = {
    async add(interaction: CommandInteraction){

    },
    async remove(interaction: CommandInteraction){

    }
}

export const YoutubeCommand: Command = {
    id: '5c68e897-1737-4fbd-97e0-5e383b54246b',
    definition: {
        type: ApplicationCommandTypes.CHAT_INPUT,
        name: 'youtube',
        description: 'Operate youtube subscriptions on channel',
        defaultPermission: false,
        options: [
            {
                name: 'search',
                type: "SUB_COMMAND",
                description: 'Search a channel on youtube.',
                options: [
                    {
                        type: "STRING",
                        name: 'keyword',
                        description: 'Keyword for searching.',
                        required: true,
                    }
                ]
            },
            {
                name: 'subscribe',
                type: "SUB_COMMAND",
                description: 'Search a channel on youtube.',
                options: [
                    {
                        name: 'channel_id',
                        type: "STRING",
                        description: 'Youtube channel id to subscribe.',
                        required: true,
                    },
                    {
                        name: 'mention',
                        type: "MENTIONABLE",
                        description:'Mention when receive notification',
                        required: false,
                    }
                ]
            },
            {
                name: 'unsubscribe',
                type: "SUB_COMMAND",
                description: 'Search a channel on youtube.',
                options: [
                    {
                        type: "STRING",
                        name: 'channel_id',
                        description: 'Youtube channel id to unsubscribe.',
                        required: true,
                    }
                ]
            },
            {
                name: 'list',
                type: "SUB_COMMAND",
                description: 'List the current subscriptions on this channel',
            },
            {
                name: 'mentions',
                type: "SUB_COMMAND_GROUP",
                description: 'Operation mentions for notifications.',
                options: [
                    {
                        name: 'add',
                        type: "SUB_COMMAND",
                        description: 'Add mention to a subscription.',
                        options: [
                            {
                                name: 'channel_id',
                                type: 'STRING',
                                description: 'Youtube channel id to operate.',
                                required: true
                            },
                            {
                                name: 'mention',
                                type: 'MENTIONABLE',
                                description: 'Mentionable to add.',
                                required: true
                            }
                        ]
                    },
                    {
                        name: 'remove',
                        type: "SUB_COMMAND",
                        description: 'Remove mention from a subscription.',
                        options: [
                            {
                                name: 'channel_id',
                                type: 'STRING',
                                description: 'Youtube channel id to operate.',
                                required: true
                            },
                            {
                                name: 'mention',
                                type: 'MENTIONABLE',
                                description: 'Mentionable to remove.',
                                required: true
                            }
                        ]
                    }
                ],
            }
        ]
    },
    async handle(interaction: CommandInteraction) {
        let sub = interaction.options.getSubcommand(true);
        if(interaction.options.getSubcommandGroup(false) === 'mention'){
            await mentions[sub](interaction);
            return;
        }
        await handlers[sub](interaction);
    }
}