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
exports.SubscribeCommand = void 0;
const builders_1 = require("@discordjs/builders");
const WebSub_1 = require("../../models/WebSub");
const Subscription_1 = require("../../models/Subscription");
const embed_1 = require("../../utils/embed");
exports.SubscribeCommand = {
    definition: new builders_1.SlashCommandSubcommandBuilder()
        .setName('sub')
        .setDescription('Subscribe a youtube channel for this text channel.')
        .addStringOption(opt => opt.setName('channel_id')
        .setDescription('Youtube channel id to unsubscribe.')
        .setRequired(true))
        .addMentionableOption(opt => opt.setName('mention')
        .setDescription('Mention when received notification.')
        .setRequired(false)),
    handle(interaction) {
        return __awaiter(this, void 0, void 0, function* () {
            let channel_id = interaction.options.getString('channel_id');
            let channel = interaction.channel;
            let websub = yield WebSub_1.WebSub.findOne({
                where: {
                    youtube_channel: channel_id,
                }
            });
            let title;
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
                yield websub.save();
                websub.subscribe().then();
                title = snippet.snippet.title;
            }
            else {
                let snippet = yield websub.fetchSnippet();
                title = snippet.snippet.title;
            }
            let sub = yield Subscription_1.Subscription.count({
                where: {
                    sub_id: websub.id,
                    discord_channel_id: channel.id,
                }
            });
            if (sub > 0) {
                yield interaction.reply({ embeds: [embed_1.embed.warn(`${channel} already have this subscription!`)] });
                return;
            }
            let mention = interaction.options.getMentionable('mention');
            yield Subscription_1.Subscription.create({
                sub_id: websub.id,
                discord_channel_id: channel.id,
                mention: mention === null ? null : mention.toString()
            });
            yield interaction.reply({ embeds: [embed_1.embed.info(`Subscribed ${title} for ${channel}.`)] });
        });
    }
};

//# sourceMappingURL=SubscribeCommand.js.map
