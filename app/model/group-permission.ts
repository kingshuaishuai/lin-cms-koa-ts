import { DataTypes, Model } from 'sequelize'
import { Optional } from 'sequelize'
import sequelize from '../lib/db'

interface GroupPermissionAttrs {
  id: number
  group_id: number
  permission_id: number
}

type GroupPermissionCreationAttrs = Optional<GroupPermissionAttrs, 'id'>

class GroupPermission 
  extends Model<GroupPermissionAttrs, GroupPermissionCreationAttrs> 
  implements GroupPermissionAttrs 
{
  id!: number
  group_id!: number
  permission_id!: number

}

GroupPermission.init({
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  group_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: '分组id'
  },
  permission_id: {
    type: DataTypes.INTEGER,
    comment: '权限id'
  }
}, {
  sequelize,
  tableName: 'lin_group_permission',
  modelName: 'group_permission',
  timestamps: false,
  indexes: [
    {
      name: 'group_id_permission_id',
      using: 'BTREE',
      fields: ['group_id', 'permission_id']
    }
  ]
})

export {
  GroupPermission as GroupPermissionModel
}