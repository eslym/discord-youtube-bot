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
exports.AddMentionCommand = void 0;
const builders_1 = require("@discordjs/builders");
const embed_1 = require("../../../utils/embed");
const cmd_1 = require("../../../utils/cmd");
exports.AddMentionCommand = {
    definition: new builders_1.SlashCommandSubcommandBuilder()
        .setName('add')
        .setDescription('Add mention to subscription notification')
        .addStringOption(opt => opt.setName('channel_id')
        .setDescription('Youtube channel id')
        .setRequired(true))
        .addMentionableOption(opt => opt.setName('mention')
        .setDescription('Mentionable')
        .setRequired(true)),
    handle(interaction) {
        return __awaiter(this, void 0, void 0, function* () {
            let verify = yield cmd_1.cmd.verifySubscription(interaction);
            if (!verify) {
                return;
            }
            let { subscription, channelData } = verify;
            let mention = interaction.options.getMentionable('mention').toString();
            if (!subscription.mention) {
                subscription.mention = mention;
            }
            else if (subscription.mention.search(mention) === -1) {
                subscription.mention += mention;
            }
            if (subscription.changed()) {
                yield subscription.save();
            }
            yield interaction.reply({
                embeds: [embed_1.embed.info(`Added mention to notification for ${channelData.snippet.title}`)]
            });
        });
    }
};

//# sourceMappingURL=AddMentionCommand.js.map
