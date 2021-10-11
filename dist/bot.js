"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupCommands = exports.bot = void 0;
const discord_js_1 = require("discord.js");
const rest_1 = require("@discordjs/rest");
const v9_1 = require("discord-api-types/v9");
const config_1 = require("./config");
const builders_1 = require("@discordjs/builders");
const SearchCommand_1 = require("./commands/SearchCommand");
const logger_1 = require("./logger");
const SubscribeCommand_1 = require("./commands/SubscribeCommand");
const UnsubscribeCommand_1 = require("./commands/UnsubscribeCommand");
const Notification_1 = require("./models/Notification");
const sequelize_1 = require("sequelize");
const YoutubeVideo_1 = require("./models/YoutubeVideo");
const googleapis_1 = require("googleapis");
const cron = require("node-cron");
const SubscriptionsCommand_1 = require("./commands/SubscriptionsCommand");
let intents = new discord_js_1.Intents();
intents.add(discord_js_1.Intents.FLAGS.GUILDS, discord_js_1.Intents.FLAGS.GUILD_MEMBERS, discord_js_1.Intents.FLAGS.GUILD_INTEGRATIONS, discord_js_1.Intents.FLAGS.GUILD_MESSAGES, discord_js_1.Intents.FLAGS.DIRECT_MESSAGES);
exports.bot = new discord_js_1.Client({ intents });
let client = new rest_1.REST({ version: '9' });
client.setToken((0, config_1.get)('discord.token'));
let commands = {
    'search': SearchCommand_1.SearchCommand,
    'sub': SubscribeCommand_1.SubscribeCommand,
    'remove': UnsubscribeCommand_1.UnsubscribeCommand,
    'ls': SubscriptionsCommand_1.SubscriptionsCommand,
};
function setupCommands() {
    return __awaiter(this, void 0, void 0, function* () {
        const appId = (0, config_1.get)('discord.appId');
        let route = v9_1.Routes.applicationCommands(appId);
        let command = new builders_1.SlashCommandBuilder()
            .setDefaultPermission(false)
            .setName('yt')
            .setDescription('Youtube notification services');
        Object.values(commands).forEach(c => {
            command.addSubcommand(c.definition);
        });
        yield client.put(route, {
            body: [command.toJSON()]
        });
    });
}
exports.setupCommands = setupCommands;
function setGuildCommandPermissions(guild, cmds) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!guild.commands)
            return;
        for (let command of cmds.values()) {
            let permissions = [
                {
                    id: guild.ownerId,
                    type: 'USER',
                    permission: true,
                }
            ];
            yield command.permissions.add({
                guild, permissions
            }).catch(_ => logger_1.logger.warn(`Failed to set permissions for /${command.name} on ${guild.name}`));
        }
    });
}
exports.bot.on('ready', () => {
    (() => __awaiter(void 0, void 0, void 0, function* () {
        let guilds = yield exports.bot.guilds.fetch();
        let cmds = yield exports.bot.application.commands.fetch();
        for (let g of guilds.values()) {
            let guild = yield g.fetch();
            yield setGuildCommandPermissions(guild, cmds);
        }
        exports.bot.on('guildCreate', (guild) => {
            (() => __awaiter(void 0, void 0, void 0, function* () {
                guild = yield guild.fetch();
                yield setGuildCommandPermissions(guild, cmds);
            }))().catch((error) => {
                logger_1.logger.error(error);
            });
        });
    }))().catch(logger_1.logger.error);
    cron.schedule('* * * * *', () => {
        (() => __awaiter(void 0, void 0, void 0, function* () {
            let notifications = yield Notification_1.Notification.findAll({
                where: {
                    notified_at: null,
                    scheduled_at: {
                        [sequelize_1.Op.lte]: new Date()
                    }
                }
            });
            if (notifications.length === 0) {
                return;
            }
            let videos = yield YoutubeVideo_1.YoutubeVideo.findAll({
                attributes: ['video_id'],
                where: {
                    video_id: {
                        [sequelize_1.Op.in]: notifications.map(n => n.video_id)
                    }
                }
            });
            let res = yield googleapis_1.google.youtube('v3').videos.list({
                part: ['snippet', 'id'],
                id: videos.map(v => v.id),
                maxResults: videos.length,
            });
            let videoData = {};
            for (let item of res.data.items) {
                videoData[item.id] = item.snippet;
            }
            for (let notification of notifications) {
                let snippet = videoData[notification.video_id];
                let url = new URL('https://www.youtube.com/watch');
                url.searchParams.set('v', notification.video_id);
                let sub = yield notification.$get('subscription');
                yield sub.notifyStarting(url.toString(), snippet.channelTitle);
                notification.notified_at = new Date();
                notification.save();
            }
        }))().catch((error) => {
            logger_1.logger.error(error);
        });
    });
});
exports.bot.on('interactionCreate', (interaction) => {
    if (interaction.isCommand() && interaction.commandName === 'yt') {
        let cmd = interaction.options.getSubcommand(true);
        logger_1.logger.info(`${interaction.user.tag}:${interaction.user.id} run command "/${interaction.commandName} ${cmd}"`);
        commands[cmd].handle(interaction).catch(logger_1.logger.error);
    }
});

//# sourceMappingURL=bot.js.map
