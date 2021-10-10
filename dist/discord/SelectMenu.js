"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SelectOption = exports.SelectMenu = void 0;
const Component_1 = require("./Component");
class SelectMenu {
    constructor(custom_id, options) {
        this.type = Component_1.ComponentType.SELECT_MENU;
        this.custom_id = custom_id;
        this.options = Array.isArray(options) ? Array.from(options) : [];
    }
    setPlaceholder(placeholder) {
        this.placeholder = placeholder;
        return this;
    }
    setMin(min) {
        this.min_values = min;
        return this;
    }
    setMax(max) {
        this.max_values = max;
        return this;
    }
    setDisabled(disabled) {
        this.disabled = disabled;
        return this;
    }
}
exports.SelectMenu = SelectMenu;
class SelectOption {
    constructor(label, value) {
        this.label = label;
        this.value = value;
    }
    setDescription(description) {
        this.description = description;
        return this;
    }
    setEmoji(emoji) {
        this.emoji = emoji;
        return this;
    }
    setDefault(selected) {
        this.default = selected;
        return this;
    }
}
exports.SelectOption = SelectOption;

//# sourceMappingURL=SelectMenu.js.map
