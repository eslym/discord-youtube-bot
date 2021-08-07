"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sequelize = void 0;
const sequelize_typescript_1 = require("sequelize-typescript");
const config = require("./config");
const logger_1 = require("./logger");
const moment = require("moment");
exports.sequelize = new sequelize_typescript_1.Sequelize(config.get('database.database'), config.get('database.username'), config.get('database.password'), {
    dialect: config.get('database.driver'),
    logging: config.get('database.logging') ? logger_1.logger.log : false,
    host: config.get('database.host'),
    port: config.get('database.port'),
    timezone: config.get('database.timezone', moment().format('Z')),
    define: {
        charset: 'utf8',
        collate: 'utf8_general_ci',
        timestamps: true
    }
});

//# sourceMappingURL=sql.js.map
