import { config } from '@ysslin/alioth'
import { createApp } from './app'

const run = async () => {
  const port = config.getItem('port')
  const app = await createApp()
  app.listen(port, () => {
    console.log(`listening at http://localhost:${port}`)
  })
}

run()