import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ApplicationForm } from '@/components/ApplicationForm'
import { createApplication } from '@/lib/api'

const refresh = vi.fn()

vi.mock('next/navigation', () => ({ useRouter: () => ({ refresh }) }))
vi.mock('@/lib/api', () => ({ createApplication: vi.fn() }))

const createApplicationMock = vi.mocked(createApplication)

describe('ApplicationForm', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('shows the schema error and does not call the API when company is empty', async () => {
    const user = userEvent.setup()
    render(<ApplicationForm />)

    await user.type(screen.getByLabelText('Role'), 'Backend Engineer')
    await user.click(screen.getByRole('button', { name: 'Add application' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('Company is required')
    expect(createApplicationMock).not.toHaveBeenCalled()
  })

  it('submits parsed values and refreshes, turning blank optional fields into null', async () => {
    const user = userEvent.setup()
    createApplicationMock.mockResolvedValue({
      id: '11111111-1111-4111-8111-111111111111',
      company: 'Acme',
      role: 'Backend Engineer',
      status: 'saved',
      location: null,
      url: null,
      appliedAt: null,
      notes: null,
      createdAt: '2026-08-12T00:00:00.000Z',
      updatedAt: '2026-08-12T00:00:00.000Z',
    })

    render(<ApplicationForm />)
    await user.type(screen.getByLabelText('Company'), 'Acme')
    await user.type(screen.getByLabelText('Role'), 'Backend Engineer')
    await user.click(screen.getByRole('button', { name: 'Add application' }))

    expect(createApplicationMock).toHaveBeenCalledWith({
      company: 'Acme',
      role: 'Backend Engineer',
      status: 'saved',
      location: null,
      url: null,
      appliedAt: null,
      notes: null,
    })
    expect(refresh).toHaveBeenCalled()
  })

  it('surfaces an API error instead of clearing the form', async () => {
    const user = userEvent.setup()
    createApplicationMock.mockRejectedValue(new Error('Request failed with status 500'))

    render(<ApplicationForm />)
    await user.type(screen.getByLabelText('Company'), 'Acme')
    await user.type(screen.getByLabelText('Role'), 'Backend Engineer')
    await user.click(screen.getByRole('button', { name: 'Add application' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('Request failed with status 500')
    expect(screen.getByLabelText<HTMLInputElement>('Company').value).toBe('Acme')
    expect(refresh).not.toHaveBeenCalled()
  })
})
