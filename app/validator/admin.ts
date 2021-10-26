import { isString } from 'lodash'
import validator from 'validator'
import { LinValidateFnReturn, LinValidator, LinValidatorData, Rule } from '@ysslin/alioth'
import { PaginateValidator, PositiveIdValidator } from './common'

export class AdminUsersValidator extends PaginateValidator {
  constructor() {
    super()
    this.group_id = [
      new Rule('isOptional'),
      new Rule('isInt', '分组id必须为正整数', { min: 1 })
    ]
  }
}

export class ResetPasswordValidator extends PositiveIdValidator {
  constructor() {
    super()
    this.new_password = [
      new Rule('isNotEmpty', '新密码不可为空'),
      new Rule(
        'matches',
        '密码长度必须在6~22位之间，包含字符、数字与特殊字符(_*&$#@)',
        /^[A-Za-z0-9_*&$#@/]{6,22}$/
      )
    ]
    this.confirm_password = new Rule('isNotEmpty', '确认密码不可为空')
  }

  validateConfirmPassword(data: LinValidatorData): LinValidateFnReturn {
    const ok = data.body.new_password === data.body.confirm_password
    return ok ? true : [false, '两次输入的密码不一致，请重新输入']
  }
}

export class UpdateUserInfoValidator extends PositiveIdValidator {
  constructor() {
    super()
  }

  validateGroupIds(data: LinValidatorData): LinValidateFnReturn {
    const ids = data.body.group_ids
    if (!Array.isArray(ids) || ids.length < 1) {
      return [false, '至少选择一个分组']
    }
    for (let id of ids) {
      if (typeof id === 'number') {
        id = String(id)
      }
      if (!validator.isInt(id, { min: 1 })) {
        return [false, '每个id值必须为正整数']
      }
    }
    return true
  }
}

export class NewGroupValidator extends LinValidator {
  constructor() {
    super()
    this.name = new Rule('isNotEmpty', '请输入分组名称')
    this.info = new Rule('isOptional')
  }

  validatePermissionIds(data: LinValidatorData): LinValidateFnReturn {
    const ids = data.body.permission_ids
    if (this.isOptional(ids)) {
      return true
    }
    if (!Array.isArray(ids)) {
      return [false, 'permission_ids必须为正整数数组']
    }
    for (let id of ids) {
      if (typeof id === 'number') {
        id = String(id)
      }
      if (!validator.isInt(id, { min: 1 })) {
        return [false, '每个id值必须为正整数']
      }
    }
    return true
  }
}

export class UpdateGroupValidator extends PositiveIdValidator {
  constructor () {
    super()
    this.name = [
      new Rule('isOptional'),
      new Rule('isNotEmpty', '请输入分组名称'),
      new Rule(isString, '分组名称必须是字符串')
    ]
    this.info = [
      new Rule('isOptional'),
      new Rule(isString, '分组信息必须是字符串')
    ]
  }
}

export class DispatchPermissionValidator extends LinValidator {
  constructor () {
    super()
    this.group_id = [
      new Rule('isNotEmpty', '请输入group_id字段'),
      new Rule('isInt', '分组id必须正整数')
    ]
    this.permission_id = [
      new Rule('isNotEmpty', '请输入permission_id字段'),
      new Rule('isInt', '权限id必须正整数')
    ]
  }
}

export class DispatchPermissionsValidator extends LinValidator {
  constructor () {
    super()
    this.group_id = [
      new Rule('isNotEmpty', '请输入group_id字段'),
      new Rule('isInt', '分组id必须正整数')
    ]
  }

  validatePermissionIds  (data: LinValidatorData): LinValidateFnReturn {
    const ids = data.body.permission_ids
    if (!ids) {
      return [false, '请输入permission_ids字段']
    }
    if (!Array.isArray(ids)) {
      return [false, '每个id值必须为正整数']
    }
    for (let id of ids) {
      if (typeof id === 'number') {
        id = String(id)
      }
      if (!validator.isInt(id, { min: 1 })) {
        return [false, '每个id值必须为正整数']
      }
    }
    return true
  }
}

export class RemovePermissionsValidator extends LinValidator {
  constructor() {
    super()
    this.group_id = [
      new Rule('isNotEmpty', '请输入group_id字段'),
      new Rule('isInt', '分组id必须正整数')
    ]
  }
  validatePermissionIds (data: LinValidatorData): LinValidateFnReturn {
    const ids = data.body.permission_ids
    if (!ids) {
      return [false, '请输入permission_ids字段']
    }
    if (!Array.isArray(ids)) {
      return [false, '每个id值必须为正整数']
    }
    for (let id of ids) {
      if (typeof id === 'number') {
        id = String(id)
      }
      if (!validator.isInt(id, { min: 1 })) {
        return [false, '每个id值必须为正整数']
      }
    }
    return true
  }
}