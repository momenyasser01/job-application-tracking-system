import { config } from 'dotenv'
import { z } from 'zod'

// Real environment variables always win — dotenv never overrides what is already
// set, which is what makes this a no-op in CI.
config({ path: '.env', quiet: true })

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(4000),
  DATABASE_URL: z
    .string()
    .min(1)
    .refine((value) => /^postgres(ql)?:\/\//.test(value), {
      error: 'DATABASE_URL must be a postgres:// or postgresql:// connection string',
    }),
  WEB_ORIGIN: z.url().default('http://localhost:3000'),
})

const parsed = envSchema.safeParse(process.env)

if (!parsed.success) {
  console.error(`Invalid environment:\n${z.prettifyError(parsed.error)}`)
  console.error('Copy apps/api/.env.example to apps/api/.env and fill it in.')
  process.exit(1)
}

export const env = parsed.data
