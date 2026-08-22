# Job Application Tracking System

A minimal tracker for job applications: one table, one page, one CI job.

- **Web** — Next.js 16 (App Router), React 19, Tailwind 4
- **API** — Node 24, Express 5, TypeScript
- **Database** — PostgreSQL on Supabase, via Drizzle ORM
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

There is none, by design — but the database is ready for it. `src/db/schema.ts`
already has a `users` table and a `user_id` foreign key on `applications`, so
what is left is the identity and the scoping:

1. `apps/api/src/app.ts` — one `app.use('/api', requireAuth)` above the router,
   resolving a session to a `users.id`.
2. `apps/api/src/modules/applications/` — every query filtered by that id, and
   `user_id` set from the session on insert. It is deliberately absent from the
   `@jats/shared` schemas: a client that could send it could write into another
   account.

The `users` table carries identity only — id, email, name. Credentials,
providers and verification belong to whichever approach you pick.

## CI

`.github/workflows/ci.yml` runs on every push to `main` and every PR: install,
build, lint, format check, typecheck, migrate — against a Postgres service
container. No deploy step; add one when you have somewhere to deploy to.

## A note on versions

TypeScript is pinned to `~6.0.3` rather than the latest 7.x. `typescript-eslint`
peers on `typescript <6.1.0`, and TypeScript 7 (the native port) would silently
disable type-aware linting. Bump it once typescript-eslint supports 7.
