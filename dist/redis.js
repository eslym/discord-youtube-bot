"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.redis = void 0;
const redis_1 = require("redis");
const config_1 = require("./config");
exports.redis = (0, redis_1.createClient)((0, config_1.get)('redis'));

//# sourceMappingURL=redis.js.map
