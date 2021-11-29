import {Column, Model, Table} from "sequelize-typescript";
import {DataTypes} from "sequelize";
import {ApplicationCommandPermissionData} from "discord.js";

@Table({tableName: 'commands', createdAt: 'created_at', updatedAt: 'updated_at'})
export class CommandMap extends Model<CommandMap> {

    @Column({type: DataTypes.BIGINT.UNSIGNED, primaryKey: true})
    public id: number;

    @Column({type: DataTypes.BIGINT.UNSIGNED, allowNull: false})
    public guild_id: number;

    @Column({type: DataTypes.STRING, allowNull: false})
    public command_id: string;
}