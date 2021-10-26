import { BookSearchValidator, CreateOrUpdateBookValidator } from './../../validator/book'
import { disableLoading, LinRouter, NotFound } from '@ysslin/alioth'
import { PositiveIdValidator } from '../../validator/common'
import { BookDao } from '../../dao/book'
import { groupRequired } from '../../middleware/jwt'
import { BookNotFound } from '../../lib/exception'

const bookApi = new LinRouter({
  module: '图书',
  prefix: '/v1/book'
})

const bookDao = new BookDao()

bookApi.get('/:id', async ctx => {
  const v = await new PositiveIdValidator().validate(ctx)
  const book = await bookDao.getBook(v.get('path.id'))
  if (!book) {
    throw new NotFound({
      code: 10022
    })
  }
  ctx.json(book)
})

bookApi.get('/', async ctx => {
  const books = await bookDao.getBooks()
  ctx.json(books)
})

bookApi.linPost(
  'createBook', 
  '/', 
  bookApi.permission('创建图书'),
  groupRequired,
  async (ctx) => {
    const v = await new CreateOrUpdateBookValidator().validate(ctx)
    await bookDao.createBook(v)
    ctx.success({
      code: 12
    })
  }
)

bookApi.get('/search/one', async ctx => {
  const v = await new BookSearchValidator().validate(ctx)
  const book = await bookDao.getBookByKeyword(v.get('query.q'))
  if (!book) {
    throw new BookNotFound()
  }
  ctx.json(book)
})

bookApi.linPut(
  'updateBook',
  '/:id',
  bookApi.permission('更新图书'),
  groupRequired,
  async ctx => {
    const v = await new CreateOrUpdateBookValidator().validate(ctx)
    await bookDao.updateBook(v)
    ctx.success({
      code: 13
    })
  }
)

bookApi.linDelete(
  'deleteBook',
  '/:id',
  bookApi.permission('删除图书'),
  groupRequired,
  async ctx => {
    const v = await new PositiveIdValidator().validate(ctx)
    const id = v.get('path.id')
    await bookDao.deleteBook(id)
    ctx.success({
      code: 14
    })
  }
)

export {
  bookApi,
}

export default {
  [disableLoading]: false
}
