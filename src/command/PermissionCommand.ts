import {Command, CommandManager} from "../manager/CommandManager";
import {ApplicationCommandTypes} from "discord.js/typings/enums";
import {ApplicationCommandPermissionData, CommandInteraction} from "discord.js";
import {YoutubeCommand} from "./YoutubeCommand";
import {embed} from "../utils/embed";

export const PermissionCommand: Command = {
    id: '97792e50-428c-47c5-be48-8407aad98cdb',
    definition: {
        type: ApplicationCommandTypes.CHAT_INPUT,
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
    async handle(interaction: CommandInteraction) {
        let operation = interaction.options.getSubcommandGroup(true);
        let type = interaction.options.getSubcommand(true);
        let target: { id } = type === 'user' ?
            interaction.options.getUser('user') :
            interaction.options.getRole('role');
        let remove = type === 'user' ?
            {
                users: target.id,
            } : {
                roles: target.id,
            }
        let perm: ApplicationCommandPermissionData = {
            id: target.id,
            type: type === 'user' ? 'USER' : 'ROLE',
            permission: operation === 'allow',
        }
        let cmd = await CommandManager.findCommand(interaction.guild, YoutubeCommand.id);
        await cmd.permissions.remove(remove);
        await cmd.permissions.add({
            permissions: [perm]
        });
        await interaction.reply({
            embeds: [embed.info(`Permission ${operation === 'allow' ? 'allowed' : 'denied'} for ${target}`)]
        });
    }
}
