import { ModelCommonConfig, BaseAttrs } from '@ysslin/alioth'
import { DataTypes, Model } from 'sequelize'
import { Optional } from 'sequelize/types'
import sequelize from '../lib/db'
import { FileType } from '../lib/type'

export interface FileAttrs extends BaseAttrs {
  id: number
  path: string
  type: string
  name: string
  extension: string
  size: number
  md5: string
}

export type FileCreationAttrs = Optional<FileAttrs, 'id' | 'type' | 'size' | 'extension' | 'md5'>

class FileModel 
  extends Model<FileAttrs, FileCreationAttrs> 
  implements FileAttrs 
{
  id!: number
  path!: string
  type!: string
  name!: string
  extension!: string
  size!: number
  md5!: string
  create_time?: Date | undefined
  update_time?: Date | undefined
  delete_time?: Date | undefined
  
}

FileModel.init({
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  path: {
    type: DataTypes.STRING(500),
    allowNull: false
  },
  type: {
    type: DataTypes.STRING({ length: 10}),
    allowNull: false,
    defaultValue: FileType.LOCAL,
    comment: 'LOCAL 本地，REMOTE 远程',
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: false,
  },
  extension: {
    type: DataTypes.STRING(50)
  },
  size: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  md5: {
    type: DataTypes.STRING(40),
    allowNull: true,
    comment: '图片md5值，防止上传重复图片'
  }
}, {
  sequelize,
  tableName: 'lin_file',
  modelName: 'file',
  indexes: [
    {
      name: 'md5_del',
      unique: true,
      fields: ['md5', 'delete_time']
    }
  ],
  ...ModelCommonConfig.options
})

export {
  FileModel
}