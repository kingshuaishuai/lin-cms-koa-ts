import { Op } from 'sequelize'
import { WhereOptions } from 'sequelize/types'
import sequelize from '../lib/db'
import { LogAttrs, LogModel } from '../model/log'
import { PaginateValidator } from '../validator/common'
import { LogFindValidator } from '../validator/log'

export class LogDao {
  async getLogs(v: LogFindValidator) {
    const start = v.get('query.page')
    const pageCount = v.get('query.count')
    const condition: WhereOptions<LogAttrs> = {}
    v.get('query.name') && (condition.username = v.get('query.name'))
    v.get('query.start') && v.get('query.end') && (condition.create_time = {
      [Op.between]: [v.get('query.start'), v.get('query.end')]
    })
    const { rows, count } = await LogModel.findAndCountAll({
      where: {
        ...condition
      },
      offset: start * pageCount,
      limit: pageCount,
      order: [['create_time', 'DESC']]
    })
    return {
      rows,
      total: count
    }
  }

  async searchLogs(v: LogFindValidator, keyword: string) {
    const start = v.get('query.page')
    const pageCount = v.get('query.count')
    const condition: WhereOptions<LogAttrs> = {}
    v.get('query.name') && (condition.username = v.get('query.name'))
    v.get('query.start') && v.get('query.end') && (condition.create_time = {
      [Op.between]: [v.get('query.start'),v.get('query.end')]
    })
    const { rows, count } = await LogModel.findAndCountAll({
      where: {
        ...condition,
        message: {
          [Op.like]: `%${keyword}%`
        },
      },
      offset: start * pageCount,
      limit: pageCount,
      order: [['create_time', 'DESC']]
    })
    return {
      rows,
      total: count
    }
  }

  async getUserNames(v: PaginateValidator) {
    const start = Number.parseInt(v.get('query.page'))
    const count = Number.parseInt(v.get('query.count'))
    const logs = await sequelize.query(
      'SELECT lin_log.username AS names FROM lin_log GROUP BY lin_log.username HAVING COUNT(lin_log.username) > 0 LIMIT :count OFFSET :start', {
        replacements: {
          start: start * count,
          count: count
        }
      }
    )
    console.log('查询结果', logs)
    const arr = Array.from(logs[0].map((it: any) => it.names))
    return arr
  }
}