import fs from 'fs'
import path from 'path'
import { config, Uploader, FileInfo } from '@ysslin/alioth'
import { FileModel } from '../../model/file'

interface UploadFileResult {
  id: number,
  key: string
  path: string
  url: string
  type: string
  name: string
  extension: string
  size: number
}

export class LocalUploader extends Uploader {
  async upload(files: FileInfo[]) {
    const arr: Array<UploadFileResult> = []
    for (const file of files) {
      const md5 = this.generateMd5(file)
      const siteDomain = config.getItem('siteDomain', 'http://lcoalhost')
      const exist = await FileModel.findOne({
        where: {
          md5: md5
        }
      })
      if (exist) {
        // 文件已存在，则不需要重新存储，直接返回数据即可        
        arr.push({
          id: exist.id,
          key: file.fieldName,
          path: exist.path,
          url: `${siteDomain}/assets/${exist.path}`,
          type: exist.type,
          name: exist.name,
          extension: exist.extension,
          size: exist.size
        })
      } else {
        const { absolutePath, relativePath, realName } = this.getStorePath(file.fileName)
        const target = fs.createWriteStream(absolutePath)
        await target.write(file.data)
        const ext = path.extname(file.fileName)
        const savedFile = await FileModel.create({
          path: relativePath,
          name: realName,
          extension: ext,
          size: file.size,
          md5
        })
        arr.push({
          id: savedFile.id,
          key: file.fieldName,
          path: savedFile.path,
          url: `${siteDomain}/assets/${savedFile.path}`,
          type: savedFile.type,
          name: savedFile.name,
          extension: savedFile.extension,
          size: savedFile.size
        })
      }
    }
    return arr
  }
}