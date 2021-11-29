"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CommandMap = void 0;
const sequelize_typescript_1 = require("sequelize-typescript");
const sequelize_1 = require("sequelize");
let CommandMap = class CommandMap extends sequelize_typescript_1.Model {
};
__decorate([
    (0, sequelize_typescript_1.Column)({ type: sequelize_1.DataTypes.BIGINT.UNSIGNED, primaryKey: true }),
    __metadata("design:type", Number)
], CommandMap.prototype, "id", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({ type: sequelize_1.DataTypes.BIGINT.UNSIGNED, allowNull: false }),
    __metadata("design:type", Number)
], CommandMap.prototype, "guild_id", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({ type: sequelize_1.DataTypes.STRING, allowNull: false }),
    __metadata("design:type", String)
], CommandMap.prototype, "command_id", void 0);
CommandMap = __decorate([
    (0, sequelize_typescript_1.Table)({ tableName: 'commands', createdAt: 'created_at', updatedAt: 'updated_at' })
], CommandMap);
exports.CommandMap = CommandMap;

//# sourceMappingURL=CommandMap.js.map
