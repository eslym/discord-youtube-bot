import {GuildMember, Role} from "discord.js";
import {MemberPermission} from "../models/MemberPermission";
import {RolePermission} from "../models/RolePermission";
import {Op} from "sequelize";

export module PermissionManager {
    export async function hasPermission(member: GuildMember, permission: string){
        let check = permission.split('.');
        let permissions = await computePermissions(member);
        for (let perm of permissions) {
            let res = true;
            if(perm.startsWith('!')){
                res = false;
                perm = perm.slice(1);
            }
            let parts = perm.split('.');
            let a, b
            do {
                a = parts.shift();
                b = check.shift();
                if(a === '*'){
                    return res;
                }
                if(a !== b) {
                    break;
                }
            } while (parts.length > 0 && check.length > 0);
            if(a === b && parts.length + check.length === 0){
                return res;
            }
        }
        return false;
    }

    export async function computePermissions(member: GuildMember) {
        let personalPermissions = await fetchMemberPermission(member)
        let roles = member.roles.cache.map(r => r.id);
        let rolePermissions = await RolePermission.findAll({
            attributes: ['permission'],
            where: {
                discord_role_id: {
                    [Op.in]: roles
                }
            }
        }).map(p => p.permission);
        return personalPermissions.concat(...rolePermissions).sort();
    }

    export function fetchMemberPermission(member: GuildMember) {
        return MemberPermission.findAll({
            attributes: ['permission'],
            where: {
                discord_guild_id: member.guild.id,
                discord_member_id: member.id,
            }
        }).then(arr => arr.map(p => p.permission));
    }

    export function fetchRolePermission(role: Role) {
        return RolePermission.findAll({
            attributes: ['permission'],
            where: {
                discord_role_id: role.id
            }
        }).then(arr => arr.map(p => p.permission));
    }

    export async function detachPersonalPermission(member: GuildMember, permission: string) {
        await MemberPermission.destroy({
            where: {
                discord_guild_id: member.guild.id,
                discord_member_id: member.id,
                permission
            }
        });
    }

    export async function detachRolePermission(role: Role, permission: string) {
        await RolePermission.destroy({
            where: {
                discord_role_id: role.id,
                permission
            }
        });
    }

    export async function attachPersonalPermission(member: GuildMember, permission: string) {
        let values = {
            discord_guild_id: member.guild.id,
            discord_member_id: member.id,
            permission
        };
        let perm = await MemberPermission.count({
            where: values
        });
        if(perm === 0){
            await MemberPermission.create(values);
        }
    }

    export async function attachRolePermission(role: Role, permission){
        let values = {
            discord_role_id: role.id,
            permission
        };
        let perm = await RolePermission.count({
            where: values
        });
        if(perm === 0){
            await RolePermission.create(values);
        }
    }
}
