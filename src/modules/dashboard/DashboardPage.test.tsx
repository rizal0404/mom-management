import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { afterEach, describe, expect, it, vi } from 'vitest'

vi.mock('./dashboardService', () => ({ getDashboardData: vi.fn() }))

import { DashboardPage } from './DashboardPage'
import { getDashboardData, type DashboardData } from './dashboardService'

const renderPage = () => render(<MemoryRouter><DashboardPage /></MemoryRouter>)

afterEach(() => vi.resetAllMocks())

describe('DashboardPage', () => {
  it('menampilkan skeleton selama ringkasan dimuat', () => {
    vi.mocked(getDashboardData).mockReturnValue(new Promise(() => {}))
    renderPage()
    expect(screen.getByLabelText('Memuat dashboard')).toBeInTheDocument()
  })

  it('menampilkan tindakan relevan saat data kosong', async () => {
    vi.mocked(getDashboardData).mockResolvedValue({
      metrics: { active: 0, overdue: 0, dueSoon: 0, completionPercentage: null }, urgentActions: [], recentMeetings: [], today: '2026-09-22', dueSoonEnd: '2026-09-29',
    })
    renderPage()
    expect(await screen.findByText('Belum ada tindak lanjut aktif.')).toBeInTheDocument()
    expect(screen.getByText('Belum ada notula yang dapat diakses.')).toBeInTheDocument()
    expect(screen.getByText('Belum ada tindak lanjut')).toBeInTheDocument()
  })

  it('menampilkan coba lagi bila query dashboard gagal', async () => {
    vi.mocked(getDashboardData).mockRejectedValue(new Error('Ringkasan tindak lanjut tidak dapat dimuat.'))
    renderPage()
    expect(await screen.findByRole('alert')).toHaveTextContent('Dashboard tidak dapat dimuat.')
    expect(screen.getByRole('button', { name: 'Coba lagi' })).toBeInTheDocument()
  })

  it('memulihkan error dan membawa ringkasan ke filter tracker yang tepat', async () => {
    let resolveRetry: (data: DashboardData) => void = () => {}
    vi.mocked(getDashboardData).mockRejectedValueOnce(new Error('Jaringan terputus'))
      .mockImplementationOnce(() => new Promise((resolve) => { resolveRetry = resolve }))
    renderPage()
    expect(await screen.findByRole('alert')).toHaveTextContent('Jaringan terputus')
    fireEvent.click(screen.getByRole('button', { name: 'Coba lagi' }))
    expect(screen.getByLabelText('Memuat dashboard')).toBeInTheDocument()
    resolveRetry({
      metrics: { active: 3, overdue: 1, dueSoon: 2, completionPercentage: 50 },
      urgentActions: [], recentMeetings: [], today: '2026-09-22', dueSoonEnd: '2026-09-29',
    })
    await waitFor(() => expect(screen.queryByRole('alert')).not.toBeInTheDocument())
    expect(screen.getByRole('link', { name: /Terlambat/ })).toHaveAttribute('href', '/actions?active=true&overdue=true')
    expect(screen.getByRole('link', { name: /Deadline dekat/ })).toHaveAttribute('href', '/actions?active=true&from=2026-09-22&to=2026-09-29')
    expect(screen.getByRole('link', { name: /Penyelesaian/ })).toHaveAttribute('href', '/actions?status=DONE')
    expect(getDashboardData).toHaveBeenCalledTimes(2)
  })
})
