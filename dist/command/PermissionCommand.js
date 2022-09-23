"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PermissionCommand = void 0;
const CommandManager_1 = require("../manager/CommandManager");
const YoutubeCommand_1 = require("./YoutubeCommand");
const embed_1 = require("../utils/embed");
exports.PermissionCommand = {
    id: '97792e50-428c-47c5-be48-8407aad98cdb',
    definition: {
        type: 1 /* ApplicationCommandTypes.CHAT_INPUT */,
        name: 'perm',
        description: 'Manage permission for youtube command.',
        defaultPermission: false,
        options: [
            {
                name: 'allow',
                type: "SUB_COMMAND_GROUP",
                description: 'Allow a role or user to use youtube command.',
                options: [
                    {
                        name: 'role',
                        type: 'SUB_COMMAND',
                        description: 'Allow a role to use youtube command.',
                        options: [
                            {
                                name: 'role',
                                type: 'ROLE',
                                description: 'Role to allow to use youtube command.',
                                required: true,
                            }
                        ]
                    },
                    {
                        name: 'user',
                        type: 'SUB_COMMAND',
                        description: 'Allow a user to use youtube command.',
                        options: [
                            {
                                name: 'user',
                                type: 'USER',
                                description: 'User to allow to use youtube command.',
                                required: true,
                            }
                        ]
                    }
                ]
            },
            {
                name: 'deny',
                type: "SUB_COMMAND_GROUP",
                description: 'Allow a role or user to use youtube command.',
                options: [
                    {
                        name: 'role',
                        type: 'SUB_COMMAND',
                        description: 'Deny a role to use youtube command.',
                        options: [
                            {
                                name: 'role',
                                type: 'ROLE',
                                description: 'Role to deny to use youtube command.',
                                required: true,
                            }
                        ]
                    },
                    {
                        name: 'user',
                        type: 'SUB_COMMAND',
                        description: 'Deny a user to use youtube command.',
                        options: [
                            {
                                name: 'user',
                                type: 'USER',
                                description: 'User to deny to use youtube command.',
                                required: true,
                            }
                        ]
                    }
                ]
            }
        ]
    },
    async handle(interaction) {
        let operation = interaction.options.getSubcommandGroup(true);
        let type = interaction.options.getSubcommand(true);
        let target = type === 'user' ?
            interaction.options.getUser('user') :
            interaction.options.getRole('role');
        let remove = type === 'user' ?
            {
                users: target.id,
            } : {
            roles: target.id,
        };
        let perm = {
            id: target.id,
            type: type === 'user' ? 'USER' : 'ROLE',
            permission: operation === 'allow',
        };
        let cmd = await CommandManager_1.CommandManager.findCommand(interaction.guild, YoutubeCommand_1.YoutubeCommand.id);
        await cmd.permissions.remove(remove);
        await cmd.permissions.add({
            permissions: [perm]
        });
        await interaction.reply({
            embeds: [embed_1.embed.info(`Permission ${operation === 'allow' ? 'allowed' : 'denied'} for ${target}`)],
            ephemeral: true,
        });
    }
};

//# sourceMappingURL=PermissionCommand.js.map
