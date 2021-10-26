import { merge } from 'lodash'
import { DataTypes, Model, Optional, ModelStatic } from 'sequelize'
import { BaseAttrs, ModelCommonConfig } from '@ysslin/alioth'
import sequelize from '../lib/db'

export interface LogAttrs extends BaseAttrs {
  id: number
  message: string
  user_id: number
  username: string
  status_code: number
  method: string
  path: string
  permission: string
}

export type LogCreationAttrs = Optional<LogAttrs, 'id'>

class Log extends Model<LogAttrs, LogCreationAttrs> implements LogAttrs {
  id!: number
  message!: string
  user_id!: number
  username!: string
  status_code!: number
  method!: string
  path!: string
  permission!: string
  create_time?: Date
  update_time?: Date
  delete_time?: Date

  toJSON() {
    const target = {
      id: this.id,
      message: this.message,
      time: this.create_time,
      user_id: this.user_id,
      username: this.username,
      status_code: this.status_code,
      method: this.method,
      path: this.path,
      permission: this.permission
    }
    return target
  }
}

Log.init<ModelStatic<Log>, InstanceType<ModelStatic<Log>>>({
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  message: {
    type: DataTypes.STRING({ length: 450 })
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  username: {
    type: DataTypes.STRING(20)
  },
  status_code: {
    type: DataTypes.INTEGER
  },
  method: {
    type: DataTypes.STRING(20)
  },
  path: {
    type: DataTypes.STRING(200)
  },
  permission: {
    type: DataTypes.STRING(100)
  },
}, merge({
  sequelize,
  tableName: 'lin_log',
  modelName: 'log',
}, ModelCommonConfig.options))

export {
  Log as LogModel
}