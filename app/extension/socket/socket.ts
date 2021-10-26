import { jwt, config } from '@ysslin/alioth'
import { createServer, IncomingMessage } from 'http'
import { Socket } from 'net'
import Application from 'koa'
import { WebSocketServer, WebSocket, Server } from 'ws'
import { get, set } from 'lodash'
import { UserGroupModel } from '../../model/user-group'

declare module 'koa' {
  interface BaseContext {
    websocket: LinWebsocket
  }
}

const USER_KEY = Symbol('user')

const INTERCEPTORS = Symbol('WebSocket#interceptors')

const HANDLE_CLOSE = Symbol('WebSocket#close')

const HANDLE_ERROR = Symbol('WebSocket#error')

class LinWebsocket {
  app: Application
  wss: WebSocketServer | null
  sessions: Set<WebSocket>

  constructor(app: Application) {
    this.app = app
    this.wss = null
    this.sessions = new Set()
  }

  /**
   * 初始化创建ws服务器，监听事件
   * @returns 
   */
  init() {
    const server = createServer(this.app.callback())
    this.wss = new WebSocketServer({
      path: config.getItem('socket.path', '/ws/message'),
      noServer: true,
    })

    // server收到upgrade代表协议从 http(s) 升级到 ws(s),此时执行this.wss的handleUpgrade方法
    server.on('upgrade', this[INTERCEPTORS].bind(this))

    // ws服务端监听事件
    this.wss.on('connection', (socket) => {
      socket.on('close', this[HANDLE_CLOSE].bind(this))
      socket.on('error', this[HANDLE_CLOSE].bind(this))
      socket.on('message', (data) => {
        socket.send(JSON.stringify(`复读机: ${data.toString()}`))
      })
    })

    this.app.context.websocket = this
    return server
  }

  // on upgrade 处理器
  [INTERCEPTORS](req: IncomingMessage, socket: Socket, head: Buffer) {
    // 是否开启 websocket 的鉴权拦截器
    if (config.getItem('socket.intercept')) {
      const params = new URLSearchParams(req.url?.slice(req.url.indexOf('?')))
      const token = params.get('token') || ''
      // 验证token
      try {
        const verifyResult = jwt.verifyToken(token)
        const identity = typeof verifyResult !== 'string' ? verifyResult.identity : ''
        if (!identity) {
          throw new Error('token验证失败')
        }
        this.wss!.handleUpgrade(req, socket, head, (client) => {
          set(client, USER_KEY, identity)
          this.sessions.add(client)
          this.wss!.emit('connection', client, req)
        })
      } catch (err) {
        if (err instanceof Error) {
          console.log(err.message)
        }
        socket.destroy()
      }
      return 
    }
    this.wss!.handleUpgrade(req, socket, head, (client) => {
      this.sessions.add(client)
      this.wss!.emit('connection', client, req)
    })
  }

  [HANDLE_CLOSE]() {
    // 查找到关闭的session将其移除sessions列表
    for (const session of this.sessions) {
      if (session.readyState === WebSocket.CLOSED) {
        this.sessions.delete(session)
      }
    }
  }

  [HANDLE_ERROR](session: Server, error: Error) {
    console.error(error)
  }

  /**
   * 发送消息
   * @param userId 
   * @param message 
   */
  sendMessage(userId: number, message: string) {
    for (const session of this.sessions) {
      if (session.readyState !== WebSocket.OPEN) {
        continue
      }
      if (get(session, USER_KEY) === userId) {
        session.send(message)
      }
    }
  }

  /**
   * 发送消息
   * @param session 当前会话
   * @param message 消息
   */
  sendMessageToSession(session: WebSocket, message: string) {
    session.send(message)
  }

  /**
   * 广播
   * @param message 
   */
  broadCast(message: string) {
    this.sessions.forEach(session => {
      if (session.readyState === WebSocket.OPEN) {
        session.send(message)
      }
    })
  }

  /**
   * 对某个分组进行广播
   * @param groupId 
   * @param message 
   */
  async broadCastToGroup(groupId: number, message: string) {
    const userGroup = await UserGroupModel.findAll({
      where: {
        group_id: groupId
      }
    })
    const userIds = userGroup.map(ug => ug.user_id)
    for (const session of this.sessions) {
      if (userIds.includes(get(session, USER_KEY)) && session.readyState === session.OPEN) {
        session.send(message)
      }
    }
  }

  /**
   * 获取所有会话信息
   * @returns 
   */
  getSessions() {
    return this.sessions
  }

  /**
   * 获取当前连接数
   * @returns 
   */
  getConnectionCount() {
    return this.sessions.size
  }
}

export default LinWebsocket
