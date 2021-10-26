import { BaseAttrs, ModelCommonConfig } from '@ysslin/alioth'
import { Model, Optional, DataTypes } from 'sequelize'
import sequelize from '../lib/db'


export interface BookAttrs extends BaseAttrs {
  id: number
  title: string
  author: string
  summary: string
  image: string
}

type BookCreationAttrs = Optional<BookAttrs, 'id' | 'author' | 'summary' | 'image'>

export class Book extends Model<BookAttrs, BookCreationAttrs> implements BookAttrs {
  id!: number
  title!: string
  author!: string
  summary!: string
  image!: string
  create_time?: Date | undefined
  update_time?: Date | undefined
  delete_time?: Date | undefined

  toJSON() {
    const origin = {
      id: this.id,
      title: this.title,
      author: this.author,
      summary: this.summary,
      image: this.image
    }
    return origin
  }
}

Book.init({
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  title: {
    type: DataTypes.STRING(50),
    allowNull: false
  },
  author: {
    type: DataTypes.STRING(30),
    allowNull: true,
    defaultValue: '未名'
  },
  summary: {
    type: DataTypes.STRING(1000),
    allowNull: true
  },
  image: {
    type: DataTypes.STRING(500),
    allowNull: true
  }
}, {
  sequelize,
  tableName: 'book',
  modelName: 'book',
  ...ModelCommonConfig.options
})

export {
  Book as BookModel
}