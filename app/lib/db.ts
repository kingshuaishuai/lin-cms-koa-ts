
import { Sequelize } from 'sequelize'
import { config } from '@ysslin/alioth'

const database = config.getItem('db.database', 'l-cms')
const username = config.getItem('db.username', 'root')
const password = config.getItem('db.password', '')

const options = config.getItem('db')
const sequelize = new Sequelize(database, username, password, {
  ...options,
})

sequelize.sync({
  force: false
}).then(() => {
  console.log('同步表成功')
})

export default sequelize
