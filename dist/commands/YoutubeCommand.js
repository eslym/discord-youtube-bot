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
exports.YoutubeCommand = void 0;
const CommandManager_1 = require("./CommandManager");
const SearchCommand_1 = require("./yt/SearchCommand");
const SubscribeCommand_1 = require("./yt/SubscribeCommand");
const UnsubscribeCommand_1 = require("./yt/UnsubscribeCommand");
const ListSubscriptionsCommand_1 = require("./yt/ListSubscriptionsCommand");
const builders_1 = require("@discordjs/builders");
const SubCommands = new CommandManager_1.SubCommandController()
    .addCommand(SearchCommand_1.SearchCommand)
    .addCommand(SubscribeCommand_1.SubscribeCommand)
    .addCommand(UnsubscribeCommand_1.UnsubscribeCommand)
    .addCommand(ListSubscriptionsCommand_1.ListSubscriptionsCommand);
exports.YoutubeCommand = {
    definition: new builders_1.SlashCommandBuilder()
        .setDefaultPermission(false)
        .setName('yt')
        .setDescription('Youtube notification services'),
    handle(interaction) {
        return __awaiter(this, void 0, void 0, function* () {
            return SubCommands.handle(interaction);
        });
    }
};
SubCommands.addToParent(exports.YoutubeCommand);

//# sourceMappingURL=YoutubeCommand.js.map
