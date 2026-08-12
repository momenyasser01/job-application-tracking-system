import { sql } from 'drizzle-orm'
import { afterAll, beforeEach } from 'vitest'
import { client, db } from '../src/db/index.js'

beforeEach(async () => {
  await db.execute(sql`truncate table applications restart identity cascade`)
})

afterAll(async () => {
  await client.end()
})
