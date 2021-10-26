import { LinRouter, NotFound } from '@ysslin/alioth'
import { LogDao } from '../../dao/log'
import { groupRequired } from '../../middleware/jwt'
import { PaginateValidator } from '../../validator/common'
import { LogFindValidator } from '../../validator/log'

const log = new LinRouter({
  prefix: '/cms/log',
  module: '日志'
})

const logDao = new LogDao()

log.linGet(
  'getLogs',
  '/',
  log.permission('查询所有日志'),
  groupRequired,
  async (ctx) => {
    const v = await new LogFindValidator().validate(ctx)
    const { rows, total } = await logDao.getLogs(v)
    if (!rows || !rows.length) {
      throw new NotFound({ code: 10220 })
    }
    ctx.json({
      total,
      items: rows,
      page: v.get('query.page'),
      count: v.get('query.count')
    })
  }
)

log.linGet(
  'searchLog',
  '/search',
  log.permission('搜索日志'),
  groupRequired,
  async (ctx) => {
    const v = await new LogFindValidator().validate(ctx)
    const keyword = v.get('query.keyword', false, '')
    const { rows, total } = await logDao.searchLogs(v, keyword)
    ctx.json({
      total,
      items: rows,
      page: v.get('query.page'),
      count: v.get('query.count')
    })
  }
)

log.linGet(
  'getUserLog',
  '/users',
  log.permission('查询日志记录的用户'),
  groupRequired,
  async (ctx) => {
    const v = await new PaginateValidator().validate(ctx)
    const result = await logDao.getUserNames(v)
    ctx.json({
      total: result.length,
      items: result,
      page: v.get('query.page'),
      count: v.get('query.count')
    })
  }
)

export {
  log
}