import Koa from 'koa'
import Router from '@koa/router'
import KoaBodyParser from 'koa-bodyparser'
import cors from '@koa/cors'
import mount from 'koa-mount'
import serve from 'koa-static'
import { Lin, config, Loader, error, log, logging, multipart, jwt, json, success } from '@ysslin/alioth'
import LinWebsocket from './extension/socket/socket'
import { PermissionModel } from './model/permission'

/**
 * 解析Body参数
 * @param app koa实例
 */
function applyBodyParse(app: Koa) {
  // 参数解析
  app.use(KoaBodyParser())
}

function applyCors(app: Koa) {
  app.use(cors())
}

function applyStatic(app: Koa, prefix = '/assets') {
  const assetsDir = config.getItem('file.storeDir', 'app/static')
  app.use(mount(prefix, serve(assetsDir)))
}

function applyJwt(app: Koa) {
  const secret = config.getItem('secret')
  jwt.initApp(app, secret)
}

function indexPage(app: Koa) {
  const mainRouter = new Router()
  mainRouter.get('/', async (ctx) => {
    ctx.body = '<h1>Hello My Lin CMS</h1>'
  })
  app.use(mainRouter.routes()).use(mainRouter.allowedMethods())
}

function applyDefaultExtends(app: Koa) {
  logging(app)
  multipart(app)
  json(app)
  success(app)
}

function applyWebsocket(app: Koa) {
  if (config.getItem('socket.enable')) {
    const server = new LinWebsocket(app)
    return server.init()
  }
  return app
}

/**
 * loader 加载插件和路由文件
 * @param app koa实例
 */
function applyLoader (app) {
  const pluginPath = config.getItem('pluginPath')
  const loader = new Loader(pluginPath, app)
  loader.initLoader()
}

export async function createApp() {
  const app = new Koa()
  applyBodyParse(app)
  applyCors(app)
  applyStatic(app)
  
  app.use(log)
  app.on('error', error)
  
  applyDefaultExtends(app)
  applyLoader(app)
  
  applyJwt(app)

  const lin = new Lin()
  lin.initApp(app, true)
  await PermissionModel.initPermission()
  indexPage(app)
  return applyWebsocket(app)
}
