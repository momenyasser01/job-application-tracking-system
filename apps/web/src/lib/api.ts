import {
  applicationListSchema,
  applicationSchema,
  type Application,
  type ApplicationStatus,
  type CreateApplication,
  type UpdateApplication,
} from '@jats/shared'
import type { z } from 'zod'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000'

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

/** Pull the most useful message out of the API's error body. */
async function readErrorMessage(response: Response): Promise<string> {
  try {
    const body: unknown = await response.json()
    if (typeof body === 'object' && body !== null) {
      const { error, issues } = body as { error?: unknown; issues?: unknown }
      if (Array.isArray(issues)) {
        const first = issues[0] as { message?: unknown } | undefined
        if (typeof first?.message === 'string') return first.message
      }
      if (typeof error === 'string') return error
    }
  } catch {
    // Non-JSON body — fall through to the generic message.
  }
  return `Request failed with status ${response.status}`
}

async function send(path: string, init?: RequestInit): Promise<Response> {
  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    cache: 'no-store',
    headers: { 'content-type': 'application/json', ...init?.headers },
  })
  if (!response.ok) {
    throw new ApiError(await readErrorMessage(response), response.status)
  }
  return response
}

/**
 * Responses are parsed with the shared schemas, so a contract break shows up as
 * a clear validation error instead of `undefined` somewhere down the tree.
 */
async function request<T>(path: string, schema: z.ZodType<T>, init?: RequestInit): Promise<T> {
  const response = await send(path, init)
  return schema.parse(await response.json())
}

export function listApplications(
  params: { status?: ApplicationStatus; q?: string } = {},
): Promise<Application[]> {
  const query = new URLSearchParams()
  if (params.status) query.set('status', params.status)
  if (params.q) query.set('q', params.q)
  const search = query.toString()
  return request(`/api/applications${search ? `?${search}` : ''}`, applicationListSchema)
}

export function createApplication(input: CreateApplication): Promise<Application> {
  return request('/api/applications', applicationSchema, {
    method: 'POST',
    body: JSON.stringify(input),
  })
}

export function updateApplication(id: string, input: UpdateApplication): Promise<Application> {
  return request(`/api/applications/${id}`, applicationSchema, {
    method: 'PATCH',
    body: JSON.stringify(input),
  })
}

export async function deleteApplication(id: string): Promise<void> {
  await send(`/api/applications/${id}`, { method: 'DELETE' })
}
