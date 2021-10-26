import { BaseAttrs, ModelCommonConfig, routeMetaInfo } from '@ysslin/alioth'
import { DataTypes, Model, Op, Optional, Transaction } from 'sequelize'
import sequelize from '../lib/db'
import { MountType } from '../lib/type'
import { GroupPermissionModel } from './group-permission'

interface PermissionAttrs extends BaseAttrs {
  id: number
  name: string
  module: string
  mount: number
}

type PermissionCreationAttrs = Optional<PermissionAttrs, 'id' | 'mount'>

class Permission extends Model<PermissionAttrs, PermissionCreationAttrs> implements PermissionAttrs{
  id!: number
  name!: string
  module!: string
  mount!: number
  create_time?: Date | undefined
  update_time?: Date | undefined
  delete_time?: Date | undefined

  toJSON() {
    const target = {
      id: this.id,
      name: this.name,
      module: this.module
    }
    return target
  }

  static async initPermission() {
    let transaction: Transaction | undefined = undefined
    try {
      transaction = await sequelize.transaction()
      const info = Array.from(routeMetaInfo.values())
      const permissions = await this.findAll()

      // 从数据库的permission查找路由的metaInfo，如果没找到，则创建权限
      for (const { permission: permissionName, module: moduleName } of info) {
        const exist = permissions.find(p => p.name === permissionName && p.module === moduleName)
        if (!exist) {
          await this.create({
            name: permissionName!,
            module: moduleName!
          }, {
            transaction
          })
        }
      }

      const unmountPermissionIds: number[] = []

      // 从当前info中查找数据库中的权限，如果存在，则进行挂载
      for (const permission of permissions) {
        const exist = info.find(
          meta => meta.permission === permission.name && meta.module === permission.module
        )
        if (exist) {
          permission.mount = MountType.MOUNT
        } else {
          permission.mount = MountType.UNMOUNT
          unmountPermissionIds.push(permission.id)
        }
        await permission.save({
          transaction
        })
      }
      
      if (unmountPermissionIds.length) {
        await GroupPermissionModel.destroy({
          where: {
            permission_id: {
              [Op.in]: unmountPermissionIds
            }
          },
          transaction
        })
      }
      await transaction.commit()
    } catch (err) {
      if (transaction) {
        await transaction.rollback()
      }
    }
  }
}

Permission.init({
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING(60),
    allowNull: false,
    comment: '权限名称，例如：访问首页',
  },
  module: {
    type: DataTypes.STRING(60),
    allowNull: false,
    comment: '权限所属模块，例如：人员管理',
  },
  mount: {
    type: DataTypes.BOOLEAN,
    defaultValue: 1,
    comment: '0：关闭 1：开启',
  }
}, {
  sequelize,
  tableName: 'lin_permission',
  modelName: 'permission',
  ...ModelCommonConfig.options
})

export {
  Permission as PermissionModel
}