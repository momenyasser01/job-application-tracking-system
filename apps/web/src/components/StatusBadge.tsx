import type { ApplicationStatus } from '@jats/shared'

// Tailwind only emits classes it can see literally in the source, so these are
// full strings rather than built from the status name.
export const STATUS_STYLES: Record<ApplicationStatus, string> = {
  applied: 'bg-blue-100 text-blue-800 ring-blue-300',
  interviewing: 'bg-amber-100 text-amber-900 ring-amber-300',
  offer: 'bg-emerald-100 text-emerald-800 ring-emerald-300',
  rejected: 'bg-rose-100 text-rose-800 ring-rose-300',
  withdrawn: 'bg-slate-100 text-slate-700 ring-slate-300',
}

export function StatusBadge({ status, count }: { status: ApplicationStatus; count?: number }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium capitalize ring-1 ring-inset ${STATUS_STYLES[status]}`}
    >
      {status}
      {count !== undefined && <span className="font-semibold tabular-nums">{count}</span>}
    </span>
  )
}
