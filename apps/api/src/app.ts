import cors from 'cors'
import express from 'express'
import helmet from 'helmet'
import type { Db } from './db/index.js'
import { env } from './env.js'
import { errorHandler, notFoundHandler } from './middleware/error.js'
import { applicationsRouter } from './routes/applications.js'

/**
 * Builds the app without binding a port, so tests can drive it in-process with
 * Supertest and `server.ts` stays the only place that calls `listen()`.
 */
export function createApp(db: Db) {
  const app = express()

  app.use(helmet())
  app.use(cors({ origin: env.WEB_ORIGIN }))
  app.use(express.json({ limit: '100kb' }))

  app.get('/health', (_req, res) => {
    res.json({ status: 'ok' })
  })

  // Authentication goes here — one `app.use('/api', requireAuth)` line, plus a
  // user filter in the queries in routes/applications.ts.
  app.use('/api/applications', applicationsRouter(db))

  app.use(notFoundHandler)
  app.use(errorHandler)

  return app
}
