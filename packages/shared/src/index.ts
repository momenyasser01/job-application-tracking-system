import { z } from 'zod'

/**
 * The single source of truth for the API contract. Both the Express API and the
 * Next.js app import these schemas, so a change here surfaces as a type error on
 * whichever side has not caught up. The Drizzle schema builds its `pgEnum`s from
 * the same tuples, so adding a value means editing one array here.
 */

export const APPLICATION_STATUSES = [
  'applied',
  'interviewing',
  'offer',
  'rejected',
  'withdrawn',
] as const

export const APPLICATION_PRIORITIES = ['low', 'medium', 'high'] as const

export const EMPLOYMENT_TYPES = ['full-time', 'part-time', 'contract', 'internship'] as const

export const WORK_MODELS = ['on-site', 'hybrid', 'remote'] as const

export const SALARY_PERIODS = ['hourly', 'monthly', 'yearly'] as const

export const APPLICATION_SOURCES = [
  'job-board',
  'company-site',
  'referral',
  'recruiter',
  'other',
] as const

export type ApplicationStatus = (typeof APPLICATION_STATUSES)[number]
export type ApplicationPriority = (typeof APPLICATION_PRIORITIES)[number]
export type EmploymentType = (typeof EMPLOYMENT_TYPES)[number]
export type WorkModel = (typeof WORK_MODELS)[number]
export type SalaryPeriod = (typeof SALARY_PERIODS)[number]
export type ApplicationSource = (typeof APPLICATION_SOURCES)[number]

/**
 * Labels for the enums whose values are not a single plain word. CSS
 * `capitalize` renders 'full-time' as "Full-Time", so these have to be spelled
 * out; status and priority are single words and stay capitalised in CSS.
 */
export const EMPLOYMENT_TYPE_LABELS: Record<EmploymentType, string> = {
  'full-time': 'Full-time',
  'part-time': 'Part-time',
  contract: 'Contract',
  internship: 'Internship',
}

export const WORK_MODEL_LABELS: Record<WorkModel, string> = {
  'on-site': 'On-site',
  hybrid: 'Hybrid',
  remote: 'Remote',
}

export const SALARY_PERIOD_LABELS: Record<SalaryPeriod, string> = {
  hourly: 'per hour',
  monthly: 'per month',
  yearly: 'per year',
}

export const APPLICATION_SOURCE_LABELS: Record<ApplicationSource, string> = {
  'job-board': 'Job board',
  'company-site': 'Company site',
  referral: 'Referral',
  recruiter: 'Recruiter',
  other: 'Other',
}

/** The ceiling of the numeric(12, 2) salary columns in the database. */
const MAX_SALARY = 9_999_999_999.99

/** Today in the YYYY-MM-DD form both the API and the `date` column use. */
function today(): string {
  return new Date().toISOString().slice(0, 10)
}

const applicationFields = {
  jobTitle: z.string().trim().min(1, 'Job title is required').max(200),
  company: z.string().trim().min(1, 'Company is required').max(200),
  location: z.string().trim().min(1, 'Location is required').max(200),
  jobUrl: z.url({ error: 'Must be a valid URL' }).max(2000),
  employmentType: z.enum(EMPLOYMENT_TYPES),
  workModel: z.enum(WORK_MODELS),
  status: z.enum(APPLICATION_STATUSES),
  priority: z.enum(APPLICATION_PRIORITIES),
  appliedAt: z.iso.date({ error: 'Must be a date (YYYY-MM-DD)' }),
  responsibilities: z.string().trim().min(1, 'Responsibilities are required').max(10000),
  qualifications: z.string().trim().min(1, 'Qualifications are required').max(10000),
  salaryMin: z.number().min(0).max(MAX_SALARY).nullish(),
  salaryMax: z.number().min(0).max(MAX_SALARY).nullish(),
  salaryCurrency: z
    .string()
    .trim()
    .regex(/^[A-Z]{3}$/, 'Use a three-letter currency code like USD')
    .nullish(),
  salaryPeriod: z.enum(SALARY_PERIODS).nullish(),
  source: z.enum(APPLICATION_SOURCES).nullish(),
  jobDescription: z.string().trim().max(20000).nullish(),
  recruiterName: z.string().trim().max(200).nullish(),
  recruiterEmail: z.email({ error: 'Must be a valid email address' }).nullish(),
  notes: z.string().trim().max(5000).nullish(),
}

interface SalaryValues {
  salaryMin?: number | null
  salaryMax?: number | null
  salaryCurrency?: string | null
  salaryPeriod?: SalaryPeriod | null
}

/**
 * Mirrors `applications_salary_range_check`. Safe on a partial update as well:
 * it only fires when both bounds arrive in the same payload.
 */
function checkSalaryOrder(values: SalaryValues, ctx: z.RefinementCtx): void {
  const { salaryMin, salaryMax } = values
  if (salaryMin != null && salaryMax != null && salaryMax < salaryMin) {
    ctx.addIssue({
      code: 'custom',
      path: ['salaryMax'],
      message: 'Must be at least the minimum salary',
    })
  }
}

/**
 * Mirrors `applications_salary_meta_check`. Create-only: a PATCH that sets just
 * `salaryMin` cannot see the currency already stored on the row, so for updates
 * the database constraint is the only place this can be judged.
 */
function checkSalaryIsComplete(values: SalaryValues, ctx: z.RefinementCtx): void {
  if (values.salaryMin == null && values.salaryMax == null) return

  if (values.salaryCurrency == null) {
    ctx.addIssue({
      code: 'custom',
      path: ['salaryCurrency'],
      message: 'Required when a salary is given',
    })
  }
  if (values.salaryPeriod == null) {
    ctx.addIssue({
      code: 'custom',
      path: ['salaryPeriod'],
      message: 'Required when a salary is given',
    })
  }
}

export const createApplicationSchema = z
  .object({
    ...applicationFields,
    status: applicationFields.status.default('applied'),
    priority: applicationFields.priority.default('medium'),
    appliedAt: applicationFields.appliedAt.default(today),
  })
  .superRefine((values, ctx) => {
    checkSalaryOrder(values, ctx)
    checkSalaryIsComplete(values, ctx)
  })

/**
 * Built from the undefaulted fields on purpose. Calling `.partial()` on a schema
 * whose field has `.default()` still emits that default, which would make every
 * partial edit silently reset `status` back to 'applied'.
 */
export const updateApplicationSchema = z
  .object(applicationFields)
  .partial()
  .superRefine((values, ctx) => {
    if (Object.keys(values).length === 0) {
      ctx.addIssue({ code: 'custom', message: 'Provide at least one field to update' })
    }
    checkSalaryOrder(values, ctx)
  })

/**
 * Shape of an application as returned by the API (JSON, so dates are strings).
 *
 * `userId` is deliberately absent from every schema in this file. It is never
 * read from a request body — a client able to set it could write rows into
 * another account — and it is redundant on the way out, because every row the
 * API returns already belongs to the caller. The service injects it from the
 * session instead.
 */
export const applicationSchema = z.object({
  id: z.uuid(),
  jobTitle: z.string(),
  company: z.string(),
  location: z.string(),
  jobUrl: z.string(),
  employmentType: z.enum(EMPLOYMENT_TYPES),
  workModel: z.enum(WORK_MODELS),
  status: z.enum(APPLICATION_STATUSES),
  priority: z.enum(APPLICATION_PRIORITIES),
  appliedAt: z.string(),
  source: z.enum(APPLICATION_SOURCES).nullable(),
  salaryMin: z.number().nullable(),
  salaryMax: z.number().nullable(),
  salaryCurrency: z.string().nullable(),
  salaryPeriod: z.enum(SALARY_PERIODS).nullable(),
  responsibilities: z.string(),
  qualifications: z.string(),
  jobDescription: z.string().nullable(),
  recruiterName: z.string().nullable(),
  recruiterEmail: z.string().nullable(),
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
/** Post-parse shape — the defaulted fields have had their defaults applied. */
export type CreateApplication = z.infer<typeof createApplicationSchema>
/** Pre-parse shape — what a caller actually has to supply. */
export type CreateApplicationInput = z.input<typeof createApplicationSchema>
export type UpdateApplication = z.infer<typeof updateApplicationSchema>
export type ListApplicationsQuery = z.infer<typeof listApplicationsQuerySchema>
