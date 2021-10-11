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
exports.cmd = void 0;
const Subscription_1 = require("../models/Subscription");
const embed_1 = require("./embed");
exports.cmd = {
    verifySubscription(interaction) {
        return __awaiter(this, void 0, void 0, function* () {
            let channel_id = interaction.options.getString('channel_id');
            let channel = interaction.channel;
            let { websub, subscription } = yield Subscription_1.Subscription.tryFind(channel_id, channel);
            let snippet = yield websub.fetchSnippet();
            if (snippet === null) {
                yield interaction.reply({
                    embeds: [embed_1.embed.error(`Cannot find youtube channel with ID: \`${channel_id}\`.`)]
                });
                return null;
            }
            let title = snippet.snippet.title;
            if (!subscription) {
                yield interaction.reply({
                    embeds: [embed_1.embed.error(`${channel} does not subscribe ${title}!`)]
                });
                return null;
            }
            return { websub, subscription, channelData: snippet };
        });
    }
};

//# sourceMappingURL=cmd.js.map
