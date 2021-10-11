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
exports.MentionCommand = void 0;
const CommandManager_1 = require("../CommandManager");
const builders_1 = require("@discordjs/builders");
const AddMentionCommand_1 = require("./mention/AddMentionCommand");
const RemoveMentionCommand_1 = require("./mention/RemoveMentionCommand");
const ClearMentionCommand_1 = require("./mention/ClearMentionCommand");
const SubCommands = new CommandManager_1.SubCommandController()
    .addCommand(AddMentionCommand_1.AddMentionCommand)
    .addCommand(RemoveMentionCommand_1.RemoveMentionCommand)
    .addCommand(ClearMentionCommand_1.ClearMentionCommand);
exports.MentionCommand = {
    definition: new builders_1.SlashCommandSubcommandGroupBuilder()
        .setName('mention')
        .setDescription('Modify mentions on a notifications'),
    handle(interaction) {
        return __awaiter(this, void 0, void 0, function* () {
            return SubCommands.handle(interaction);
        });
    }
};
SubCommands.addToParent(exports.MentionCommand);

//# sourceMappingURL=MentionCommand.js.map
