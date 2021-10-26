import Router from '@koa/router'
import { Poem } from './model'

const poemApi = new Router({
  prefix: '/poem'
})

poemApi.get('/all', async (ctx) => {
  ctx.body = await Poem.getAll()
})

const poemLoginApi = new Router({
  prefix: '/user',
})

poemApi.get('/all', async (ctx) => {
  ctx.body = '李绅'
})

export {
  poemApi,
  poemLoginApi
}