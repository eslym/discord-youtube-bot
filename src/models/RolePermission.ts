import {Column, Model, Table} from "sequelize-typescript";
import {DataTypes} from "sequelize";

@Table({tableName: 'role_permissions', createdAt: 'created_at', updatedAt: 'updated_at'})
export class RolePermission extends Model<RolePermission>{
    @Column({type: DataTypes.BIGINT.UNSIGNED, primaryKey: true})
    public id: number;

    @Column({type: DataTypes.BIGINT.UNSIGNED, allowNull: false, unique: 'role_permissions_index'})
    public discord_role_id: number;

    @Column({type: DataTypes.STRING, allowNull: false, unique: 'role_permissions_index'})
    public permission: string;

    @Column({type: DataTypes.DATE, allowNull: true})
    public created_at: Date;

    @Column({type: DataTypes.DATE, allowNull: true})
    public updated_at: Date;
}
