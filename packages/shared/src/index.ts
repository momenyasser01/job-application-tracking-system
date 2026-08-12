import { z } from 'zod'

/**
 * The single source of truth for the API contract. Both the Express API and the
 * Next.js app import these schemas, so a change here surfaces as a type error on
 * whichever side has not caught up.
 */

export const APPLICATION_STATUSES = [
  'saved',
  'applied',
  'interviewing',
  'offer',
  'rejected',
] as const

export type ApplicationStatus = (typeof APPLICATION_STATUSES)[number]

const applicationFields = {
  company: z.string().trim().min(1, 'Company is required').max(200),
  role: z.string().trim().min(1, 'Role is required').max(200),
  status: z.enum(APPLICATION_STATUSES),
  location: z.string().trim().max(200).nullish(),
  url: z.url({ error: 'Must be a valid URL' }).nullish(),
  appliedAt: z.iso.date({ error: 'Must be a date (YYYY-MM-DD)' }).nullish(),
  notes: z.string().trim().max(5000).nullish(),
}

export const createApplicationSchema = z.object({
  ...applicationFields,
  status: applicationFields.status.default('saved'),
})

/**
 * Built from the undefaulted fields on purpose. Calling `.partial()` on a schema
 * whose field has `.default()` still emits that default, which would make every
 * partial edit silently reset `status` back to 'saved'.
 */
export const updateApplicationSchema = z
  .object(applicationFields)
  .partial()
  .refine((values) => Object.keys(values).length > 0, {
    error: 'Provide at least one field to update',
  })

/** Shape of an application as returned by the API (JSON, so dates are strings). */
export const applicationSchema = z.object({
  id: z.uuid(),
  company: z.string(),
  role: z.string(),
  status: z.enum(APPLICATION_STATUSES),
  location: z.string().nullable(),
  url: z.string().nullable(),
  appliedAt: z.string().nullable(),
  notes: z.string().nullable(),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
})

export const applicationListSchema = z.array(applicationSchema)

export const listApplicationsQuerySchema = z.object({
  status: z.enum(APPLICATION_STATUSES).optional(),
  q: z.string().trim().max(200).optional(),
})

export type Application = z.infer<typeof applicationSchema>
/** Post-parse shape — `status` has had its default applied. */
export type CreateApplication = z.infer<typeof createApplicationSchema>
/** Pre-parse shape — what a caller actually has to supply. */
export type CreateApplicationInput = z.input<typeof createApplicationSchema>
export type UpdateApplication = z.infer<typeof updateApplicationSchema>
export type ListApplicationsQuery = z.infer<typeof listApplicationsQuerySchema>
