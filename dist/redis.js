"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.redis = void 0;
const config = require("config");
const redis_1 = require("redis");
exports.redis = (0, redis_1.createClient)(config.has('redis') ?
    config.get('redis') : {});

//# sourceMappingURL=redis.js.map
