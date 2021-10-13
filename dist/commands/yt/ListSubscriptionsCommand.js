"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ListSubscriptionsCommand = void 0;
const builders_1 = require("@discordjs/builders");
const discord_js_1 = require("discord.js");
const WebSub_1 = require("../../models/WebSub");
const Subscription_1 = require("../../models/Subscription");
const embed_1 = require("../../utils/embed");
const googleapis_1 = require("googleapis");
const logger_1 = require("../../logger");
exports.ListSubscriptionsCommand = {
    definition: new builders_1.SlashCommandSubcommandBuilder()
        .setName('ls')
        .setDescription('List the subscriptions for current channel.'),
    handle(interaction) {
        return __awaiter(this, void 0, void 0, function* () {
            yield interaction.reply({
                embeds: [embed_1.embed.log(`Querying subscriptions for ${interaction.channel}.`)],
                ephemeral: true,
            });
            let subs = yield WebSub_1.WebSub.findAll({
                include: [Subscription_1.Subscription],
                where: {
                    '$subscriptions.discord_channel_id$': interaction.channelId
                }
            });
            if (subs.length === 0) {
                yield interaction.editReply({
                    embeds: [embed_1.embed.warn(`No subscriptions for ${interaction.channel}.`)]
                });
                return;
            }
            let res = yield googleapis_1.google.youtube('v3').channels.list({
                part: ['id', 'snippet'],
                id: subs.map(s => s.youtube_channel),
                maxResults: subs.length,
            });
            let channels = {};
            let options = [];
            for (let channel of res.data.items) {
                options.push({
                    label: channel.snippet.title,
                    description: channel.snippet.description.length > 100 ?
                        channel.snippet.description.slice(0, 97) + '...' :
                        channel.snippet.description,
                    value: channel.id
                });
                channels[channel.id] = channel.snippet;
            }
            let menu = new discord_js_1.MessageSelectMenu();
            menu.setCustomId('youtube_subscriptions');
            menu.setPlaceholder('Select a channel to view details');
            menu.setOptions(options);
            let msg = yield interaction.editReply({
                embeds: [embed_1.embed.info(`Subscriptions for ${interaction.channel}:`)],
                components: [new discord_js_1.MessageActionRow().setComponents(menu)]
            });
            let message = yield interaction.channel.messages.fetch(msg.id);
            let collector = message.createMessageComponentCollector({
                componentType: 3 /* SELECT_MENU */, time: 60000
            });
            collector.on('collect', (imenu) => (() => __awaiter(this, void 0, void 0, function* () {
                let meta = new discord_js_1.MessageEmbed();
                let channel = channels[imenu.values[0]];
                meta.setColor('GREEN');
                meta.setTitle(channel.title);
                meta.setURL(`https://youtube.com/channel/${imenu.values[0]}`);
                meta.setThumbnail(channel.thumbnails.default.url);
                meta.setDescription(channel.description);
                meta.addField('Channel ID', imenu.values[0]);
                yield interaction.editReply({
                    embeds: [embed_1.embed.info(`Subscriptions for ${interaction.channel}:`)],
                    components: [new discord_js_1.MessageActionRow().setComponents(menu)]
                });
                yield imenu.reply({ embeds: [meta] });
            }))().catch(logger_1.logger.error));
            collector.on('end', () => {
                menu.setPlaceholder("Expired.");
                menu.setDisabled(true);
                interaction.editReply({
                    embeds: [embed_1.embed.info(`Subscriptions for ${interaction.channel}:`)],
                    components: [new discord_js_1.MessageActionRow().setComponents(menu)]
                }).catch(logger_1.logger.error);
            });
        });
    }
};

//# sourceMappingURL=ListSubscriptionsCommand.js.map
