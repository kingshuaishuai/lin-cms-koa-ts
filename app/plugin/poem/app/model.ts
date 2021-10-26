// import { merge } from 'lodash';
// import Sequelize, { Model } from 'sequelize'

// export class Poem extends Model {

// }

// Poem.init(
//   {
//     id: {
//       type: Sequelize.INTEGER,
//       autoIncrement: true,
//       primaryKey: true
//     },
//     title: {
//       type: Sequelize.STRING(50),
//       allowNull: false,
//       comment: '标题'
//     },
//     author: {
//       type: Sequelize.STRING(50),
//       defaultValue: '未名',
//       comment: '作者'
//     },
//     dynasty: {
//       type: Sequelize.STRING(50),
//       defaultValue: '未知',
//       comment: '朝代'
//     },
//     content: {
//       type: Sequelize.TEXT,
//       allowNull: false,
//       comment: '内容，以/来分割每一句，以|来分割宋词的上下片',
//       get () {
//         const raw = this.getDataValue('content');
//         /**
//          * @type Array
//          */
//         const lis = raw.split('|');
//         const res = lis.map(x => x.split('/'));
//         return res;
//       }
//     },
//     image: {
//       type: Sequelize.STRING(255),
//       defaultValue: '',
//       comment: '配图'
//     }
//   },
//   merge(
//     {
//       tableName: 'poem',
//       modelName: 'poem',
//       sequelize: sequelize
//     },
//     ModelCommonConfig.options
//   )
// );

interface PoemItem {
  id: number
  title: string
  author: string
  dynasty: string
  content: string
  image: string
  create_time: string
}

const store: PoemItem[] = [
  {
    id: 1,
    title: '悯农',
    author: '李绅',
    dynasty: '唐',
    content: '锄禾日当午，汗滴禾下土',
    image: 'https://img1.baidu.com/it/u=164175957,2647004327&fm=26&fmt=auto',
    create_time: '2021-10-15'
  }
]

export class Poem {
  private id: number
  private title: string
  private author: string
  private dynasty: string
  private content: string
  private image: string
  private createTime: string

  constructor(poem: PoemItem) {
    this.id = poem.id
    this.title = poem.title
    this.author = poem.author
    this.dynasty = poem.dynasty
    this.content = poem.content
    this.image = poem.image
    this.createTime = poem.create_time
  }
  toJSON () {
    const origin = {
      id: this.id,
      title: this.title,
      author: this.author,
      dynasty: this.dynasty,
      content: this.content,
      image: this.image,
      create_time: this.createTime
    }
    return origin
  }

  static async getAll() {
    return store
  }

  static async createPoem(poem: Poem) {
    store.push(poem.toJSON())
  }
}
