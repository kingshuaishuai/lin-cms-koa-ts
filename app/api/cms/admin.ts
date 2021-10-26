import { Failed, LinRouter, NotFound } from '@ysslin/alioth'
import { AdminDao } from '../../dao/admin'
import { adminRequired } from '../../middleware/jwt'
import { AdminUsersValidator, DispatchPermissionsValidator, DispatchPermissionValidator, NewGroupValidator, RemovePermissionsValidator, ResetPasswordValidator, UpdateGroupValidator, UpdateUserInfoValidator } from '../../validator/admin'
import { PaginateValidator, PositiveIdValidator } from '../../validator/common'


const admin = new LinRouter({
  prefix: '/cms/admin',
  module: '管理员',
  // 管理员权限不支持分配
  mountPermission: false
})

const adminDao = new AdminDao()

admin.linGet(
  'getAllPermissions',
  '/permission',
  admin.permission('查看所有可分配的权限'),
  adminRequired,
  async (ctx) => {
    const permissions = await adminDao.getAllPermissions()
    ctx.json(permissions)
  }
)

admin.linGet(
  'getAdminUsers',
  '/users',
  admin.permission('查询所有用户'),
  adminRequired,
  async (ctx) => {
    const v = await new AdminUsersValidator().validate(ctx)
    const { users, total } = await adminDao.getUsers(v, ctx)
    ctx.json({
      items: users,
      total,
      page: v.get('query.page'),
      count: v.get('query.count')
    })
  }
)

admin.linPut(
  'ChangeUserPassword',
  '/user/:id/password',
  admin.permission('修改用户密码'),
  adminRequired,
  async (ctx) => {
    const v = await new ResetPasswordValidator().validate(ctx)
    await adminDao.changeUserPassword(v, ctx)
    ctx.success({
      code: 4
    })
  }
)

admin.linDelete(
  'deleteUser',
  '/user/:id',
  admin.permission('删除用户'),
  adminRequired,
  async (ctx) => {
    const v = await new PositiveIdValidator().validate(ctx)
    const id = v.get('path.id')
    await adminDao.deleteUser(id)
    ctx.success({
      code: 5
    })
  }
)

admin.linPut(
  'updateUser',
  '/user/:id',
  admin.permission('更新用户信息'),
  adminRequired,
  async (ctx) => {
    const v = await new UpdateUserInfoValidator().validate(ctx)
    await adminDao.updateUserInfo(v)
    ctx.success({
      code: 6
    })
  }
)

admin.linGet(
  'getAdminGroups',
  '/group',
  admin.permission('查询所有权限组及其权限'),
  adminRequired,
  async (ctx) => {
    const v = await new PaginateValidator().validate(ctx)
    const { groups, total } = await adminDao.getGroupsAndPermissions(v)
    if (groups.length < 1) {
      throw new NotFound({
        code: 10024
      })
    }
    ctx.json({
      items: groups,
      total: total,
      page: v.get('query.page'),
      count: v.get('query.count')
    })
  }
)

admin.linGet(
  'getAllGroup',
  '/group/all',
  admin.permission('查询所有权限组'),
  adminRequired,
  async (ctx) => {
    const groups = await adminDao.getAllGroups()
    if (!groups || groups.length < 1) {
      throw new NotFound({
        code: 10024
      })
    }
    ctx.json(groups)
  }
)

admin.linGet(
  'getGroup',
  '/group/:id',
  admin.permission('查询一个权限组及其权限'),
  adminRequired,
  async (ctx) => {
    const v = await new PositiveIdValidator().validate(ctx)
    const group = await adminDao.getGroup(v)
    ctx.json(group)
  }
)

admin.linPost(
  'createGroup',
  '/group',
  admin.permission('新建权限组'),
  adminRequired,
  async (ctx) => {
    const v = await new NewGroupValidator().validate(ctx)
    const ok = await adminDao.createGroup(v)
    if (!ok) {
      throw new Failed({
        code: 10027
      })
    }
    ctx.success({
      code: 15
    })
  }
)

admin.linPut(
  'updateGroup',
  '/group/:id',
  admin.permission('更新一个权限组'),
  adminRequired,
  async (ctx) => {
    const v = await new UpdateGroupValidator().validate(ctx)
    await adminDao.updateGroup(v)
    ctx.success({
      code: 7
    })
  }
)

admin.linDelete(
  'deleteGroup',
  '/group/:id',
  admin.permission('删除一个权限组'),
  adminRequired,
  async (ctx) => {
    const v = await new PositiveIdValidator().validate(ctx)
    await adminDao.deleteGroup(v)
    ctx.success({
      code: 8
    })
  }
)

admin.linPost(
  'dispatchPermission',
  '/permission/dispatch',
  admin.permission('分配单个权限'),
  adminRequired,
  async (ctx) => {
    const v = await new DispatchPermissionValidator().validate(ctx)
    await adminDao.dispatchPermission(v)
    ctx.success({
      code: 9
    })
  }
)

admin.linPost(
  'dispatchPermissions',
  '/permission/dispatch/batch',
  admin.permission('分配多个权限'),
  adminRequired,
  async (ctx) => {
    const v = await new DispatchPermissionsValidator().validate(ctx)
    await adminDao.dispatchPermissions(v)
    ctx.success({
      code: 9
    })
  }
)

admin.linPost(
  'removePermissions',
  '/permission/remove',
  admin.permission('删除多个权限'),
  adminRequired,
  async (ctx) => {
    const v = await new RemovePermissionsValidator().validate(ctx)
    await adminDao.removePermissions(v)
    ctx.success({
      code: 10
    })
  }
)
export {
  admin
}