import { DataTypes, Model } from 'sequelize'
import { Optional } from 'sequelize/types'
import sequelize from '../lib/db'

interface UserGroupAttrs {
  id: number
  user_id: number
  group_id: number
}

type UserGroupCreationAttrs = Optional<UserGroupAttrs, 'id'>

class UserGroup extends Model<UserGroupAttrs, UserGroupCreationAttrs> implements UserGroupAttrs{
  id!: number
  user_id!: number
  group_id!: number

}

UserGroup.init({
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: '用户id'
  },
  group_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: '分组id'
  }
}, {
  sequelize,
  tableName: 'lin_user_group',
  modelName: 'user_group',
  timestamps: false,
  indexes: [
    {
      name: 'user_id_group_id',
      using: 'BTREE',
      fields: ['user_id', 'group_id']
    }
  ]
})

export {
  UserGroup as UserGroupModel
}