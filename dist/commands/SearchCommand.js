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
exports.SearchCommand = void 0;
const builders_1 = require("@discordjs/builders");
const discord_js_1 = require("discord.js");
const googleapis_1 = require("googleapis");
exports.SearchCommand = {
    definition: new builders_1.SlashCommandSubcommandBuilder()
        .setName('search')
        .setDescription('Search youtube channel')
        .addStringOption(opt => opt.setName('channel')
        .setDescription('Keyword to for searching channel')
        .setRequired(true)),
    handle(interaction) {
        return __awaiter(this, void 0, void 0, function* () {
            let keyword = interaction.options.getString('channel');
            yield interaction.reply(`Searching on "${keyword}" on youtube.`);
            let res = yield googleapis_1.google.youtube('v3').search.list({
                q: keyword, type: ['channel'], part: ['snippet', 'id'], maxResults: 10
            });
            if (res.data.pageInfo.totalResults === 0) {
                yield interaction.followUp(`No search result for "${keyword}" :(`);
                return;
            }
            let channels = {};
            let menu = new discord_js_1.MessageSelectMenu();
            menu.setCustomId('youtube_subscribe_' + discord_js_1.SnowflakeUtil.generate());
            menu.setPlaceholder('Select a channel to subscribe');
            menu.addOptions(res.data.items.map(item => {
                channels[item.id.channelId] = item.snippet.title;
                return {
                    label: item.snippet.title,
                    description: item.snippet.description.length > 100 ?
                        item.snippet.description.slice(0, 97) + '...' :
                        item.snippet.description,
                    value: item.id.channelId,
                };
            }));
            let msg = yield interaction.followUp({
                content: `Search results for "${keyword}":`,
                components: [new discord_js_1.MessageActionRow().setComponents(menu)]
            });
            let message = yield interaction.channel.messages.fetch(msg.id);
            let collector = message.createMessageComponentCollector({
                componentType: 3 /* SELECT_MENU */, time: 20000
            });
            collector.on('collect', (imenu) => __awaiter(this, void 0, void 0, function* () {
                if (imenu.user.id !== interaction.user.id) {
                    yield imenu.reply(`${interaction.user} you can't do this!`);
                    return;
                }
                imenu.reply(imenu.values[0]);
                menu.setPlaceholder(`Subscribed to ${channels[imenu.values[0]]}`);
                menu.setDisabled(true);
                yield message.edit({
                    content: `Search results for ${keyword}:`,
                    components: [new discord_js_1.MessageActionRow().setComponents(menu)]
                });
                collector.removeAllListeners('end');
            }));
            collector.on('end', () => {
                menu.setPlaceholder("Expired.");
                menu.setDisabled(true);
                message.edit({
                    content: `Search results for ${keyword}:`,
                    components: [new discord_js_1.MessageActionRow().setComponents(menu)]
                });
            });
        });
    }
};

//# sourceMappingURL=SearchCommand.js.map
