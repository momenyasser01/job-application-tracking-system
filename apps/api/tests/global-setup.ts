import { config } from 'dotenv'
import { drizzle } from 'drizzle-orm/postgres-js'
import { migrate } from 'drizzle-orm/postgres-js/migrator'
import postgres from 'postgres'

const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1', '::1'])

/**
 * Runs once, in the main process, before any test file is loaded — so the guard
 * below trips before a single query can reach a remote database.
 */
export default async function setup(): Promise<void> {
  config({ path: '.env.test', quiet: true })

  const url = process.env.DATABASE_URL
  if (!url) {
    throw new Error(
      'DATABASE_URL is not set. Create apps/api/.env.test pointing at a local Postgres.',
    )
  }

  const { hostname } = new URL(url)
  if (!LOCAL_HOSTS.has(hostname)) {
    throw new Error(
      `Refusing to run destructive tests against "${hostname}". ` +
        'The suite truncates tables — point DATABASE_URL at a local database.',
    )
  }

  // onnotice: re-running migrations emits "already exists, skipping" notices.
  const client = postgres(url, { max: 1, onnotice: () => undefined })
  try {
    await migrate(drizzle(client), { migrationsFolder: 'drizzle' })
  } finally {
    await client.end()
  }
}
