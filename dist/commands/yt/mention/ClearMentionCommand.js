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
exports.ClearMentionCommand = void 0;
const builders_1 = require("@discordjs/builders");
const cmd_1 = require("../../../utils/cmd");
const embed_1 = require("../../../utils/embed");
exports.ClearMentionCommand = {
    definition: new builders_1.SlashCommandSubcommandBuilder()
        .setName('clear')
        .setDescription('Clear mentions for subscription notification')
        .addStringOption(opt => opt.setName('channel_id')
        .setDescription('Youtube channel id')
        .setRequired(true)),
    handle(interaction) {
        return __awaiter(this, void 0, void 0, function* () {
            let verify = yield cmd_1.cmd.verifySubscription(interaction);
            if (!verify) {
                return;
            }
            let { subscription, channelData } = verify;
            if (subscription.mention) {
                subscription.mention = null;
            }
            if (subscription.changed()) {
                yield subscription.save();
            }
            yield interaction.reply({
                embeds: [embed_1.embed.info(`Removed mention from notification for ${channelData.snippet.title}`)]
            });
        });
    }
};

//# sourceMappingURL=ClearMentionCommand.js.map
