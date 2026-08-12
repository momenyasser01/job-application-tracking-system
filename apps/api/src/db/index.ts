import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import { env } from '../env.js'
import * as schema from './schema.js'

// Supabase's transaction pooler (port 6543) multiplexes connections and cannot
// support prepared statements. The direct connection and session pooler can.
const usesTransactionPooler = new URL(env.DATABASE_URL).port === '6543'

export const client = postgres(env.DATABASE_URL, {
  prepare: !usesTransactionPooler,
  max: env.NODE_ENV === 'test' ? 1 : 10,
})

export const db = drizzle(client, { schema })

export type Db = typeof db
