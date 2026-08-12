'use client'

import { APPLICATION_STATUSES, createApplicationSchema } from '@jats/shared'
import { useRouter } from 'next/navigation'
import { useState, type FormEvent } from 'react'
import { createApplication } from '@/lib/api'

/** Untouched inputs arrive as '' from FormData; the API models "not set" as null. */
function optional(value: FormDataEntryValue | null): string | null {
  const text = typeof value === 'string' ? value.trim() : ''
  return text === '' ? null : text
}

const inputClass =
  'w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-xs outline-none focus:border-slate-500 focus:ring-1 focus:ring-slate-500'

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
      company: data.get('company'),
      role: data.get('role'),
      status: data.get('status'),
      location: optional(data.get('location')),
      url: optional(data.get('url')),
      appliedAt: optional(data.get('appliedAt')),
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
      <label className="grid gap-1 text-sm font-medium text-slate-700">
        Company
        <input name="company" className={inputClass} placeholder="Acme" />
      </label>

      <label className="grid gap-1 text-sm font-medium text-slate-700">
        Role
        <input name="role" className={inputClass} placeholder="Backend Engineer" />
      </label>

      <label className="grid gap-1 text-sm font-medium text-slate-700">
        Status
        <select name="status" defaultValue="saved" className={`${inputClass} capitalize`}>
          {APPLICATION_STATUSES.map((status) => (
            <option key={status} value={status}>
              {status}
            </option>
          ))}
        </select>
      </label>

      <label className="grid gap-1 text-sm font-medium text-slate-700">
        Applied on
        <input type="date" name="appliedAt" className={inputClass} />
      </label>

      <label className="grid gap-1 text-sm font-medium text-slate-700">
        Location
        <input name="location" className={inputClass} placeholder="Remote" />
      </label>

      <label className="grid gap-1 text-sm font-medium text-slate-700">
        Posting URL
        <input name="url" className={inputClass} placeholder="https://" />
      </label>

      <label className="grid gap-1 text-sm font-medium text-slate-700 sm:col-span-2">
        Notes
        <textarea name="notes" rows={2} className={inputClass} />
      </label>

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
