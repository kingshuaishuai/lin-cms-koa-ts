import { AuthFailed, HttpException, NotFound, RefreshException, parseHeader, routeMetaInfo, TokenType } from '@ysslin/alioth'
import { Context } from 'koa'
import { UserModel } from '../model/user'
import { UserGroupModel } from '../model/user-group'
import { GroupModel } from '../model/group'
import { GroupLevel, MountType } from '../lib/type'
import { Op } from 'sequelize'
import { Middleware } from '@koa/router'
import { GroupPermissionModel } from '../model/group-permission'
import { PermissionModel } from '../model/permission'

declare module 'koa' {
  interface BaseContext {
    currentUser?: UserModel
  }
}

/**
 * 设置当前user
 * @param ctx 
 */
export async function mountUser(ctx: Context) {
  const parsedResult = parseHeader(ctx)
  let identity = ''
  if (parsedResult && typeof parsedResult !== 'string') {
    identity = parsedResult.identity
  }
  if (!identity) {
    throw new NotFound({ code: 10021 })
  }
  const user = await UserModel.findByPk(identity)
  if (!user) {
    throw new NotFound({ code: 10021 })
  }
  ctx.currentUser = user
}

/**
 * 是否是超级管理员
 * @param ctx 
 * @returns 
 */
export async function isAdmin(ctx: Context) {
  if (!ctx.currentUser) return false
  const userGroup = await UserGroupModel.findAll({
    where: {
      user_id: ctx.currentUser.id
    }
  })
  const groupIds = userGroup.map(ug => ug.group_id)
  const is = await GroupModel.findOne({
    where: {
      level: GroupLevel.ROOT,
      id: {
        [Op.in]: groupIds
      }
    }
  })
  return is
}

/**
 * 守卫函数，非超级管理员不可访问
 * @param ctx 
 * @param next 
 */
export const adminRequired: Middleware = async function(ctx, next) {
  if (ctx.method !== 'OPTIONS') {
    await mountUser(ctx)
    if (await isAdmin(ctx)) {
      await next()
    } else {
      throw new AuthFailed({ code: 10001 })
    }
  } else {
    await next()
  }
}

export const loginRequired: Middleware = async function(ctx, next) {
  if (ctx.request.method !== 'OPTIONS') {
    await mountUser(ctx)
    await next()
  } else {
    await next()
  }
}

/**
 * 守卫函数，用户刷新令牌，统一异常
 */
export const refreshTokenRequiredWithUnifyException: Middleware = async function(ctx, next) {
  if (ctx.request.method !== 'OPTIONS') {
    try {
      const parsedResult = parseHeader(ctx, TokenType.REFRESH)
      let identity = ''
      if (parsedResult && typeof parsedResult !== 'string') {
        identity = parsedResult.identity
      }
      if (!identity) {
        ctx.throw(new NotFound({
          code: 10021
        }))
      }
      const user = await UserModel.findByPk(identity)
      if (!user) {
        ctx.throw(new NotFound({
          code: 10021
        }))
      }
      ctx.currentUser = user!
    } catch (err) {
      if (err instanceof HttpException) {
        throw err
      } else {
        throw new RefreshException()
      }
    }
    await next()
  } else {
    await next()
  }
}

/**
 * 守卫函数，用于权限组鉴权
 */
export const groupRequired: Middleware = async function(ctx, next) {
  if (ctx.request.method !== 'OPTIONS') {
    await mountUser(ctx)
    if (await isAdmin(ctx)) {
      await next()
    } else {
      // ctx.matched是当前匹配到的路由中间件
      if (ctx.matched) {
        const routeName = ctx._matchedRouteName || ctx.routerName
        const endpoint = `${ctx.method} ${routeName}`
        const meta = routeMetaInfo.get(endpoint)
        console.log('当前权限')
        if (!meta) {
          // 当前不存在带权限的路由
          await next()
        }
        const { permission, module } = meta!
        const userGroup = await UserGroupModel.findAll({
          where: {
            user_id: ctx.currentUser!.id
          }
        })
        const groupIds = userGroup.map(g => g.id)
        const groupPermission = await GroupPermissionModel.findAll({
          where: {
            group_id: {
              [Op.in]: groupIds
            }
          }
        })
        const permissionIds = groupPermission.map(gp => gp.permission_id)
        const permissionItem = await PermissionModel.findOne({
          where: {
            name: permission,
            mount: MountType.MOUNT,
            module,
            id: {
              [Op.in]: permissionIds
            }
          }
        })

        if (permissionItem) {
          await next()
        } else {
          throw new AuthFailed({
            code: 10001
          })
        }
      } else {
        throw new AuthFailed({
          code: 10001
        })
      }
    }
  } else {
    await next()
  }
}