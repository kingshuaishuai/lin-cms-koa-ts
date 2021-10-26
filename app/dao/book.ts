import { NotFound, Forbidden } from '@ysslin/alioth'
import Sequelize from 'sequelize'
import { getSafeParamId } from '../lib/utils'
import { Book } from '../model/book'
import { CreateOrUpdateBookValidator } from '../validator/book'

class BookDao {
  async getBook (id: number) {
    const book = await Book.findOne({
      where: {
        id
      }
    })
    return book
  }

  async getBookByKeyword (q: string) {
    const book = await Book.findOne({
      where: {
        title: {
          [Sequelize.Op.like]: `%${q}%`
        }
      }
    })
    return book
  }

  async getBooks () {
    const books = await Book.findAll()
    return books
  }

  async createBook (v: CreateOrUpdateBookValidator) {
    const book = await Book.findOne({
      where: {
        title: v.get('body.title')
      }
    })
    if (book) {
      throw new Forbidden({
        code: 10240
      })
    }

    await Book.create({
      title: v.get('body.title'),
      author: v.get('body.author'),
      summary: v.get('body.summary'),
      image: v.get('body.image')
    })
  }

  async updateBook (v: CreateOrUpdateBookValidator) {
    const id = getSafeParamId(v.get('path.id'))
    const book = await Book.findByPk(id)
    if (!book) {
      throw new NotFound({
        code: 10022
      })
    }
    book.title = v.get('body.title')
    book.author = v.get('body.author')
    book.summary = v.get('body.summary')
    book.image = v.get('body.image')
    await book.save()
  }

  async deleteBook (id: number) {
    const book = await Book.findOne({
      where: {
        id
      }
    })
    if (!book) {
      throw new NotFound({
        code: 10022
      })
    }
    await book.destroy()
  }
}

export { BookDao }
