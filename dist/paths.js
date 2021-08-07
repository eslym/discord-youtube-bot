"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.configPath = exports.basePath = void 0;
const path = require("path");
function basePath(...segments) {
    return path.resolve(__dirname, '..', ...segments);
}
exports.basePath = basePath;
function configPath(...segments) {
    return basePath('config', ...segments);
}
exports.configPath = configPath;

//# sourceMappingURL=paths.js.map
