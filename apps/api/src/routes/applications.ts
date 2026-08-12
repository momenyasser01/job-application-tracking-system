import {
  createApplicationSchema,
  listApplicationsQuerySchema,
  updateApplicationSchema,
} from '@jats/shared'
import { and, desc, eq, ilike, or } from 'drizzle-orm'
import { Router } from 'express'
import { z } from 'zod'
import type { Db } from '../db/index.js'
import { applications } from '../db/schema.js'
import { HttpError } from '../middleware/error.js'

const idParamSchema = z.object({ id: z.uuid({ error: 'Invalid application id' }) })

/** Escape LIKE wildcards so a search for "50%" doesn't match everything. */
function escapeLike(value: string): string {
  return value.replace(/[\\%_]/g, (char) => `\\${char}`)
}

export function applicationsRouter(db: Db): Router {
  const router = Router()

  router.get('/', async (req, res) => {
    const { status, q } = listApplicationsQuerySchema.parse(req.query)

    const term = q ? `%${escapeLike(q)}%` : undefined
    const filters = [
      status ? eq(applications.status, status) : undefined,
      term ? or(ilike(applications.company, term), ilike(applications.role, term)) : undefined,
    ].filter((filter) => filter !== undefined)

    const rows = await db
      .select()
      .from(applications)
      .where(filters.length > 0 ? and(...filters) : undefined)
      .orderBy(desc(applications.createdAt))

    res.json(rows)
  })

  router.post('/', async (req, res) => {
    const values = createApplicationSchema.parse(req.body)
    const [created] = await db.insert(applications).values(values).returning()
    res.status(201).json(created)
  })

  router.get('/:id', async (req, res) => {
    const { id } = idParamSchema.parse(req.params)
    const [row] = await db.select().from(applications).where(eq(applications.id, id))
    if (!row) throw new HttpError(404, 'Application not found')
    res.json(row)
  })

  router.patch('/:id', async (req, res) => {
    const { id } = idParamSchema.parse(req.params)
    const values = updateApplicationSchema.parse(req.body)
    const [updated] = await db
      .update(applications)
      .set(values)
      .where(eq(applications.id, id))
      .returning()
    if (!updated) throw new HttpError(404, 'Application not found')
    res.json(updated)
  })

  router.delete('/:id', async (req, res) => {
    const { id } = idParamSchema.parse(req.params)
    const [deleted] = await db
      .delete(applications)
      .where(eq(applications.id, id))
      .returning({ id: applications.id })
    if (!deleted) throw new HttpError(404, 'Application not found')
    res.status(204).end()
  })

  return router
}
