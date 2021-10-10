"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.embed = void 0;
const discord_js_1 = require("discord.js");
const colors = {
    info: 'GREEN',
    log: 'WHITE',
    warn: 'YELLOW',
    error: 'RED',
};
exports.embed = {};
for (let key in colors) {
    exports.embed[key] = function (text) {
        return new discord_js_1.MessageEmbed({ description: text })
            .setColor(colors[key]);
    };
}

//# sourceMappingURL=embed.js.map
