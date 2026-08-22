'use client'

import {
  APPLICATION_PRIORITIES,
  APPLICATION_SOURCE_LABELS,
  APPLICATION_SOURCES,
  APPLICATION_STATUSES,
  createApplicationSchema,
  EMPLOYMENT_TYPE_LABELS,
  EMPLOYMENT_TYPES,
  SALARY_PERIOD_LABELS,
  SALARY_PERIODS,
  WORK_MODEL_LABELS,
  WORK_MODELS,
} from '@jats/shared'
import { useRouter } from 'next/navigation'
import { useState, type FormEvent, type ReactNode } from 'react'
import { createApplication } from '@/lib/api'

/** Untouched inputs arrive as '' from FormData; the API models "not set" as null. */
function optional(value: FormDataEntryValue | null): string | null {
  const text = typeof value === 'string' ? value.trim() : ''
  return text === '' ? null : text
}

/**
 * Number inputs arrive as strings too. Anything unparseable becomes NaN rather
 * than null, so the schema reports a bad value instead of silently dropping it.
 */
function optionalNumber(value: FormDataEntryValue | null): number | null {
  const text = typeof value === 'string' ? value.trim() : ''
  return text === '' ? null : Number(text)
}

/** One <option> per enum value, labelled from the shared map where there is one. */
function options<T extends string>(values: readonly T[], labels?: Record<T, string>): ReactNode {
  return values.map((value) => (
    <option key={value} value={value}>
      {labels ? labels[value] : value}
    </option>
  ))
}

const inputClass =
  'w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-xs outline-none focus:border-slate-500 focus:ring-1 focus:ring-slate-500'

const labelClass = 'grid gap-1 text-sm font-medium text-slate-700'

function Field({ label, wide, children }: { label: string; wide?: boolean; children: ReactNode }) {
  return (
    <label className={wide ? `${labelClass} sm:col-span-2` : labelClass}>
      {label}
      {children}
    </label>
  )
}

export function ApplicationForm() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = event.currentTarget
    const data = new FormData(form)

    // The form is noValidate: the shared schema is the only validation rule set,
    // so the browser and the API can never disagree about what is acceptable.
    const parsed = createApplicationSchema.safeParse({
      jobTitle: data.get('jobTitle'),
      company: data.get('company'),
      location: data.get('location'),
      jobUrl: data.get('jobUrl'),
      employmentType: data.get('employmentType'),
      workModel: data.get('workModel'),
      status: data.get('status'),
      priority: data.get('priority'),
      // An empty date means "today", which is the schema's default — and a
      // default only fires on undefined, never on null.
      appliedAt: optional(data.get('appliedAt')) ?? undefined,
      responsibilities: data.get('responsibilities'),
      qualifications: data.get('qualifications'),
      salaryMin: optionalNumber(data.get('salaryMin')),
      salaryMax: optionalNumber(data.get('salaryMax')),
      salaryCurrency: optional(data.get('salaryCurrency'))?.toUpperCase(),
      salaryPeriod: optional(data.get('salaryPeriod')),
      source: optional(data.get('source')),
      jobDescription: optional(data.get('jobDescription')),
      recruiterName: optional(data.get('recruiterName')),
      recruiterEmail: optional(data.get('recruiterEmail')),
      notes: optional(data.get('notes')),
    })

    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'Please check the form')
      return
    }

    setError(null)
    setPending(true)
    try {
      await createApplication(parsed.data)
      form.reset()
      router.refresh()
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not save the application')
    } finally {
      setPending(false)
    }
  }

  return (
    <form
      noValidate
      onSubmit={(event) => void handleSubmit(event)}
      className="grid gap-4 rounded-lg border border-slate-200 bg-white p-4 sm:grid-cols-2"
    >
      <Field label="Job title">
        <input name="jobTitle" className={inputClass} placeholder="Backend Engineer" />
      </Field>

      <Field label="Company">
        <input name="company" className={inputClass} placeholder="Acme" />
      </Field>

      <Field label="Location">
        <input name="location" className={inputClass} placeholder="Cairo, EG" />
      </Field>

      <Field label="Job posting URL">
        <input name="jobUrl" className={inputClass} placeholder="https://" />
      </Field>

      <Field label="Employment type">
        <select name="employmentType" defaultValue="full-time" className={inputClass}>
          {options(EMPLOYMENT_TYPES, EMPLOYMENT_TYPE_LABELS)}
        </select>
      </Field>

      <Field label="Work model">
        <select name="workModel" defaultValue="on-site" className={inputClass}>
          {options(WORK_MODELS, WORK_MODEL_LABELS)}
        </select>
      </Field>

      <Field label="Status">
        <select name="status" defaultValue="applied" className={`${inputClass} capitalize`}>
          {options(APPLICATION_STATUSES)}
        </select>
      </Field>

      <Field label="Priority">
        <select name="priority" defaultValue="medium" className={`${inputClass} capitalize`}>
          {options(APPLICATION_PRIORITIES)}
        </select>
      </Field>

      {/* No defaultValue: the schema fills in today on submit, which keeps the
          server and client renders from disagreeing about what "today" is. */}
      <Field label="Applied on (defaults to today)">
        <input type="date" name="appliedAt" className={inputClass} />
      </Field>

      <Field label="Source">
        <select name="source" defaultValue="" className={inputClass}>
          <option value="">Not specified</option>
          {options(APPLICATION_SOURCES, APPLICATION_SOURCE_LABELS)}
        </select>
      </Field>

      <Field label="Salary minimum">
        <input type="number" name="salaryMin" min={0} step="0.01" className={inputClass} />
      </Field>

      <Field label="Salary maximum">
        <input type="number" name="salaryMax" min={0} step="0.01" className={inputClass} />
      </Field>

      <Field label="Currency">
        <input
          name="salaryCurrency"
          maxLength={3}
          className={`${inputClass} uppercase`}
          placeholder="USD"
        />
      </Field>

      <Field label="Pay period">
        <select name="salaryPeriod" defaultValue="" className={inputClass}>
          <option value="">Not specified</option>
          {options(SALARY_PERIODS, SALARY_PERIOD_LABELS)}
        </select>
      </Field>

      <Field wide label="Responsibilities">
        <textarea
          name="responsibilities"
          rows={3}
          className={inputClass}
          placeholder="One per line"
        />
      </Field>

      <Field wide label="Qualifications">
        <textarea
          name="qualifications"
          rows={3}
          className={inputClass}
          placeholder="One per line"
        />
      </Field>

      <Field wide label="Job description">
        <textarea name="jobDescription" rows={3} className={inputClass} />
      </Field>

      <Field label="Recruiter name">
        <input name="recruiterName" className={inputClass} />
      </Field>

      <Field label="Recruiter email">
        <input type="email" name="recruiterEmail" className={inputClass} />
      </Field>

      <Field wide label="Notes">
        <textarea name="notes" rows={2} className={inputClass} />
      </Field>

      <div className="flex items-center gap-3 sm:col-span-2">
        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-50"
        >
          {pending ? 'Saving…' : 'Add application'}
        </button>
        {error && (
          <p role="alert" className="text-sm text-rose-700">
            {error}
          </p>
        )}
      </div>
    </form>
  )
}
