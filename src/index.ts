import * as config from './config';
import {sequelize as sql} from "./sql";
import {logger} from "./logger";
import {Notification} from "./models/Notification";
import {Subscription} from "./models/Subscription";
import {WebSub} from "./models/WebSub";
import {YoutubeVideo} from "./models/YoutubeVideo";
import {server} from "./express/server";
import {google} from "googleapis";
import {bot} from "./bot";
import {Op} from "sequelize";
import cron = require('node-cron');
import moment = require("moment");
import {CommandMap} from "./models/CommandMap";
import {redis} from "./redis";

sql.addModels([
    Notification,
    Subscription,
    WebSub,
    YoutubeVideo,
    CommandMap,
]);

(async () => {
    if (config.get('database.sync')) {
        await sql.sync({alter: true, force: false});
        logger.info("DB synced.");
    }

    await redis.connect();
    logger.info('Redis connected.');

    google.options({auth: config.get('youtube.key')});

    server.listen(config.get('websub.port', config.get('websub.host')), () => {
        logger.info('Websub listener ready.');
    });

    let checkWebSub = () => {
        WebSub.findAll({
            where: {
                [Op.or]: [
                    {expires_at: null},
                    {expires_at: {[Op.lte]: moment().add({hour: 1}).toDate()}}
                ]
            }
        }).then(async subs => {
            for (let websub of subs) {
                await websub.subscribe();
            }
        }).catch(error => logger.error(error));
    };

    // Setup cron for renew websub
    cron.schedule('*/5 * * * *', checkWebSub);
    await checkWebSub();

    await bot.login(config.get('discord.token'));
})().catch(e => {
    logger.error(e);
    process.exit(1);
});
