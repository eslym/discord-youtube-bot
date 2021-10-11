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
exports.UnsubscribeCommand = void 0;
const builders_1 = require("@discordjs/builders");
const WebSub_1 = require("../../models/WebSub");
const embed_1 = require("../../utils/embed");
const Subscription_1 = require("../../models/Subscription");
const Notification_1 = require("../../models/Notification");
exports.UnsubscribeCommand = {
    definition: new builders_1.SlashCommandSubcommandBuilder()
        .setName('remove')
        .setDescription('Unsubscribe a youtube channel from this text channel.')
        .addStringOption(opt => opt.setName('channel_id')
        .setDescription('Youtube channel id to unsubscribe.')
        .setRequired(true)),
    handle(interaction) {
        return __awaiter(this, void 0, void 0, function* () {
            let channel_id = interaction.options.getString('channel_id');
            let channel = interaction.channel;
            let websub = yield WebSub_1.WebSub.findOne({
                where: {
                    youtube_channel: channel_id,
                }
            });
            if (!websub) {
                websub = new WebSub_1.WebSub({
                    youtube_channel: channel_id,
                });
                let snippet = yield websub.fetchSnippet();
                if (snippet === null) {
                    yield interaction.reply({
                        embeds: [embed_1.embed.error(`Cannot find youtube channel with ID: \`${channel_id}\`.`)]
                    });
                    return;
                }
                let title = snippet.snippet.title;
                yield interaction.reply({
                    embeds: [embed_1.embed.error(`${channel} does not subscribe ${title}!`)]
                });
                return;
            }
            let snippet = yield websub.fetchSnippet();
            let title = snippet.snippet.title;
            let sub = yield Subscription_1.Subscription.findOne({
                where: {
                    sub_id: websub.id,
                    discord_channel_id: channel.id,
                }
            });
            if (!sub) {
                yield interaction.reply({
                    embeds: [embed_1.embed.error(`${channel} does not subscribe ${title}!`)]
                });
                return;
            }
            yield Notification_1.Notification.destroy({
                where: {
                    subscription_id: sub.id,
                }
            });
            yield sub.destroy();
            let count = yield Subscription_1.Subscription.count({
                where: {
                    sub_id: websub.id,
                }
            });
            if (count === 0) {
                yield websub.subscribe('unsubscribe');
            }
            yield interaction.reply({ embeds: [embed_1.embed.info(`Unsubscribed ${title} for ${channel}.`)] });
        });
    }
};

//# sourceMappingURL=UnsubscribeCommand.js.map
