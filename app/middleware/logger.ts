import { Middleware, RouterContext } from '@koa/router'
import { get } from 'lodash'
import { assert, routeMetaInfo } from '@ysslin/alioth'
import { LogModel } from '../model/log'

/**
 * (?<=\{): (?<=pattern 代表以pattern开头的内容)
 * (?=\}): (?=pattern 代表以pattern结尾的内容)
 * [^}]: (^x在中括号外表示以x开头, ^在中括号内，表示除了这个内容意外 [^a]除了a以为的字符)
 * /(?<=\{)[^}]*(?=\})/: 匹配 {} 中间的内容
 */
const REG_XP = /(?<=\{)[^}]*(?=\})/g

export const logger = (template: string): Middleware => {
  return async (ctx, next) => {
    await next()
    createLog(template, ctx)
  }
}

function createLog(template: string, ctx: RouterContext) {
  // 1. 解析 template, 替换其中{}包裹的变量
  const message = parseTemplate(template, ctx.currentUser, ctx.response, ctx.request)
  // 2. 如果当前有匹配到的路由，则获取路由原信息（包含路由的权限等信息），并创建一条log插入到数据库中
  if (ctx.matched) {
    const routeMetaInfo = findAuthAndModule(ctx)
    let permission = ''
    if (routeMetaInfo) {
      permission = routeMetaInfo.permission || ''
    }
    const statusCode = ctx.status || 0
    LogModel.create({
      message,
      user_id: ctx.currentUser!.id,
      username: ctx.currentUser!.username,
      status_code: statusCode,
      method: ctx.method,
      path: ctx.path,
      permission
    })
  }
}


/**
 * 将模板字符串template中的{a.b}型的内容换为对应的变量值，只能替换user,request,response中的某个属性
 * @param template 
 * @param user 
 * @param response 
 * @param request 
 * @returns 
 */
function parseTemplate(
  template: string,
  user: any,
  response: RouterContext['response'],
  request: RouterContext['request']
): string {
  console.log('模板:', template)
  const res: string[] = []
  let matchedContent: RegExpExecArray | null
  // 1. 匹配所有{}中的内容并保存到res中
  while ((matchedContent = REG_XP.exec(template)) !== null) {
    res.push(matchedContent[0])
  }
  console.log('匹配到的内容', res)
  // 2. 拼接log模板
  if (res.length) {
    res.forEach(item => {
      const index = item.indexOf('.')
      assert(index !== -1, item + '中必须包含 . ,且为一个')
      const obj = item.substring(0, index)
      const prop = item.substring(index + 1, item.length)
      console.log('obj: ', obj, 'prop:', prop)
      console.log('user: ',user)
      let it:any
      switch (obj) {
      case 'user':
        it = get(user, prop, '')
        console.log('it is:', it)
        break
      case 'response':
        it = get(response, prop, '')
        break
      case 'request':
        it = get(request, prop, '')
        break
      default:
        it = ''
        break
      }
      console.log()
      template = template.replace(`{${item}}`, it)
    })
  }
  return template
}

/**
 * 通过当前的路由名找到对应的权限录入信息
 * @param ctx koa 的 context
 */
function findAuthAndModule (ctx: RouterContext) {
  const routeName = ctx._matchedRouteName || ctx.routerName
  const endpoint = `${ctx.method} ${routeName}`
  return routeMetaInfo.get(endpoint)
}