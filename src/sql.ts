import {Sequelize} from "sequelize-typescript";
import {logger} from "./logger";
import * as moment from 'moment';
import config = require("config");

export const sequelize: Sequelize = new Sequelize(
    config.get('database.database'),
    config.get('database.username'),
    config.get('database.password'),
    {
        dialect: config.get('database.driver'),
        logging: config.get('database.logging') ? logger.log : false,
        host: config.get('database.host'),
        port: config.get('database.port'),
        timezone: config.has('database.timezone') ?
            config.get('database.timezone') :
            moment().format('Z'),
        define: {
            charset: 'utf8',
            collate: 'utf8_general_ci',
            timestamps: true
        }
    }
);