import { createApp } from './app.js'
//import { db } from './db/index.js'
import { env } from './env.js'

createApp(/*db*/).listen(env.PORT, () => {
  console.info(`API listening on http://localhost:${env.PORT}`)
})
