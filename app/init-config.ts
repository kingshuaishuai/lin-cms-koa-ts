import path from 'path'
import fs from 'fs'
import { config } from '@ysslin/alioth'

function applyConfig() {
  // 1. 获取配置目录
  const baseDir = process.cwd()
  config.init(baseDir)
  const files = fs.readdirSync(path.join(baseDir, '/app/config'))

  // 2. 加载配置文件
  for (const file of files) {
    config.getConfigFromFile(path.join(baseDir, '/app/config', file))
  }

  // 3. 加载其他配置项
  config.getConfigFromFile(path.join(baseDir, '/app/extension/file/config.ts'))
  config.getConfigFromFile(path.join(baseDir, '/app/extension/socket/config.ts'))
}

applyConfig()
