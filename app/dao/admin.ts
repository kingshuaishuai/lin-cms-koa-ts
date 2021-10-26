import { Context } from 'koa'
import { has, set } from 'lodash'
import { Op, Transaction } from 'sequelize'
import { FindOptions } from 'sequelize'
import { Forbidden, HttpException, NotFound } from '@ysslin/alioth'
import sequelize from '../lib/db'
import { GroupLevel, MountType } from '../lib/type'
import { GroupAttrs, GroupModel } from '../model/group'
import { GroupPermissionModel } from '../model/group-permission'
import { PermissionModel } from '../model/permission'
import { UserAttrs, UserIdentityModel, UserModel } from '../model/user'
import { UserGroupModel } from '../model/user-group'
import { AdminUsersValidator, DispatchPermissionsValidator, DispatchPermissionValidator, NewGroupValidator, RemovePermissionsValidator, ResetPasswordValidator, UpdateGroupValidator, UpdateUserInfoValidator } from '../validator/admin'
import { PaginateValidator, PositiveIdValidator } from '../validator/common'

class AdminDao {
  async getAllPermissions() {
    const permissions = await PermissionModel.findAll({
      where: {
        mount: MountType.MOUNT
      }
    })
    const result: {
      [key: string]: Array<{
        id: number
        name: string
        module: string
      }>
    } = Object.create(null)
    permissions.forEach(p => {
      const item = {
        id: p.id,
        name: p.name,
        module: p.module
      }
      if (has(result, item.module)) {
        result[item.module].push(item)
      } else {
        result[item.module] = [item]
      }
    })

    return result
  }

  async getUsers(v: AdminUsersValidator, ctx: Context) {
    const groupId = v.get('query.group_id')
    const page = v.get('query.page')
    const pageCount = v.get('query.count')
    const users: Array<UserAttrs & { groups: Omit<GroupAttrs, 'level'>[]}> = []
    const userFindOptions: FindOptions<UserAttrs> = {
      offset: page * pageCount,
      limit: pageCount,
      where: {
        username: {
          [Op.ne]: ctx.currentUser!.username
        },
      }
    }

    let userIds: number[] = []

    if (groupId) {
      const userGroups = await UserGroupModel.findAll({
        where: {
          group_id: groupId
        }
      })
      userIds = userGroups.map(ug => ug.user_id)
      if (userIds.length) {
        userFindOptions.where = {
          ...userFindOptions.where,
          id: {
            [Op.in]: userIds
          }
        }
      }
    }

    const { rows, count } = await UserModel.findAndCountAll(userFindOptions)

    for (const u of rows) {
      const user = u.toJSON()
      const userGroup = await UserGroupModel.findAll({
        where: {
          user_id: user.id
        }
      })
      const groupIds = userGroup.map(ug => ug.group_id)
      const groups = await GroupModel.findAll({
        where: {
          id: {
            [Op.in]: groupIds
          }
        }
      })
      users.push({
        ...user,
        groups: groups.map(g => g.toJSON())
      })
    }
    return {
      users,
      total: count
    }
  }

  async changeUserPassword(v: ResetPasswordValidator, ctx: Context) {
    const user = await UserModel.findByPk(v.get('path.id'))
    if (!user) {
      throw new NotFound({
        code: 10021
      })
    }
    // 非root用户不可修改其他管理员的密码
    if (ctx.currentUser?.username !== 'root') {
      const groups = await GroupModel.findAll({
        where: {
          level: GroupLevel.ROOT
        }
      })
      const isAdmin = await UserGroupModel.findOne({
        where: {
          group_id: {
            [Op.in]: groups.map(g => g.id)
          },
          user_id: v.get('path.id')
        }
      })
      if (isAdmin) {
        throw new Forbidden({
          code: 10081
        })
      }
    }
    await UserIdentityModel.resetPassword(user, v.get('body.new_password'))
  }

  async deleteUser(id: number) {
    const user = await UserModel.findByPk(id)
    if (!user) {
      throw new NotFound({
        code: 10021
      })
    }

    const groups = await GroupModel.findAll({
      where: {
        level: GroupLevel.ROOT
      }
    })
    const isAdmin = await UserGroupModel.findOne({
      where: {
        group_id: {
          [Op.in]: groups.map(g => g.id)
        },
        user_id: id
      }
    })
    if (isAdmin) {
      throw new Forbidden({
        code: 10079
      })
    }

    let transaction: Transaction | undefined
    try {
      transaction = await sequelize.transaction()
      await user.destroy({
        transaction
      })
      await UserGroupModel.destroy({
        where: {
          user_id: id
        },
        transaction
      })
      await UserIdentityModel.destroy({
        where: {
          user_id: id
        },
        transaction
      })
      await transaction.commit()
    } catch (err) {
      if (transaction) await transaction.rollback()
    }
  }

  async updateUserInfo(v: UpdateUserInfoValidator) {
    const user = await UserModel.findByPk(v.get('path.id'))
    if (!user) {
      throw new NotFound({
        code: 10021
      })
    }
    const userGroup = await UserGroupModel.findAll({
      where: {
        user_id: user.id
      }
    })
    const groupIds = userGroup.map(v => v.group_id)
    const isAdmin = await GroupModel.findOne({
      where: {
        level: GroupLevel.ROOT,
        id: {
          [Op.in]: groupIds
        }
      }
    })
    if (isAdmin) {
      throw new Forbidden({
        code: 10078
      })
    }
    for (const id of v.get('body.group_ids') || []) {
      const group = await GroupModel.findByPk(id)
      if (group && group.level === GroupLevel.ROOT) {
        throw new Forbidden({
          code: 10073
        })
      }
      if (!group) {
        throw new NotFound({
          code: 10077
        })
      }
    }
    let transaction: Transaction | undefined
    try {
      transaction = await sequelize.transaction()
      await UserGroupModel.destroy({
        where: {
          user_id: v.get('path.id')
        },
        transaction
      })
      for (const gid of v.get('body.group_ids') || []) {
        await UserGroupModel.create({
          user_id: user.id,
          group_id: gid
        }, { transaction })
      }
      await transaction.commit()
    } catch (err) {
      if (err instanceof HttpException) throw err
    }
  }

  async getGroups(v: PaginateValidator) {
    const page = v.get('query.page')
    const pageCount = v.get('query.count')
    const { rows, count } = await GroupModel.findAndCountAll({
      offset: page * pageCount,
      limit: pageCount
    })

    return { groups: rows, total: count }
  }

  async getGroupsAndPermissions (v: PaginateValidator) {
    const page = v.get('query.page')
    const pageCount = v.get('query.count')
    const { rows: groupRows, count } = await GroupModel.findAndCountAll({
      offset: page * pageCount,
      limit: pageCount
    })

    const groups: any[] = []

    for (const g of groupRows) {
      const group = g.toJSON()
      const groupPermissions = await GroupPermissionModel.findAll({
        where: {
          group_id: g.id
        }
      })
      const permissions = await PermissionModel.findAll({
        where: {
          mount: MountType.MOUNT,
          id: {
            [Op.in]: groupPermissions.map(gp => gp.permission_id)
          }
        }
      })
      set(group, 'permissions', permissions)
      groups.push(group)
    }
    return {
      groups,
      total: count
    }
  }
  async getAllGroups() {
    const allGroups = await GroupModel.findAll({
      where: {
        level: {
          [Op.ne]: GroupLevel.ROOT
        }
      }
    })
    return allGroups
  }

  async getGroup(v: PositiveIdValidator) {
    const gid = v.get('path.id')
    const group = await GroupModel.findByPk(gid)
    if (!group) {
      throw new NotFound({
        code: 10024
      })
    }
    const groupPermissions = await GroupPermissionModel.findAll({
      where: {
        group_id: gid
      }
    })
    const permissions = await PermissionModel.findAll({
      where: {
        mount: MountType.MOUNT,
        id: {
          [Op.in]: groupPermissions.map(gp => gp.permission_id)
        }
      }
    })

    const groupData = {
      ...group.toJSON(),
      permissions
    }
    return groupData
  }

  async createGroup(v: NewGroupValidator) {
    const existGroup = await GroupModel.findOne({
      where: {
        name: v.get('body.name')
      }
    })
    if (existGroup) {
      throw new Forbidden({
        code: 10072
      })
    }

    for (const id of v.get('body.permission_ids') || []) {
      const permission = await PermissionModel.findOne({
        where: {
          id,
          mount: MountType.MOUNT
        }
      })
      if (!permission) {
        throw new NotFound({
          code: 10231
        })
      }
    }

    let transaction: Transaction | undefined
    try {
      transaction = await sequelize.transaction()
      const group = await GroupModel.create({
        name: v.get('body.name'),
        info: v.get('body.info')
      }, { transaction })

      for (const id of v.get('body.permission_ids') || []) {
        await GroupPermissionModel.create({
          group_id: group.id,
          permission_id: id
        }, { transaction })
      }
      await transaction.commit()
    } catch (err) {
      if (transaction) await transaction.rollback()
    }
    return true
  }

  async updateGroup(v: UpdateGroupValidator) {
    const group = await GroupModel.findByPk(v.get('path.id'))
    if (!group) {
      throw new NotFound({
        code: 10024
      })
    }
    const nameExist = await GroupModel.findOne({
      where: {
        name: v.get('body.name'),
        [Op.and]: {
          id: {
            [Op.ne]: group.id
          }
        }
      }
    })

    if (nameExist) {
      throw new Forbidden({
        code: 10072
      })
    }
    group.name = v.get('body.name')
    group.info = v.get('body.info')
    await group.save()
  }

  async deleteGroup(v: PositiveIdValidator) {
    const id = v.get('path.id')
    const group = await GroupModel.findByPk(id)

    if (!group) {
      throw new NotFound({
        code: 10024
      })
    }

    if (group.level === GroupLevel.ROOT) {
      throw new Forbidden({
        code: 10074
      })
    } else if (group.level === GroupLevel.GUEST) {
      throw new Forbidden({
        code: 10075
      })
    }
    let transaction: Transaction | undefined
    try {
      transaction = await sequelize.transaction()
      await group.destroy({
        transaction
      })
      await GroupPermissionModel.destroy({
        where: {
          group_id: group.id
        },
        transaction
      })
      await UserGroupModel.destroy({
        where: {
          group_id: group.id
        },
        transaction
      })
      await transaction.commit()
      console.log('删除成功')
    } catch (err) {
      if (transaction) await transaction.rollback()
    }
  }

  async dispatchPermission(v: DispatchPermissionValidator) {
    const group = await GroupModel.findByPk(v.get('body.group_id'))
    if (!group) {
      throw new NotFound({
        code: 10024
      })
    }
    const permission = await PermissionModel.findOne({
      where: {
        id: v.get('body.permission_id'),
        mount: MountType.MOUNT
      }
    })
    if (!permission) {
      throw new NotFound({
        code: 10231
      })
    }
    const groupPermission = await GroupPermissionModel.findOne({
      where: {
        group_id: group.id,
        permission_id: permission.id
      }
    })

    if (groupPermission) {
      throw new Forbidden({
        code: 10230
      })
    }

    await GroupPermissionModel.create({
      group_id: group.id,
      permission_id: permission.id
    })
  }

  async dispatchPermissions(v: DispatchPermissionsValidator) {
    const group = await GroupModel.findByPk(v.get('body.group_id'))
    if (!group) {
      throw new NotFound({
        code: 10024
      })
    }

    for (const id of v.get('body.permission_ids') || []) {
      const permission = await PermissionModel.findOne({
        where: {
          id: id,
          mount: MountType.MOUNT
        }
      })
      if (!permission) {
        throw new NotFound({
          code: 10231
        })
      }
    }
    const groupPermission = await GroupPermissionModel.findOne({
      where: {
        group_id: group.id,
        permission_id: {
          [Op.in]: v.get('permission_ids') || []
        }
      }
    })

    if (groupPermission) {
      throw new Forbidden({
        code: 10230
      })
    }

    let transaction: Transaction | undefined
    try {
      transaction = await sequelize.transaction()
      for (const id of v.get('body.permission_ids') || []) {
        await GroupPermissionModel.create({
          group_id: group.id,
          permission_id: id
        }, { transaction })
      }

      await transaction.commit()
    } catch (err) {
      if (transaction) await transaction.rollback()
    }
  }

  async removePermissions(v: RemovePermissionsValidator) {
    const group = await GroupModel.findByPk(v.get('body.group_id'))
    if (!group) {
      throw new NotFound({
        code: 10024
      })
    }
    for (const id of v.get('body.permission_ids') || []) {
      const permission = await PermissionModel.findOne({
        where: {
          id,
          mount: MountType.MOUNT
        }
      })
      if (!permission) {
        throw new NotFound({
          code: 10231
        })
      }
    }

    await GroupPermissionModel.destroy({
      where: {
        group_id: v.get('body.group_id'),
        permission_id: {
          [Op.in]: v.get('body.permission_ids')
        }
      }
    })
  }
}

export {
  AdminDao
}