import { APPLICATION_STATUSES, type Application, type ApplicationStatus } from '@jats/shared'
import Link from 'next/link'
import { ApplicationForm } from '@/components/ApplicationForm'
import { ApplicationList } from '@/components/ApplicationList'
import { StatusBadge } from '@/components/StatusBadge'
import { listApplications } from '@/lib/api'

// The list always reflects the API, so there is nothing to prerender — and this
// keeps `next build` from trying to reach an API that is not running.
export const dynamic = 'force-dynamic'

function parseStatus(value: string | string[] | undefined): ApplicationStatus | undefined {
  return APPLICATION_STATUSES.find((status) => status === value)
}

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const status = parseStatus((await searchParams).status)

  // Fetch everything once: the counts strip summarises all applications, so
  // filtering happens here rather than in the query.
  let all: Application[] = []
  let error: string | null = null
  try {
    all = await listApplications()
  } catch (cause) {
    error = cause instanceof Error ? cause.message : 'Could not reach the API'
  }

  const applications = status ? all.filter((application) => application.status === status) : all

  const counts = APPLICATION_STATUSES.map((value) => ({
    status: value,
    count: all.filter((application) => application.status === value).length,
  }))

  return (
    <main className="grid gap-8">
      <header className="grid gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">Job applications</h1>
        <p className="text-sm text-slate-500">
          {applications.length} {applications.length === 1 ? 'application' : 'applications'}
          {status ? ` with status “${status}”` : ''}
        </p>
      </header>

      <ApplicationForm />

      {error ? (
        <p
          role="alert"
          className="rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800"
        >
          {error} — is the API running on{' '}
          {process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000'}?
        </p>
      ) : (
        <section className="grid gap-4">
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href="/"
              className={`rounded-full px-3 py-1 text-xs font-medium ring-1 ring-inset ${
                status
                  ? 'bg-white text-slate-600 ring-slate-300'
                  : 'bg-slate-900 text-white ring-slate-900'
              }`}
            >
              All
            </Link>
            {counts.map((entry) => (
              <Link key={entry.status} href={`/?status=${entry.status}`}>
                <StatusBadge status={entry.status} count={entry.count} />
              </Link>
            ))}
          </div>

          <ApplicationList applications={applications} />
        </section>
      )}
    </main>
  )
}
