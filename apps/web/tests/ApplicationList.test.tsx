import type { Application } from '@jats/shared'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ApplicationList } from '@/components/ApplicationList'
import { deleteApplication, updateApplication } from '@/lib/api'

const refresh = vi.fn()

vi.mock('next/navigation', () => ({ useRouter: () => ({ refresh }) }))
vi.mock('@/lib/api', () => ({ deleteApplication: vi.fn(), updateApplication: vi.fn() }))

const deleteApplicationMock = vi.mocked(deleteApplication)
const updateApplicationMock = vi.mocked(updateApplication)

const application: Application = {
  id: '11111111-1111-4111-8111-111111111111',
  company: 'Acme',
  role: 'Backend Engineer',
  status: 'applied',
  location: 'Remote',
  url: 'https://acme.test/jobs/1',
  appliedAt: '2026-08-01',
  notes: null,
  createdAt: '2026-08-12T00:00:00.000Z',
  updatedAt: '2026-08-12T00:00:00.000Z',
}

describe('ApplicationList', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders an empty state when there is nothing to show', () => {
    render(<ApplicationList applications={[]} />)
    expect(screen.getByText('No applications yet.')).toBeInTheDocument()
  })

  it('renders a row with a link to the posting', () => {
    render(<ApplicationList applications={[application]} />)

    expect(screen.getByRole('link', { name: 'Acme' })).toHaveAttribute(
      'href',
      'https://acme.test/jobs/1',
    )
    expect(screen.getByText('Backend Engineer')).toBeInTheDocument()
    expect(screen.getByText('2026-08-01')).toBeInTheDocument()
  })

  it('patches only the status when the select changes', async () => {
    const user = userEvent.setup()
    updateApplicationMock.mockResolvedValue({ ...application, status: 'interviewing' })

    render(<ApplicationList applications={[application]} />)
    await user.selectOptions(screen.getByLabelText('Status for Acme'), 'interviewing')

    expect(updateApplicationMock).toHaveBeenCalledWith(application.id, { status: 'interviewing' })
    expect(refresh).toHaveBeenCalled()
  })

  it('deletes a row and refreshes', async () => {
    const user = userEvent.setup()
    deleteApplicationMock.mockResolvedValue()

    render(<ApplicationList applications={[application]} />)
    await user.click(screen.getByRole('button', { name: 'Delete' }))

    expect(deleteApplicationMock).toHaveBeenCalledWith(application.id)
    expect(refresh).toHaveBeenCalled()
  })
})
