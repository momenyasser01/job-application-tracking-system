import { config } from 'dotenv'
import { defineConfig } from 'drizzle-kit'

// drizzle-kit runs this file outside the app, so it loads env itself rather than
// importing src/env.ts (which would exit the process on a validation failure).
config({ path: process.env.NODE_ENV === 'test' ? '.env.test' : '.env', quiet: true })

const url = process.env.DATABASE_URL
if (!url) {
  throw new Error('DATABASE_URL is not set. Copy .env.example to .env first.')
}

export default defineConfig({
  schema: './src/db/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: { url },
  strict: true,
  verbose: true,
})
