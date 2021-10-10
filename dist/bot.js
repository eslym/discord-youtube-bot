"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.bot = void 0;
const discord_js_1 = require("discord.js");
let intents = new discord_js_1.Intents();
intents.add(discord_js_1.Intents.FLAGS.GUILDS, discord_js_1.Intents.FLAGS.GUILD_MEMBERS, discord_js_1.Intents.FLAGS.GUILD_INTEGRATIONS, discord_js_1.Intents.FLAGS.GUILD_MESSAGES);
exports.bot = new discord_js_1.Client({ intents });

//# sourceMappingURL=bot.js.map
