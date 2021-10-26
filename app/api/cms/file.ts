import path from 'path'
import { config, LinRouter, ParametersException } from '@ysslin/alioth'
import { LocalUploader } from '../../extension/file/local-uploader'
import { loginRequired } from '../../middleware/jwt'


const file = new LinRouter({
  prefix: '/cms/file'
})

file.linPost(
  'uploadFile',
  '/',
  loginRequired,
  async (ctx) => {
    const files = await ctx.multipart()
    if (files.length < 1) {
      throw new ParametersException({ code: 10033 })
    }
    const uploader = new LocalUploader(
      path.join(config.getItem('file.storeDir'))
    )

    const uploadResult = await uploader.upload(files)
    ctx.json(uploadResult)
  }
)

export {
  file
}