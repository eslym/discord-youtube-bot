"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.catchLog = void 0;
const logger_1 = require("../logger");
function catchLog(promiseProvider) {
    return ((...args) => promiseProvider(...args)
        .catch(logger_1.logger.error));
}
exports.catchLog = catchLog;

//# sourceMappingURL=catchLog.js.map
