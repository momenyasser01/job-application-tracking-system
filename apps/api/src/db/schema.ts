import {
  APPLICATION_PRIORITIES,
  APPLICATION_SOURCES,
  APPLICATION_STATUSES,
  EMPLOYMENT_TYPES,
  SALARY_PERIODS,
  WORK_MODELS,
} from '@jats/shared'
import { sql } from 'drizzle-orm'
import {
  char,
  check,
  date,
  index,
  numeric,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core'

export const applicationStatus = pgEnum('application_status', APPLICATION_STATUSES)
export const applicationPriority = pgEnum('application_priority', APPLICATION_PRIORITIES)
export const employmentType = pgEnum('employment_type', EMPLOYMENT_TYPES)
export const workModel = pgEnum('work_model', WORK_MODELS)
export const salaryPeriod = pgEnum('salary_period', SALARY_PERIODS)
export const applicationSource = pgEnum('application_source', APPLICATION_SOURCES)

/**
 * Identity only. Authentication is deliberately not implemented — this table
 * exists so `applications.user_id` has a real target to reference. Whoever
 * builds auth owns what else belongs here: credentials, providers, verification.
 */
export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  // Normalised to lowercase at the boundary, so a plain unique index is enough
  // and the citext extension is not needed.
  email: text('email').notNull().unique(),
  name: text('name'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
})

export const applications = pgTable(
  'applications',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),

    // The posting
    jobTitle: text('job_title').notNull(),
    company: text('company').notNull(),
    location: text('location').notNull(),
    jobUrl: text('job_url').notNull(),
    employmentType: employmentType('employment_type').notNull(),
    workModel: workModel('work_model').notNull(),

    // Pay. All four are set together or not at all — see the CHECKs below.
    // `mode: 'number'` is safe here: numeric(12, 2) tops out around 1e10, well
    // inside the 2^53 range where a JS double is still exact.
    salaryMin: numeric('salary_min', { precision: 12, scale: 2, mode: 'number' }),
    salaryMax: numeric('salary_max', { precision: 12, scale: 2, mode: 'number' }),
    salaryCurrency: char('salary_currency', { length: 3 }),
    salaryPeriod: salaryPeriod('salary_period'),

    // The application itself
    status: applicationStatus('status').notNull().default('applied'),
    priority: applicationPriority('priority').notNull().default('medium'),
    appliedAt: date('applied_at')
      .notNull()
      .default(sql`CURRENT_DATE`),
    source: applicationSource('source'),

    // Content. Responsibilities and qualifications are newline-delimited text
    // rather than arrays: they come out of a posting as prose and go back into
    // a textarea unchanged.
    responsibilities: text('responsibilities').notNull(),
    qualifications: text('qualifications').notNull(),
    jobDescription: text('job_description'),
    recruiterName: text('recruiter_name'),
    recruiterEmail: text('recruiter_email'),
    notes: text('notes'),

    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    // Every query is scoped to one user, so both indexes lead with user_id; the
    // first also serves a bare `where user_id = ?`.
    index('applications_user_id_applied_at_idx').on(table.userId, table.appliedAt.desc()),
    index('applications_user_id_status_idx').on(table.userId, table.status),

    // A CHECK evaluates to unknown — and so passes — when an operand is NULL,
    // which is exactly what is wanted: these only bite once a value is set.
    check('applications_salary_min_positive_check', sql`${table.salaryMin} >= 0`),
    check('applications_salary_range_check', sql`${table.salaryMax} >= ${table.salaryMin}`),
    check(
      'applications_salary_meta_check',
      sql`num_nonnulls(${table.salaryMin}, ${table.salaryMax}) = 0 or num_nonnulls(${table.salaryCurrency}, ${table.salaryPeriod}) = 2`,
    ),
    // char(3) pads shorter values, so 'US' is stored as 'US ' and fails this.
    check('applications_salary_currency_check', sql`${table.salaryCurrency} ~ '^[A-Z]{3}$'`),
  ],
)
