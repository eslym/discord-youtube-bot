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
exports.PermissionManager = void 0;
const MemberPermission_1 = require("../models/MemberPermission");
const RolePermission_1 = require("../models/RolePermission");
const sequelize_1 = require("sequelize");
var PermissionManager;
(function (PermissionManager) {
    function hasPermission(member, permission) {
        return __awaiter(this, void 0, void 0, function* () {
            let check = permission.split('.');
            let permissions = yield computePermissions(member);
            for (let perm of permissions) {
                let res = true;
                if (perm.startsWith('!')) {
                    res = false;
                    perm = perm.slice(1);
                }
                let parts = perm.split('.');
                let a, b;
                do {
                    a = parts.shift();
                    b = check.shift();
                    if (a === '*') {
                        return res;
                    }
                    if (a !== b) {
                        break;
                    }
                } while (parts.length > 0 && check.length > 0);
                if (a === b && parts.length + check.length === 0) {
                    return res;
                }
            }
            return false;
        });
    }
    PermissionManager.hasPermission = hasPermission;
    function computePermissions(member) {
        return __awaiter(this, void 0, void 0, function* () {
            let personalPermissions = yield fetchMemberPermission(member);
            let roles = member.roles.cache.map(r => r.id);
            let rolePermissions = yield RolePermission_1.RolePermission.findAll({
                attributes: ['permission'],
                where: {
                    discord_role_id: {
                        [sequelize_1.Op.in]: roles
                    }
                }
            }).map(p => p.permission);
            return personalPermissions.concat(...rolePermissions).sort();
        });
    }
    PermissionManager.computePermissions = computePermissions;
    function fetchMemberPermission(member) {
        return MemberPermission_1.MemberPermission.findAll({
            attributes: ['permission'],
            where: {
                discord_guild_id: member.guild.id,
                discord_member_id: member.id,
            }
        }).then(arr => arr.map(p => p.permission));
    }
    PermissionManager.fetchMemberPermission = fetchMemberPermission;
    function fetchRolePermission(role) {
        return RolePermission_1.RolePermission.findAll({
            attributes: ['permission'],
            where: {
                discord_role_id: role.id
            }
        }).then(arr => arr.map(p => p.permission));
    }
    PermissionManager.fetchRolePermission = fetchRolePermission;
    function detachPersonalPermission(member, permission) {
        return __awaiter(this, void 0, void 0, function* () {
            yield MemberPermission_1.MemberPermission.destroy({
                where: {
                    discord_guild_id: member.guild.id,
                    discord_member_id: member.id,
                    permission
                }
            });
        });
    }
    PermissionManager.detachPersonalPermission = detachPersonalPermission;
    function detachRolePermission(role, permission) {
        return __awaiter(this, void 0, void 0, function* () {
            yield RolePermission_1.RolePermission.destroy({
                where: {
                    discord_role_id: role.id,
                    permission
                }
            });
        });
    }
    PermissionManager.detachRolePermission = detachRolePermission;
    function attachPersonalPermission(member, permission) {
        return __awaiter(this, void 0, void 0, function* () {
            let values = {
                discord_guild_id: member.guild.id,
                discord_member_id: member.id,
                permission
            };
            let perm = yield MemberPermission_1.MemberPermission.count({
                where: values
            });
            if (perm === 0) {
                yield MemberPermission_1.MemberPermission.create(values);
            }
        });
    }
    PermissionManager.attachPersonalPermission = attachPersonalPermission;
    function attachRolePermission(role, permission) {
        return __awaiter(this, void 0, void 0, function* () {
            let values = {
                discord_role_id: role.id,
                permission
            };
            let perm = yield RolePermission_1.RolePermission.count({
                where: values
            });
            if (perm === 0) {
                yield RolePermission_1.RolePermission.create(values);
            }
        });
    }
    PermissionManager.attachRolePermission = attachRolePermission;
})(PermissionManager = exports.PermissionManager || (exports.PermissionManager = {}));

//# sourceMappingURL=PermissionManager.js.map
