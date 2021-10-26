import { MountType } from './../lib/type'
import { RouterContext } from '@koa/router'
import { has, set, uniq } from 'lodash'
import { Op } from 'sequelize'
import { Transaction } from 'sequelize/types'
import { Forbidden, generatePassword, RepeatException, PlainObject } from '@ysslin/alioth'
import sequelize from '../lib/db'
import { GroupLevel, IdentityType } from '../lib/type'
import { GroupModel } from '../model/group'
import { GroupPermissionModel } from '../model/group-permission'
import { PermissionModel } from '../model/permission'
import { UserCreationAttrs, UserIdentityModel, UserModel } from '../model/user'
import { UserGroupModel } from '../model/user-group'
import { RegisterValidator, UpdateInfoValidator } from '../validator/user'

export class UserDao {
  async createUser(v: RegisterValidator) {
    // 1. 通过用户名查找用户，如果存在则报错重复
    let user = await UserModel.findOne({
      where: {
        username: v.get('body.username')
      }
    })
    if (user) {
      throw new RepeatException({
        code: 10071
      })
    }
    // 2. 通过email查找用户，如果存在则报错
    if (v.get('body.email') && v.get('body.email').trim() !== '') {
      user = await UserModel.findOne({
        where: {
          email: v.get('body.email')
        }
      })
      if (user) {
        throw new RepeatException({
          code: 10076
        })
      }
    }

    // 3. 通过用户组过滤，如果传入用户组id，但用户组不存在，则报错，如果向root组添加用户，也报错
    for (const id of v.get('body.group_ids') || []) {
      const group = await GroupModel.findByPk(id)
      if (!group) {
        throw new Forbidden({ code: 10023 })
      }
      if (group.level === GroupLevel.ROOT) {
        throw new Forbidden({ code: 10073 })
      }
    }

    // 4. 条件都满足，正常添加用户
    await this.registerUser(v)
  }

  async registerUser(v: RegisterValidator) {
    let transaction: Transaction | undefined

    try {
      // 1. 开启事务
      transaction = await sequelize.transaction()
      // 2. 获取参数，创建用户
      const user: UserCreationAttrs = {
        username: v.get('body.username')
      }
      if (v.get('body.email') && v.get('body.email').trim() !== '') {
        user.email = v.get('body.email')
      }
      const { id: user_id } = await UserModel.create(user, {
        transaction
      })
      // 3. 创建用户身份凭证
      await UserIdentityModel.create({
        user_id,
        identity_type: IdentityType.Password,
        identifier: user.username,
        credential: generatePassword(v.get('body.password'))
      }, {
        transaction
      })
      // 4. 用户加入到用户组, 创建user_group数据
      const groupIds = v.get('body.group_ids')
      if (groupIds && groupIds.length !== 0) {
        for (const group_id of groupIds as number[]) {
          await UserGroupModel.create({
            user_id,
            group_id
          }, { transaction })
        }
      } else {
        // 如果没有添加分组，则加入游客组
        // a. 查找到游客组
        let guestGroup = await GroupModel.findOne({
          where: {
            level: GroupLevel.GUEST
          }
        })
        if (!guestGroup) {
          guestGroup = await GroupModel.create({
            name: 'guest',
            level: GroupLevel.GUEST,
            info: '游客组'
          }, { transaction })
        }
        // b. 将用户添加到游客组
        await UserGroupModel.create({
          user_id,
          group_id: guestGroup!.id
        }, {
          transaction
        })
      }
      await transaction.commit()
    } catch (err) {
      if (transaction) {
        await transaction.rollback()
      }
    }
    return true
  }

  async updateUser(ctx: RouterContext,v: UpdateInfoValidator) {
    const user = ctx.currentUser!
    if (v.get('body.username') && v.get('body.username') !== user.username) {
      const exist = await UserModel.findOne({
        where: {
          username: v.get('body.username')
        }
      })
      if (exist) {
        throw new RepeatException({
          code: 10071
        })
      }
      user.username = v.get('body.username')
    }

    if (v.get('body.email') && v.get('body.email') !== user.username) {
      const exist = await UserModel.findOne({
        where: {
          email: v.get('body.email')
        }
      })
      if (exist) {
        throw new RepeatException({
          code: 10076
        })
      }
      user.email = v.get('body.email')
    }

    if (v.get('body.nickname')) {
      user.nickname = v.get('body.nickname')
    }

    if (v.get('body.avatar')) {
      user.avatar = v.get('body.avatar')
    }

    await user.save()
  }

  async getPermissions(ctx: RouterContext) {
    const user = ctx.currentUser!.toJSON()
    const userGroup = await UserGroupModel.findAll({
      where: {
        user_id: user.id
      }
    })
    const groupIds = userGroup.map(ug => ug.group_id)
    const root = await GroupModel.findOne({
      where: {
        level: GroupLevel.ROOT,
        id: {
          [Op.in]: groupIds
        }
      }
    })

    set(user, 'admin', !!root)

    let permissions: PermissionModel[] = []

    if (root) {
      permissions = await PermissionModel.findAll({
        where: {
          mount: MountType.MOUNT
        }
      })
    } else {
      const groupPermissions = await GroupPermissionModel.findAll({
        where: {
          group_id: {
            [Op.in]: groupIds
          }
        }
      })
      const permissionIds = uniq(groupPermissions.map(gp => gp.permission_id))
      permissions = await PermissionModel.findAll({
        where: {
          id: {
            [Op.in]: permissionIds
          },
          mount: MountType.MOUNT
        }
      })
    }

    set(user, 'permissions', this.formatPermissions(permissions))
    return user
    
  }

  formatPermissions(permissions: PermissionModel[]) {
    const map: PlainObject = {}

    permissions.forEach(p => {
      const { module } = p

      if (has(map, module)) {
        map[module].push({
          permission: p.name,
          module
        })
      } else {
        set(map, module, [{
          permission: p.name,
          module
        }])
      }
    })
    return Object.keys(map).map(k => {
      const tmp = Object.create(null)
      set(tmp, k, map[k])
      return tmp
    })
  }

  async getInformation(ctx: RouterContext) {
    const user = ctx.currentUser!.toJSON()
    const userGroups = await UserGroupModel.findAll({
      where: {
        user_id: user.id
      }
    })
    const groupIds = userGroups.map(ug => ug.group_id)
    const groups = await GroupModel.findAll({
      where: {
        id: {
          [Op.in]: groupIds
        }
      }
    })
    set(user, 'groups', groups)
    return user
  }

}