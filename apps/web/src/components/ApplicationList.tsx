'use client'

import { APPLICATION_STATUSES, type Application, type ApplicationStatus } from '@jats/shared'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { deleteApplication, updateApplication } from '@/lib/api'
import { STATUS_STYLES } from './StatusBadge'

export function ApplicationList({ applications }: { applications: Application[] }) {
  const router = useRouter()
  const [busyId, setBusyId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function run(id: string, action: () => Promise<unknown>) {
    setBusyId(id)
    setError(null)
    try {
      await action()
      router.refresh()
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Something went wrong')
    } finally {
      setBusyId(null)
    }
  }

  if (applications.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500">
        No applications yet.
      </p>
    )
  }

  return (
    <div className="grid gap-2">
      {error && (
        <p role="alert" className="text-sm text-rose-700">
          {error}
        </p>
      )}

      <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-slate-200 text-xs tracking-wide text-slate-500 uppercase">
            <tr>
              <th className="px-4 py-3 font-medium">Company</th>
              <th className="px-4 py-3 font-medium">Job title</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Applied</th>
              <th className="px-4 py-3 font-medium">Location</th>
              <th className="px-4 py-3">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {applications.map((application) => (
              <tr key={application.id} className={busyId === application.id ? 'opacity-50' : ''}>
                <td className="px-4 py-3 font-medium text-slate-900">
                  <a
                    href={application.jobUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="underline underline-offset-2 hover:text-slate-600"
                  >
                    {application.company}
                  </a>
                </td>
                <td className="px-4 py-3 text-slate-700">{application.jobTitle}</td>
                <td className="px-4 py-3">
                  <label className="sr-only" htmlFor={`status-${application.id}`}>
                    Status for {application.company}
                  </label>
                  <select
                    id={`status-${application.id}`}
                    value={application.status}
                    disabled={busyId === application.id}
                    onChange={(event) => {
                      const status = event.target.value as ApplicationStatus
                      void run(application.id, () => updateApplication(application.id, { status }))
                    }}
                    className={`rounded-full px-2.5 py-1 text-xs font-medium capitalize ring-1 ring-inset ${STATUS_STYLES[application.status]}`}
                  >
                    {APPLICATION_STATUSES.map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="px-4 py-3 text-slate-600 tabular-nums">{application.appliedAt}</td>
                <td className="px-4 py-3 text-slate-600">{application.location}</td>
                <td className="px-4 py-3 text-right">
                  <button
                    type="button"
                    disabled={busyId === application.id}
                    onClick={() =>
                      void run(application.id, () => deleteApplication(application.id))
                    }
                    className="text-xs font-medium text-slate-500 hover:text-rose-700 disabled:opacity-50"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
