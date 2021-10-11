"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.channel = void 0;
exports.channel = {
    name(channel) {
        if (channel.type === 'DM') {
            return channel.recipient.tag;
        }
        else {
            let ch = channel;
            return `[${ch.guild.name}]${ch.name}`;
        }
    }
};

//# sourceMappingURL=channel.js.map
