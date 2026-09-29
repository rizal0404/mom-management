import { render, screen } from '@testing-library/react'
import { RouterProvider } from 'react-router/dom'
import { describe, expect, it, vi } from 'vitest'

vi.mock('../modules/auth/AuthProvider', () => ({
  useAuth: () => ({
    status: 'authenticated',
    profile: { display_name: 'Anggota DATA DEMO', role: 'MEMBER' },
    logout: vi.fn(),
  }),
}))
vi.mock('../modules/dashboard/dashboardService', () => ({
  getDashboardData: vi.fn(async () => ({
    metrics: { active: 0, overdue: 0, dueSoon: 0, completionPercentage: null },
    urgentActions: [], recentMeetings: [], today: '2026-09-29', dueSoonEnd: '2026-10-06',
  })),
}))

import { router } from './router'

describe('protected route scaffold', () => {
  it('renders the dashboard for an authenticated active profile', async () => {
    router.navigate('/')
    render(<RouterProvider router={router} />)

    expect(await screen.findByRole('heading', { name: 'Ringkasan kerja' })).toBeInTheDocument()
    expect(screen.getByText('Anggota DATA DEMO')).toBeInTheDocument()
  })

  it('exposes labelled notula and tindak lanjut navigation', async () => {
    router.navigate('/')
    render(<RouterProvider router={router} />)

    expect(await screen.findByRole('link', { name: 'Notula' })).toHaveAttribute('href', '/meetings')
    expect(screen.getByRole('link', { name: 'Tindak lanjut' })).toHaveAttribute('href', '/actions')
  })
})
