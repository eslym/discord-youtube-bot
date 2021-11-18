"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.cmd = void 0;
const Subscription_1 = require("../models/Subscription");
const embed_1 = require("./embed");
exports.cmd = {
    async verifySubscription(interaction) {
        let channel_id = interaction.options.getString('channel_id');
        let channel = interaction.channel;
        let { websub, subscription } = await Subscription_1.Subscription.tryFind(channel_id, channel);
        let snippet = await websub.fetchYoutubeChannelMeta();
        if (snippet === null) {
            await interaction.reply({
                embeds: [embed_1.embed.error(`Cannot find youtube channel with ID: \`${channel_id}\`.`)]
            });
            return null;
        }
        let title = snippet.snippet.title;
        if (!subscription) {
            await interaction.reply({
                embeds: [embed_1.embed.error(`${channel} does not subscribe ${title}!`)]
            });
            return null;
        }
        return { websub, subscription, channelData: snippet };
    }
};

//# sourceMappingURL=cmd.js.map
