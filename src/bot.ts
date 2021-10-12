import {
    ApplicationCommand,
    ApplicationCommandPermissionData,
    Client,
    Collection,
    Guild,
    GuildResolvable,
    Intents,
    Snowflake
} from "discord.js";
import {REST} from "@discordjs/rest";
import {Routes} from "discord-api-types/v9";
import {get as config} from "./config";
import {logger} from "./logger";
import {Notification} from "./models/Notification";
import {Op} from "sequelize";
import {YoutubeVideo} from "./models/YoutubeVideo";
import {google, youtube_v3} from "googleapis";
import {CommandManager} from "./commands/CommandManager";
import {YoutubeCommand} from "./commands/YoutubeCommand";
import cron = require('node-cron');
import Schema$VideoSnippet = youtube_v3.Schema$VideoSnippet;
import Dict = NodeJS.Dict;
import Schema$Video = youtube_v3.Schema$Video;
import moment = require("moment");

let intents = new Intents();

intents.add(
    Intents.FLAGS.GUILDS,
    Intents.FLAGS.GUILD_MEMBERS,
    Intents.FLAGS.GUILD_INTEGRATIONS,
    Intents.FLAGS.GUILD_MESSAGES,
    Intents.FLAGS.DIRECT_MESSAGES,
)

export const bot = new Client({intents});

let client = new REST({version: '9'});
client.setToken(config('discord.token'));

CommandManager.addCommand(YoutubeCommand);

export async function setupCommands() {
    const appId = config('discord.appId')
    let route = Routes.applicationCommands(appId);
    await client.put(route, {
        body: CommandManager.getDefinitions()
    });
}

async function setGuildCommandPermissions(guild: Guild, cmds: Collection<Snowflake, ApplicationCommand<{ guild: GuildResolvable }>>) {
    if (!guild.commands) return;
    for (let command of cmds.values()) {
        let permissions: ApplicationCommandPermissionData[] = [
            {
                id: guild.ownerId,
                type: 'USER',
                permission: true,
            }
        ];
        await command.permissions.add({
            guild, permissions
        }).catch(_ => logger.warn(`Failed to set permissions for /${command.name} on ${guild.name}`));
    }
}

async function liveCheck(){
    let videos = await YoutubeVideo.findAll({
        include: [Notification],
        where: {
            live_at: {[Op.not]: null},
            deleted_at: null,
            '$notifications.notified_at$': null,
        }
    });
    if(videos.length === 0) return;
    let res = await google.youtube('v3').videos.list({
        part: ['liveStreamingDetails', 'snippet', 'id'],
        id: videos.map(v=>v.video_id),
        maxResults: videos.length,
    });
    let map: Dict<Schema$Video> = {};
    res.data.items.forEach(v => {
        map[v.id] = v;
    });
    for (let video of videos){
        let details = map[video.video_id].liveStreamingDetails;
        if(details.actualStartTime){
            await Notification.update({
                notified_at: new Date(),
            },{
                where: {
                    video_id: video.video_id,
                    notified_at: null,
                }
            });
            continue;
        }
        if(!details.scheduledStartTime){
            await Notification.destroy({
                where: {
                    video_id: video.video_id,
                    notified_at: null,
                }
            });
            video.live_at = null;
            video.save();
            continue;
        }
        let live = moment(details.scheduledStartTime);
        if(!moment(video.live_at).isSame(live)) {
            video.live_at = live.toDate();
            video.save();
            let notifications = await Notification.findAll({
                where: {
                    video_id: video.video_id,
                    notified_at: null,
                }
            });
            let url = new URL('https://www.youtube.com/watch');
            url.searchParams.set('v', video.video_id);
            let schedule = live.subtract({minute: 5}).startOf('minute').toDate();
            for (let notification of notifications) {
                notification.scheduled_at = schedule;
                notification.notified_at = null;
                await notification.save();
                let sub = await notification.$get('subscription');
                await sub.notifyReschedule(url.toString(), map[video.video_id].snippet.channelTitle, video.live_at);
            }
        }
    }
}

async function pushLiveNotifications(){
    let notifications = await Notification.findAll({
        where: {
            notified_at: null,
            scheduled_at: {
                [Op.lte]: new Date()
            }
        }
    });
    if(notifications.length === 0){
        return;
    }
    let videos = await YoutubeVideo.findAll({
        attributes: ['video_id'],
        where: {
            video_id: {
                [Op.in]: notifications.map(n => n.video_id)
            }
        }
    });
    if(videos.length === 0) return;
    let res = await google.youtube('v3').videos.list({
        part: ['snippet', 'id'],
        id: videos.map(v=>v.video_id),
        maxResults: videos.length,
    });
    let videoData: Dict<Schema$VideoSnippet> = {};
    for (let item of res.data.items){
        videoData[item.id] = item.snippet;
    }
    for (let notification of notifications) {
        let snippet = videoData[notification.video_id];
        let url = new URL('https://www.youtube.com/watch');
        url.searchParams.set('v', notification.video_id);
        let sub = await notification.$get('subscription');
        await sub.notifyStarting(url.toString(), snippet.channelTitle);
        notification.notified_at = new Date();
        notification.save();
    }
}

bot.on('ready', () => {
    (async () => {
        let guilds = await bot.guilds.fetch();
        let cmds = await bot.application.commands.fetch();
        for (let g of guilds.values()) {
            let guild = await g.fetch();
            await setGuildCommandPermissions(guild, cmds);
        }
        bot.on('guildCreate', (guild) => {
            (async () => {
                guild = await guild.fetch();
                await setGuildCommandPermissions(guild, cmds);
            })().catch((error) => {
                logger.error(error);
            });
        });
    })().catch(logger.error);
    cron.schedule('* * * * *', ()=>{
        liveCheck()
            .catch(logger.error)
            .finally(
                ()=>pushLiveNotifications().catch(logger.error)
            );
    });
});

bot.on('interactionCreate', (interaction) => {
    if (interaction.isCommand()) {
        CommandManager.handle(interaction).catch(logger.error);
    }
});
