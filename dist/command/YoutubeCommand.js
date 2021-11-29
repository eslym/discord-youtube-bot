"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.YoutubeCommand = void 0;
const discord_js_1 = require("discord.js");
const embed_1 = require("../utils/embed");
const googleapis_1 = require("googleapis");
const logger_1 = require("../logger");
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
        value: i.id.channelId,
    })))
        .setPlaceholder('Select a channel to view details.');
    let prev = new discord_js_1.MessageButton()
        .setStyle('SECONDARY')
        .setCustomId('youtube-search-prev')
        .setLabel('Previous Page')
        .setDisabled(!!res.prevPageToken);
    let next = new discord_js_1.MessageButton()
        .setStyle('SECONDARY')
        .setCustomId('youtube-search-next')
        .setLabel('Next Page')
        .setDisabled(!!res.nextPageToken);
    return [
        new discord_js_1.MessageActionRow({ components: [select] }),
        new discord_js_1.MessageActionRow({ components: [prev, next] }),
    ];
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
        let menuHandler = msg.createMessageComponentCollector({ time: 600 });
        menuHandler.on('collect', (i) => {
            if (i.isSelectMenu()) {
                let m = i;
                let selected = dict[m.values[0]];
                let info = new discord_js_1.MessageEmbed()
                    .setTitle(selected.title)
                    .setDescription(selected.description)
                    .setThumbnail(selected.thumbnails.default.url)
                    .setFooter(selected.channelId)
                    .setColor("GREEN");
            }
        });
        menuHandler.on('end', () => {
            interaction.editReply({
                embeds: [embed_1.embed.warn('Search expired.')]
            }).then(logger_1.logger.error);
        });
    },
    async subscribe(interaction) {
    },
    async unsubscribe(interaction) {
    },
    async list(interaction) {
    }
};
const mentions = {
    async add(interaction) {
    },
    async remove(interaction) {
    }
};
exports.YoutubeCommand = {
    id: '5c68e897-1737-4fbd-97e0-5e383b54246b',
    definition: {
        type: 1 /* CHAT_INPUT */,
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
                        description: 'Mention when receive notification',
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
    async handle(interaction) {
        let sub = interaction.options.getSubcommand(true);
        if (interaction.options.getSubcommandGroup(false) === 'mention') {
            await mentions[sub](interaction);
            return;
        }
        await handlers[sub](interaction);
    }
};

//# sourceMappingURL=YoutubeCommand.js.map
