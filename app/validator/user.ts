import validator from 'validator'
import { LinValidator, Rule, LinValidatorData, LinValidateFnReturn } from '@ysslin/alioth'

export class RegisterValidator extends LinValidator {
  constructor() {
    super()
    this.username = [
      new Rule('isNotEmpty', '用户名不可为空'),
      new Rule('isLength', '用户名长度必须在2~20之间', 2, 20)
    ]
    this.email = [
      new Rule('isOptional'),
      new Rule('isEmail', '电子邮箱不符合规范，请输入正确的邮箱')
    ]
    this.password = [
      new Rule(
        'matches',
        '密码长度必须在6~22位之间，包含字符、数字与特殊字符(_*&$#@) ',
        /^[A-Za-z0-9_*&$#@/]{6,22}$/
      )
    ]
    this.confirm_password = [new Rule('isNotEmpty', '确认密码不可为空')]
  }

  validateConfirmPassword (data: LinValidatorData): LinValidateFnReturn {
    if (!data.body.password || !data.body.confirm_password) {
      return [false, '两次输入的密码不一致，请重新输入']
    }
    const ok = data.body.password === data.body.confirm_password
    if (ok) {
      return ok
    } else {
      return [false, '两次输入的密码不一致，请重新输入']
    }
  }

  validateGroupIds(data:LinValidatorData): LinValidateFnReturn {
    const ids = data.body.group_ids
    if (this.isOptional(ids)) {
      return true
    }
    if (!Array.isArray(ids)) {
      return [false, 'group_ids必须是整数数组']
    }
    for (let id of ids) {
      if (typeof id === 'number') {
        id = String(id)
      }
      if (!validator.isInt(id, { min: 1})) {
        return [false, '每个id值必须为整数']
      }
    }
    return true
  }
}

export class LoginValidator extends LinValidator {
  constructor() {
    super()
    this.username = new Rule('isNotEmpty', '用户名不可为空')
    this.password = new Rule('isNotEmpty', '密码不可为空')
  }
}

export class UpdateInfoValidator extends LinValidator {
  constructor() {
    super()
    this.username = [
      new Rule('isOptional'),
      new Rule('isLength', '用户名长度必须在2~10之间', 2, 24)
    ]
    this.nickname = [
      new Rule('isOptional'),
      new Rule('isLength', '昵称长度必须在2~10之间', 2, 24)
    ]
    this.avatar = [
      new Rule('isOptional'),
      new Rule('isLength', '头像的url长度必须在0~500之间', {
        min: 0,
        max: 500
      })
    ]
    this.email = [
      new Rule('isOptional'),
      new Rule('isEmail', '电子邮箱不符合规范，请输入正确的邮箱')
    ]
  }
}

export class ChangePasswordValidator extends LinValidator {
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
    this.old_password = new Rule('isNotEmpty', '请输入旧密码')
  }

  validateConfirmPassword(data: LinValidatorData): LinValidateFnReturn {
    const ok = data.body.new_password === data.body.confirm_password
    return ok ? true : [false, '两次输入的密码不一致，请重新输入']
  }
}