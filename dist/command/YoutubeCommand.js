"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.YoutubeCommand = void 0;
const discord_js_1 = require("discord.js");
const embed_1 = require("../utils/embed");
const googleapis_1 = require("googleapis");
const logger_1 = require("../logger");
const SubscriptionManager_1 = require("../manager/SubscriptionManager");
const catchLog_1 = require("../utils/catchLog");
const checkbox_1 = require("../utils/checkbox");
const WebSub_1 = require("../models/WebSub");
function limit(str, length) {
    if (str.length <= length) {
        return str;
    }
    return str.slice(0, length - 3) + '...';
}
function buildSearchResult(res) {
    let select = new discord_js_1.MessageSelectMenu()
        .setCustomId('youtube-search-result')
        .setOptions(res.items.map(i => ({
        label: i.snippet.title,
        description: limit(i.snippet.description, 100),
        value: typeof i.id === "string" ? i.id : i.id.channelId,
    })))
        .setPlaceholder('Select a channel to view details.');
    let prev = new discord_js_1.MessageButton()
        .setStyle('SECONDARY')
        .setCustomId('youtube-search-prev')
        .setLabel('Previous Page')
        .setDisabled(!res.prevPageToken);
    let next = new discord_js_1.MessageButton()
        .setStyle('SECONDARY')
        .setCustomId('youtube-search-next')
        .setLabel('Next Page')
        .setDisabled(!res.nextPageToken);
    return [
        new discord_js_1.MessageActionRow({ components: [select] }),
        new discord_js_1.MessageActionRow({ components: [prev, next] }),
    ];
}
async function makeChannelActions(manager, channelId) {
    let state = await manager.hasSubscription(channelId);
    let btnSub = new discord_js_1.MessageButton()
        .setLabel(state ? 'Unsubscribe' : 'Subscribe')
        .setStyle(state ? "SECONDARY" : "DANGER")
        .setEmoji(state ? '❌' : '➕')
        .setCustomId('youtube-subscribe');
    let rows = [
        new discord_js_1.MessageActionRow()
            .addComponents(btnSub)
    ];
    if (state) {
        let sub = await manager.getSubscription(channelId);
        let toggles = new discord_js_1.MessageActionRow()
            .addComponents((0, checkbox_1.checkbox)('New video publish', sub.notify_video).setCustomId('youtube-notify-video'))
            .addComponents((0, checkbox_1.checkbox)('Live streaming scheduled', sub.notify_live).setCustomId('youtube-notify-live'))
            .addComponents((0, checkbox_1.checkbox)('Live streaming re-scheduled', sub.notify_reschedule).setCustomId('youtube-notify-reschedule'))
            .addComponents((0, checkbox_1.checkbox)('Live streaming starting soon', sub.notify_starting).setCustomId('youtube-notify-starting'))
            .addComponents((0, checkbox_1.checkbox)('Live started out of schedule', sub.notify_started).setCustomId('youtube-notify-started'));
        rows.push(toggles);
        let ch = manager.getChannel();
        let roles = await ch.guild.roles.fetch();
        let mentions = new discord_js_1.MessageSelectMenu()
            .setCustomId('youtube-mentions')
            .setPlaceholder('No mentions for notification.')
            .setOptions(roles.map(r => ({
            label: r.name,
            description: r.id,
            value: r.toString(),
            default: sub.mention && sub.mention.includes(r.toString()),
        })))
            .setMinValues(0)
            .setMaxValues(Math.min(25, roles.size));
        rows.push(new discord_js_1.MessageActionRow()
            .addComponents(mentions));
    }
    return rows;
}
async function handleChannelAction(interaction, manager, message_id, youtube_channel, embeds) {
    let msg = await interaction.channel.messages.fetch(message_id);
    let buttonHandler = msg.createMessageComponentCollector({ time: 60000 });
    buttonHandler.on('collect', (0, catchLog_1.catchLog)(async (i) => {
        if (i.isSelectMenu()) {
            let sub = await manager.getSubscription(youtube_channel);
            sub.mention = i.values;
            await sub.save();
        }
        else if (i.customId.startsWith('youtube-notify-')) {
            let type = i.customId.slice(15);
            let sub = await manager.getSubscription(youtube_channel);
            sub[`notify_${type}`] = !sub[`notify_${type}`];
            await sub.save();
        }
        else {
            if (await manager.hasSubscription(youtube_channel)) {
                await manager.unsubscribe(youtube_channel);
            }
            else {
                await manager.subscribe(youtube_channel);
            }
        }
        await i.update({
            embeds,
            components: await makeChannelActions(manager, youtube_channel),
        });
    }));
    buttonHandler.on('end', () => {
        interaction.editReply({
            embeds,
            components: []
        }).catch((err) => logger_1.logger.error(err));
    });
}
async function sendDetailPage(interaction, snippet) {
    let manager = await SubscriptionManager_1.SubscriptionManager.get(interaction.channelId);
    let info = new discord_js_1.MessageEmbed()
        .setTitle(snippet.channelTitle)
        .setDescription(snippet.description)
        .setURL(`https://youtube.com/channel/${snippet.channelId}`)
        .setThumbnail(snippet.thumbnails.medium.url)
        .setFooter(snippet.channelId);
    let reply = await interaction.reply({
        embeds: [info],
        components: await makeChannelActions(manager, snippet.channelId),
        ephemeral: true,
        fetchReply: true,
    });
    await handleChannelAction(interaction, manager, reply.id, snippet.channelId, [info]);
}
const handlers = {
    async search(interaction) {
        let keyword = interaction.options.getString('keyword', true);
        await interaction.reply({
            embeds: [embed_1.embed.info(`Searching for "${keyword}"`)],
            ephemeral: true,
        });
        let res = await googleapis_1.google.youtube('v3').search.list({
            q: keyword, type: ['channel'], part: ['snippet', 'id'], maxResults: 10
        });
        if (res.data.pageInfo.totalResults === 0) {
            await interaction.editReply({
                embeds: [embed_1.embed.warn(`No search results for "${keyword}"`)]
            });
            return;
        }
        let dict = Object
            .fromEntries(res.data.items.map(d => [d.id.channelId, d.snippet]));
        let message = embed_1.embed.info(`Search results for ${keyword}`)
            .setFooter(`${res.data.pageInfo.totalResults} Results`);
        let reply = await interaction.editReply({
            embeds: [message],
            components: buildSearchResult(res.data)
        });
        let msg = await interaction.channel.messages.fetch(reply.id);
        let menuHandler = msg.createMessageComponentCollector({ time: 300000 });
        menuHandler.on('collect', (0, catchLog_1.catchLog)(async (i) => {
            if (i.isSelectMenu()) {
                let selected = dict[i.values[0]];
                await sendDetailPage(i, selected);
                await interaction.editReply({
                    embeds: [message],
                    components: buildSearchResult(res.data)
                });
            }
            else if (i.isButton()) {
                let pageToken = i.customId === 'youtube-search-prev' ?
                    res.data.prevPageToken : res.data.nextPageToken;
                res = await googleapis_1.google.youtube('v3').search.list({
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
                embeds: [embed_1.embed.warn('Search expired.')],
                components: []
            }).catch((err) => logger_1.logger.error(err));
        });
    },
    async inspect(interaction) {
        await interaction.deferReply({ ephemeral: true });
        let id = interaction.options.getString('channel_id');
        let websub = new WebSub_1.WebSub({ youtube_channel_id: id });
        let res = await websub.fetchYoutubeChannelMeta();
        if (res === null) {
            await interaction.reply({
                embeds: [embed_1.embed.warn(`Channel "${id}" not found.`)]
            });
            return;
        }
        let manager = await SubscriptionManager_1.SubscriptionManager.get(interaction.channelId);
        let info = new discord_js_1.MessageEmbed()
            .setTitle(res.snippet.title)
            .setDescription(res.snippet.description)
            .setURL(`https://youtube.com/channel/${res.id}`)
            .setThumbnail(res.snippet.thumbnails.medium.url)
            .setFooter(res.id)
            .addField('Subscribers', res.statistics.subscriberCount, true)
            .addField('Views', res.statistics.viewCount, true);
        let reply = await interaction.editReply({
            embeds: [info],
            components: await makeChannelActions(manager, res.id),
        });
        await handleChannelAction(interaction, manager, reply.id, res.id, [info]);
    },
    async list(interaction) {
        let manager = await SubscriptionManager_1.SubscriptionManager.get(interaction.channelId);
        let subs = await Promise.all((await manager.listSubscription())
            .map(s => s.$get('websub')));
        if (subs.length === 0) {
            await interaction.reply({
                embeds: [embed_1.embed.warn(`No subscriptions for ${interaction.channel}`)],
                ephemeral: true,
            });
            return;
        }
        let res = await googleapis_1.google.youtube('v3').channels.list({
            id: subs.map(s => s.youtube_channel_id),
            part: ['snippet', 'statistics'],
            maxResults: 10,
        });
        let dict = Object
            .fromEntries(res.data.items.map(d => [d.id, d]));
        let message = embed_1.embed.info(`Subscriptions for ${interaction.channel}`)
            .setFooter(`Total: ${subs.length}`);
        let reply = await interaction.reply({
            embeds: [message],
            components: buildSearchResult(res.data),
            ephemeral: true,
            fetchReply: true
        });
        let msg = await interaction.channel.messages.fetch(reply.id);
        let menuHandler = msg.createMessageComponentCollector({ time: 300000 });
        menuHandler.on('collect', (0, catchLog_1.catchLog)(async (i) => {
            if (i.isSelectMenu()) {
                let selected = dict[i.values[0]];
                let info = new discord_js_1.MessageEmbed()
                    .setTitle(selected.snippet.title)
                    .setDescription(selected.snippet.description)
                    .setURL(`https://youtube.com/channel/${selected.id}`)
                    .setThumbnail(selected.snippet.thumbnails.medium.url)
                    .setFooter(selected.id)
                    .addField('Subscribers', selected.statistics.subscriberCount, true)
                    .addField('Views', selected.statistics.viewCount, true);
                let reply = await i.reply({
                    embeds: [info],
                    components: await makeChannelActions(manager, selected.id),
                    fetchReply: true,
                    ephemeral: true,
                });
                await handleChannelAction(i, manager, reply.id, selected.id, [info]);
                await interaction.editReply({
                    embeds: [message],
                    components: buildSearchResult(res.data)
                });
            }
            else if (i.isButton()) {
                let pageToken = i.customId === 'youtube-search-prev' ?
                    res.data.prevPageToken : res.data.nextPageToken;
                res = await googleapis_1.google.youtube('v3').channels.list({
                    id: subs.map(s => s.youtube_channel_id),
                    part: ['snippet', 'statistics'],
                    maxResults: 10, pageToken
                });
                dict = Object.fromEntries(res.data.items.map(d => [d.id, d]));
                await i.update({
                    embeds: [message],
                    components: buildSearchResult(res.data)
                });
            }
        }));
        menuHandler.on('end', () => {
            interaction.editReply({
                embeds: [embed_1.embed.warn('List expired.')],
                components: []
            }).catch((err) => logger_1.logger.error(err));
        });
    }
};
exports.YoutubeCommand = {
    id: '5c68e897-1737-4fbd-97e0-5e383b54246b',
    definition: {
        type: 1 /* ApplicationCommandTypes.CHAT_INPUT */,
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
                name: 'inspect',
                type: "SUB_COMMAND",
                description: 'Inspect a youtube channel state',
                options: [
                    {
                        name: 'channel_id',
                        type: "STRING",
                        description: 'Youtube channel id to subscribe.',
                        required: true,
                    }
                ]
            },
            {
                name: 'list',
                type: "SUB_COMMAND",
                description: 'List the current subscriptions on this channel',
            },
        ]
    },
    async handle(interaction) {
        let sub = interaction.options.getSubcommand(true);
        await handlers[sub](interaction);
    }
};

//# sourceMappingURL=YoutubeCommand.js.map
