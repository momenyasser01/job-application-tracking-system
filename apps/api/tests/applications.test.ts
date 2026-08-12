import type { Application, CreateApplicationInput } from '@jats/shared'
import request from 'supertest'
import { describe, expect, it } from 'vitest'
import { createApp } from '../src/app.js'
import { db } from '../src/db/index.js'

const app = createApp(db)

const UNKNOWN_ID = '00000000-0000-4000-8000-000000000000'

async function create(overrides: Partial<CreateApplicationInput> = {}): Promise<Application> {
  const response = await request(app)
    .post('/api/applications')
    .send({ company: 'Acme', role: 'Backend Engineer', ...overrides })
    .expect(201)
  return response.body as Application
}

describe('GET /health', () => {
  it('reports ok', async () => {
    const response = await request(app).get('/health').expect(200)
    expect(response.body).toEqual({ status: 'ok' })
  })
})

describe('POST /api/applications', () => {
  it('creates an application and defaults its status to saved', async () => {
    const created = await create({ location: 'Remote', url: 'https://acme.test/jobs/1' })

    expect(created).toMatchObject({
      company: 'Acme',
      role: 'Backend Engineer',
      status: 'saved',
      location: 'Remote',
      url: 'https://acme.test/jobs/1',
    })
    expect(created.id).toBeTypeOf('string')

    await request(app).get(`/api/applications/${created.id}`).expect(200)
  })

  it('rejects a missing company with 400 and the failing field', async () => {
    const response = await request(app)
      .post('/api/applications')
      .send({ company: '', role: 'Backend Engineer' })
      .expect(400)

    expect(response.body).toMatchObject({ error: 'Validation failed' })
    const { issues } = response.body as { issues: { path: string[] }[] }
    expect(issues.some((issue) => issue.path.includes('company'))).toBe(true)
  })

  it('rejects an invalid status', async () => {
    await request(app)
      .post('/api/applications')
      .send({ company: 'Acme', role: 'Engineer', status: 'ghosted' })
      .expect(400)
  })
})

describe('GET /api/applications', () => {
  it('returns applications newest first', async () => {
    await create({ company: 'First' })
    await create({ company: 'Second' })

    const response = await request(app).get('/api/applications').expect(200)
    const rows = response.body as Application[]

    expect(rows).toHaveLength(2)
    expect(rows.map((row) => row.company)).toEqual(['Second', 'First'])
  })

  it('filters by status', async () => {
    await create({ company: 'Saved co' })
    await create({ company: 'Offered co', status: 'offer' })

    const response = await request(app).get('/api/applications?status=offer').expect(200)
    const rows = response.body as Application[]

    expect(rows).toHaveLength(1)
    expect(rows[0]?.company).toBe('Offered co')
  })

  it('searches company and role case-insensitively', async () => {
    await create({ company: 'Globex', role: 'Data Engineer' })
    await create({ company: 'Initech', role: 'Frontend Engineer' })

    const byCompany = await request(app).get('/api/applications?q=globex').expect(200)
    expect(byCompany.body as Application[]).toHaveLength(1)

    const byRole = await request(app).get('/api/applications?q=frontend').expect(200)
    expect((byRole.body as Application[])[0]?.company).toBe('Initech')
  })
})

describe('PATCH /api/applications/:id', () => {
  it('updates a status and bumps updatedAt', async () => {
    const created = await create()

    const response = await request(app)
      .patch(`/api/applications/${created.id}`)
      .send({ status: 'interviewing' })
      .expect(200)

    const updated = response.body as Application
    expect(updated.status).toBe('interviewing')
    expect(updated.company).toBe(created.company)
    expect(Date.parse(updated.updatedAt)).toBeGreaterThanOrEqual(Date.parse(created.updatedAt))
  })

  it('leaves untouched fields alone', async () => {
    const created = await create({ status: 'offer' })

    const response = await request(app)
      .patch(`/api/applications/${created.id}`)
      .send({ company: 'Acme Corp' })
      .expect(200)

    const updated = response.body as Application
    expect(updated.company).toBe('Acme Corp')
    // Regression: a defaulted field on a partial schema used to reset to 'saved'.
    expect(updated.status).toBe('offer')
  })

  it('rejects an empty body', async () => {
    const created = await create()
    await request(app).patch(`/api/applications/${created.id}`).send({}).expect(400)
  })

  it('404s for an unknown id', async () => {
    await request(app)
      .patch(`/api/applications/${UNKNOWN_ID}`)
      .send({ status: 'offer' })
      .expect(404)
  })
})

describe('DELETE /api/applications/:id', () => {
  it('deletes an application', async () => {
    const created = await create()

    await request(app).delete(`/api/applications/${created.id}`).expect(204)
    await request(app).get(`/api/applications/${created.id}`).expect(404)
  })

  it('404s for an unknown id', async () => {
    await request(app).delete(`/api/applications/${UNKNOWN_ID}`).expect(404)
  })
})

describe('id validation', () => {
  it('400s on a malformed id rather than hitting the database', async () => {
    await request(app).get('/api/applications/not-a-uuid').expect(400)
  })
})
