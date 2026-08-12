import { APPLICATION_STATUSES } from '@jats/shared'
import { date, index, pgEnum, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core'

export const applicationStatus = pgEnum('application_status', APPLICATION_STATUSES)

export const applications = pgTable(
  'applications',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    company: text('company').notNull(),
    role: text('role').notNull(),
    status: applicationStatus('status').notNull().default('saved'),
    location: text('location'),
    url: text('url'),
    appliedAt: date('applied_at'),
    notes: text('notes'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    index('applications_status_idx').on(table.status),
    index('applications_created_at_idx').on(table.createdAt.desc()),
  ],
)
