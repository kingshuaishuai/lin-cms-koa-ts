import Router from '@koa/router'
import { Poem } from './model'

const poem2Api = new Router({
  prefix: '/poem2'
})

poem2Api.get('/all', async (ctx) => {
  ctx.body = await Poem.getAll()
})

export {
  poem2Api
}