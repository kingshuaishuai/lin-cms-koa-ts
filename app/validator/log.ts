import { checkDateFormat, LinValidateFnReturn, LinValidatorData, Rule } from '@ysslin/alioth'
import { PaginateValidator } from './common'

export class LogFindValidator extends PaginateValidator {
  constructor() {
    super()
    this.name = new Rule('isOptional')
  }

  validateStart(data: LinValidatorData): LinValidateFnReturn {
    const start = data.query.start
    if (this.isOptional(start)) {
      return true
    }
    const ok = checkDateFormat(start as string)
    if (ok) {
      return ok
    } else {
      return [false, '请输入正确格式开始时间', 'start']
    }
  }

  validateEnd (data:LinValidatorData):LinValidateFnReturn {
    if (!data.query) {
      return true
    }
    const end = data.query.end
    if (this.isOptional(end)) {
      return true
    }
    const ok = checkDateFormat(end as string)
    if (ok) {
      return ok
    } else {
      return [false, '请输入正确格式结束时间', 'end']
    }
  }
}