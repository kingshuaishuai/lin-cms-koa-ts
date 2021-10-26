// const path = require('path')
import path from 'path'

module.exports = {
  port: 3010,
  siteDomain: 'http://localhost:3010',
  countDefault: 10,
  pageDefault: 0,
  apiDir: path.join(__dirname, '../api'),
  accessExp: 60 * 60, // 1h 单位秒
  // 指定工作目录，默认为 process.cwd() 路径
  baseDir: path.resolve(__dirname, '../../'),
  // debug 模式
  debug: true,
  // refreshExp 设置refresh_token的过期时间，默认一个月
  refreshExp: 60 * 60 * 24 * 30,
  // 暂不启用插件
  pluginPath: {
    // plugin name
    poem1: {
      // determine a plugin work or not
      enable: true,
      // path of the plugin
      path: path.join(__dirname, '../plugin/poem'),
      // other config
      limit: 2,
      scriptType: 'ts'
    },
    poem2: {
      // determine a plugin work or not
      enable: true,
      // path of the plugin
      path: path.join(__dirname, '../plugin/poem2'),
      // other config
      limit: 2,
      scriptType: 'ts'
    },
  }
}
