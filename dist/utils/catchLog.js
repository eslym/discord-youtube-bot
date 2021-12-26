"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.catchLog = void 0;
const logger_1 = require("../logger");
function catchLog(promiseProvider, level = 'error') {
    return ((...args) => (new Promise((resolve) => {
        resolve(promiseProvider(...args));
    })).catch((err) => logger_1.logger[level](err)));
}
exports.catchLog = catchLog;

//# sourceMappingURL=catchLog.js.map
