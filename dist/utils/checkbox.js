"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkbox = void 0;
const discord_js_1 = require("discord.js");
function checkbox(label, checked = false) {
    return new discord_js_1.MessageButton()
        .setStyle('SECONDARY')
        .setLabel(label)
        .setEmoji(checked ? '✅' : '⬜');
}
exports.checkbox = checkbox;

//# sourceMappingURL=checkbox.js.map
