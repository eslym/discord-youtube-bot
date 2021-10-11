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
const embed_1 = require("../../utils/embed");
const Subscription_1 = require("../../models/Subscription");
const Notification_1 = require("../../models/Notification");
const cmd_1 = require("../../utils/cmd");
exports.UnsubscribeCommand = {
    definition: new builders_1.SlashCommandSubcommandBuilder()
        .setName('unsub')
        .setDescription('Unsubscribe a youtube channel from this text channel.')
        .addStringOption(opt => opt.setName('channel_id')
        .setDescription('Youtube channel id to unsubscribe.')
        .setRequired(true)),
    handle(interaction) {
        return __awaiter(this, void 0, void 0, function* () {
            let channel = interaction.channel;
            let verify = yield cmd_1.cmd.verifySubscription(interaction);
            if (!verify) {
                return;
            }
            let { websub, subscription, channelData } = verify;
            yield Notification_1.Notification.destroy({
                where: {
                    subscription_id: subscription.id,
                }
            });
            yield subscription.destroy();
            let count = yield Subscription_1.Subscription.count({
                where: {
                    sub_id: websub.id,
                }
            });
            if (count === 0) {
                yield websub.subscribe('unsubscribe');
            }
            yield interaction.reply({ embeds: [embed_1.embed.info(`Unsubscribed ${channelData.snippet.title} for ${channel}.`)] });
        });
    }
};

//# sourceMappingURL=UnsubscribeCommand.js.map
