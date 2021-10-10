"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ActionRow = void 0;
const Component_1 = require("./Component");
class ActionRow {
    constructor(components) {
        this.type = Component_1.ComponentType.ACTION_ROW;
        this.components = Array.isArray(components) ? Array.from(components) : [];
    }
    push(component, ...components) {
        this.components.push(component, ...components);
    }
}
exports.ActionRow = ActionRow;

//# sourceMappingURL=ActionRow.js.map
