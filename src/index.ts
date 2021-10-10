import * as config from './config';
import {sequelize as sql} from "./sql";
import {logger} from "./logger";
import {Notification} from "./models/Notification";
import {Subscription} from "./models/Subscription";
import {WebSub} from "./models/WebSub";
import {YoutubeVideo} from "./models/YoutubeVideo";
import {RolePermission} from "./models/RolePermission";
import {MemberPermission} from "./models/MemberPermission";

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
        logger.info("DB Synced.");
    }
})().catch(e => logger.error(e));