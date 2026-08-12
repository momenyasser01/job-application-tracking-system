# Job Application Tracking System

A minimal tracker for job applications: one table, one page, one CI job.

- **Web** — Next.js 16 (App Router), React 19, Tailwind 4
- **API** — Node 24, Express 5, TypeScript
- **Database** — PostgreSQL on Supabase, via Drizzle ORM
- **Tests** — Vitest; Supertest against a real Postgres for the API, React Testing Library for the web
- **CI** — GitHub Actions

## Layout

```
apps/api        Express API + Drizzle schema and migrations
apps/web        Next.js app
packages/shared Zod schemas shared by both — the API contract
```

`@jats/shared` is why this is a workspace. Both sides import the same schemas, so
the API and the UI cannot drift apart without a type error.

## Setup

Requires Node ≥ 24, pnpm 10, and a PostgreSQL instance.

```bash
pnpm install

cp apps/api/.env.example apps/api/.env      # add your Supabase DATABASE_URL
cp apps/web/.env.example apps/web/.env.local

pnpm --filter @jats/api db:migrate
pnpm dev                                     # web on :3000, API on :4000
```

### Connection strings

Supabase offers three. The app reads the port and adapts:

| Connection         | Port | Notes                                                                         |
| ------------------ | ---- | ----------------------------------------------------------------------------- |
| Direct             | 5432 | Prepared statements supported                                                 |
| Session pooler     | 5432 | Prepared statements supported                                                 |
| Transaction pooler | 6543 | No prepared statements — `src/db/index.ts` detects the port and disables them |

## Scripts

Run from the repo root; each fans out across the workspace.

| Command                             | What it does                                                 |
| ----------------------------------- | ------------------------------------------------------------ |
| `pnpm dev`                          | Web, API, and the shared package's type watcher, in parallel |
| `pnpm build`                        | Builds shared → api → web in dependency order                |
| `pnpm lint`                         | ESLint, including type-aware rules                           |
| `pnpm format` / `pnpm format:check` | Prettier                                                     |
| `pnpm typecheck`                    | `tsc --noEmit` per package                                   |
| `pnpm test`                         | Vitest in both apps                                          |

## Testing

The API tests are integration tests, not mocks — they drive the real Express app
with Supertest against a real Postgres, so the Drizzle queries are actually
exercised.

```bash
createdb jats_test
echo 'DATABASE_URL=postgresql://postgres:password@localhost:5432/jats_test' > apps/api/.env.test
pnpm test
```

The suite truncates tables between cases. `tests/global-setup.ts` therefore
**refuses to run** unless the host is `localhost`/`127.0.0.1` — a misconfigured
`.env` cannot wipe your Supabase database.

## Migrations

Generated and committed; never pushed straight from the schema.

```bash
pnpm --filter @jats/api db:generate   # edit src/db/schema.ts first, then generate SQL
pnpm --filter @jats/api db:migrate    # apply pending migrations
pnpm --filter @jats/api db:studio     # browse the data
```

`drizzle-kit push` is deliberately not wired up — it drifts the database away
from the committed migration history.

## Adding authentication

There is none, by design. Two places to touch:

1. `apps/api/src/app.ts` — one `app.use('/api', requireAuth)` above the router.
2. `apps/api/src/routes/applications.ts` — add a user filter to the queries, plus
   a `user_id` column in `src/db/schema.ts` and a generated migration.

## CI

`.github/workflows/ci.yml` runs on every push to `main` and every PR: install,
build, lint, format check, typecheck, migrate, test — against a Postgres service
container. No deploy step; add one when you have somewhere to deploy to.

## A note on versions

TypeScript is pinned to `~6.0.3` rather than the latest 7.x. `typescript-eslint`
peers on `typescript <6.1.0`, and TypeScript 7 (the native port) would silently
disable type-aware linting. Bump it once typescript-eslint supports 7.
