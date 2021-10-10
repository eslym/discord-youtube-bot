"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ButtonStyle = exports.Button = void 0;
const Component_1 = require("./Component");
class Button {
    constructor(type, ...params) {
        this.type = Component_1.ComponentType.BUTTON;
        this.style = type;
        let param = params.shift();
        if (type === ButtonStyle.LINK) {
            this.url = param.toString();
            param = params.shift();
        }
        if (typeof param === 'string') {
            this.label = param;
        }
        else {
            this.emoji = param;
        }
    }
    setLabel(label) {
        this.label = label;
        return this;
    }
    setEmoji(emoji) {
        this.emoji = emoji;
        return this;
    }
    setCustomId(custom_id) {
        this.custom_id = custom_id;
        return this;
    }
    setDisabled(disabled) {
        this.disabled = disabled;
        return this;
    }
}
exports.Button = Button;
var ButtonStyle;
(function (ButtonStyle) {
    ButtonStyle[ButtonStyle["PRIMARY"] = 1] = "PRIMARY";
    ButtonStyle[ButtonStyle["SECONDARY"] = 2] = "SECONDARY";
    ButtonStyle[ButtonStyle["SUCCESS"] = 3] = "SUCCESS";
    ButtonStyle[ButtonStyle["DANGER"] = 4] = "DANGER";
    ButtonStyle[ButtonStyle["LINK"] = 5] = "LINK";
})(ButtonStyle = exports.ButtonStyle || (exports.ButtonStyle = {}));

//# sourceMappingURL=Button.js.map
