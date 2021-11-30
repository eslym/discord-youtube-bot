"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const config = require("./config");
const sql_1 = require("./sql");
const logger_1 = require("./logger");
const Notification_1 = require("./models/Notification");
const Subscription_1 = require("./models/Subscription");
const WebSub_1 = require("./models/WebSub");
const YoutubeVideo_1 = require("./models/YoutubeVideo");
const server_1 = require("./express/server");
const googleapis_1 = require("googleapis");
const bot_1 = require("./bot");
const sequelize_1 = require("sequelize");
const cron = require("node-cron");
const moment = require("moment");
const CommandMap_1 = require("./models/CommandMap");
const redis_1 = require("./redis");
sql_1.sequelize.addModels([
    Notification_1.Notification,
    Subscription_1.Subscription,
    WebSub_1.WebSub,
    YoutubeVideo_1.YoutubeVideo,
    CommandMap_1.CommandMap,
]);
(async () => {
    if (config.get('database.sync')) {
        await sql_1.sequelize.sync({ alter: true, force: false });
        logger_1.logger.info("DB synced.");
    }
    await redis_1.redis.connect();
    logger_1.logger.info('Redis connected.');
    googleapis_1.google.options({ auth: config.get('youtube.key') });
    server_1.server.listen(config.get('websub.port', config.get('websub.host')), () => {
        logger_1.logger.info('Websub listener ready.');
    });
    let checkWebSub = () => {
        WebSub_1.WebSub.findAll({
            where: {
                [sequelize_1.Op.or]: [
                    { expires_at: null },
                    { expires_at: { [sequelize_1.Op.lte]: moment().add({ hour: 1 }).toDate() } }
                ]
            }
        }).then(async (subs) => {
            for (let websub of subs) {
                await websub.subscribe();
            }
        }).catch(error => logger_1.logger.error(error));
    };
    // Setup cron for renew websub
    cron.schedule('*/5 * * * *', checkWebSub);
    await checkWebSub();
    await bot_1.bot.login(config.get('discord.token'));
})().catch(e => {
    logger_1.logger.error(e);
    process.exit(1);
});

//# sourceMappingURL=index.js.map
