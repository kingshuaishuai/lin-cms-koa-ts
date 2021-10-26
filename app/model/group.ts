import { BaseAttrs, ModelCommonConfig } from '@ysslin/alioth'
import { DataTypes, Model, Optional } from 'sequelize'
import sequelize from '../lib/db'
import { GroupLevel } from '../lib/type'

export interface GroupAttrs extends BaseAttrs {
  id: number
  name: string
  level: number
  info?: string
}

type GroupCreationAttrs = Optional<GroupAttrs, 'id' | 'level' >

class Group extends Model<GroupAttrs, GroupCreationAttrs> implements GroupAttrs {
  id!: number
  name!: string
  level!: number
  info?: string
  create_time?: Date | undefined
  update_time?: Date | undefined
  delete_time?: Date | undefined
  
  toJSON() {
    const target = {
      id: this.id,
      name: this.name,
      info: this.info
    }
    return target
  }
}

Group.init({
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING(60),
    allowNull: false,
    comment: '分组名称，例如：搬砖者'
  },
  info: {
    type: DataTypes.STRING(255),
    comment: '分组信息：例如：搬砖的人',
    allowNull: true
  },
  level: {
    type: DataTypes.INTEGER({
      length: 2
    }),
    defaultValue: GroupLevel.USER,
    comment: '分组级别 1：root 2：guest 3：user（root、guest分组只能存在一个)'
  },
}, {
  sequelize,
  tableName: 'lin_group',
  modelName: 'group',
  indexes: [
    {
      name: 'name_del',
      unique: true,
      fields: ['name', 'delete_time']
    }
  ],
  ...ModelCommonConfig.options
})

export {
  Group as GroupModel
}