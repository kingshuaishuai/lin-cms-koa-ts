import { config, LinValidator, Rule } from '@ysslin/alioth'

export class PositiveIdValidator extends LinValidator {
  id: Rule
  constructor () {
    super()
    this.id = new Rule('isInt', 'id必须为正整数', { min: 1 })
  }
}

export class PaginateValidator extends LinValidator {
  constructor() {
    super()
    this.count = [
      new Rule('isOptional', '', config.getItem('countDefault'), 10),
      new Rule('isInt', 'count必须为正整数', { min: 1 })
    ]
    this.page = [
      new Rule('isOptional', '', config.getItem('pageDefault'), 0),
      new Rule('isInt', 'page必须为整数，且大于等于0', { min: 0 })
    ]
  }

  customParse() {
    if (this.parsed.query['count']) {
      this.parsed.query['count'] = Number.parseInt(this.parsed.query['count'])
    }
    if (this.parsed.query['page']) {
      this.parsed.query['page'] = Number.parseInt(this.parsed.query['page'])
    }
  }
}