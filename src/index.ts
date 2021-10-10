import * as config from './config';

config.reload();

import {sequelize as sql} from "./sql";
import {logger} from "./logger";

sql.addModels([__dirname + '/models']);

(async () => {
    if (config.get('database.sync')) {
        await sql.sync({alter: true});
        logger.info("DB Synced.");
    }
})().catch(e => logger.error(e));