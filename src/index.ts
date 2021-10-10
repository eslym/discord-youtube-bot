import * as config from './config';
import {sequelize as sql} from "./sql";
import {logger} from "./logger";
import {Notification} from "./models/Notification";
import {Subscription} from "./models/Subscription";
import {WebSub} from "./models/WebSub";
import {YoutubeVideo} from "./models/YoutubeVideo";
import {RolePermission} from "./models/RolePermission";
import {MemberPermission} from "./models/MemberPermission";
import {server} from "./express/server";
import {google} from "googleapis";
import {bot, setupCommands} from "./bot";

sql.addModels([
    Notification,
    Subscription,
    WebSub,
    YoutubeVideo,
    RolePermission,
    MemberPermission,
]);

(async () => {
    if (config.get('database.sync')) {
        await sql.sync({alter:true});
        logger.info("DB synced.");
    }
    google.options({auth: config.get('youtube.key')});
    server.listen(config.get('websub.port', config.get('websub.host')), ()=>{
        logger.info('Websub listener ready.');
    });
    await setupCommands();
    logger.info('Command refreshed.')
    await bot.login(config.get('discord.token'));
    logger.info('Discord bot ready.');
})().catch(e => {
    logger.error(e);
    process.exit(1);
});
