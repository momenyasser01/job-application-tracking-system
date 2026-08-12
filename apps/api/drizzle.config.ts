import { config } from 'dotenv'
import { defineConfig } from 'drizzle-kit'

// drizzle-kit runs this file outside the app, so it loads env itself rather than
// importing src/env.ts (which would exit the process on a validation failure).
config({ path: process.env.NODE_ENV === 'test' ? '.env.test' : '.env', quiet: true })

// Migrations run DDL and must not go through Supabase's transaction pooler
// (port 6543), which cannot hold session state. DIRECT_URL points at the direct
// or session connection; fall back to DATABASE_URL when there is only one.
const url = process.env.DIRECT_URL ?? process.env.DATABASE_URL
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
