import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { addDays, getWitaDate } from '../../lib/witaDate'

const mocks = vi.hoisted(() => ({
  profile: { id: 'pic-a', role: 'MEMBER' },
  deleteAction: vi.fn(),
  getPersonalActionSummary: vi.fn(),
  listActionMeetings: vi.fn(),
  listActionProfiles: vi.fn(),
  listActions: vi.fn(),
}))

vi.mock('../auth/AuthProvider', () => ({ useAuth: () => ({ profile: mocks.profile }) }))
vi.mock('./TimelineView', () => ({ TimelineView: () => null }))
vi.mock('./actionService', () => ({
  actionStatuses: ['OPEN', 'IN_PROGRESS', 'BLOCKED', 'DONE', 'CANCELLED'],
  deleteAction: mocks.deleteAction,
  getPersonalActionSummary: mocks.getPersonalActionSummary,
  listActionMeetings: mocks.listActionMeetings,
  listActionProfiles: mocks.listActionProfiles,
  listActions: mocks.listActions,
}))

import { ActionsPage } from './ActionsPage'

function LocationProbe() {
  const location = useLocation()
  return <output data-testid="current-url">{location.pathname}{location.search}</output>
}

function renderPage(entry = '/actions') {
  return render(<MemoryRouter initialEntries={[entry]}><Routes><Route path="/actions" element={<><ActionsPage /><LocationProbe /></>} /></Routes></MemoryRouter>)
}

beforeEach(() => {
  vi.clearAllMocks()
  mocks.profile = { id: 'pic-a', role: 'MEMBER' }
  mocks.deleteAction.mockResolvedValue(undefined)
  mocks.getPersonalActionSummary.mockResolvedValue({ mine: 12, dueToday: 2, next7Days: 5, overdue: 1 })
  mocks.listActionMeetings.mockResolvedValue([])
  mocks.listActionProfiles.mockResolvedValue([])
  mocks.listActions.mockResolvedValue({ data: [], total: 0, page: 1, pageSize: 25 })
})

afterEach(() => vi.useRealTimers())

describe('pintasan pribadi pada tracker', () => {
  it('menyimpan preset 7 hari di URL dan menerapkan filter sesi sampai +7 hari', async () => {
    const today = getWitaDate()
    renderPage()

    fireEvent.click(await screen.findByRole('link', { name: /7 hari ke depan/ }))

    await waitFor(() => expect(mocks.listActions).toHaveBeenLastCalledWith({
      search: '', kind: '', status: '', picId: 'pic-a', meetingId: '',
      dueFrom: today, dueTo: addDays(today, 7), overdue: false, active: true,
    }, 1))
    expect(screen.getByTestId('current-url')).toHaveTextContent('/actions?preset=next7')
    const summary = within(screen.getByLabelText('Ringkasan pribadi'))
    expect(summary.getByRole('link', { name: /7 hari ke depan/ })).toHaveAttribute('aria-current', 'page')
    expect(summary.getByRole('link', { name: /Tugas Saya/ })).toHaveAttribute('href', '/actions?preset=mine')
  })

  it('mengikat Tugas Saya ke akun sesi saat akun berubah, bukan ID lama di URL', async () => {
    const view = renderPage('/actions?preset=mine')
    await waitFor(() => expect(mocks.listActions).toHaveBeenLastCalledWith(expect.objectContaining({ picId: 'pic-a', active: true }), 1))

    mocks.profile = { id: 'pic-b', role: 'MEMBER' }
    view.rerender(<MemoryRouter initialEntries={['/actions?preset=mine']}><Routes><Route path="/actions" element={<><ActionsPage /><LocationProbe /></>} /></Routes></MemoryRouter>)

    await waitFor(() => expect(mocks.listActions).toHaveBeenLastCalledWith(expect.objectContaining({ picId: 'pic-b', active: true }), 1))
    expect(mocks.getPersonalActionSummary).toHaveBeenLastCalledWith('pic-b', getWitaDate())
    expect(screen.getByTestId('current-url')).toHaveTextContent('/actions?preset=mine')
  })

  it('materialisasi preset mempertahankan PIC dan rentang sebelum filter manual', async () => {
    const today = getWitaDate()
    renderPage('/actions?preset=today')
    await screen.findByText('Belum ada tindak lanjut')
    fireEvent.click(screen.getByText('Filter'))
    fireEvent.change(screen.getByLabelText('Cari judul'), { target: { value: 'Rapat mingguan' } })

    await waitFor(() => expect(mocks.listActions).toHaveBeenLastCalledWith(expect.objectContaining({
      search: 'Rapat mingguan', picId: 'pic-a', dueFrom: today, dueTo: today, active: true,
    }), 1))
    expect(screen.getByTestId('current-url')).toHaveTextContent(`pic=pic-a&from=${today}&to=${today}&status=ACTIVE&search=Rapat+mingguan`)
  })

  it('memperlihatkan hitungan nol dan empty state ketika PIC tidak punya pekerjaan aktif', async () => {
    mocks.getPersonalActionSummary.mockResolvedValue({ mine: 0, dueToday: 0, next7Days: 0, overdue: 0 })
    renderPage()

    expect(await screen.findByText('Belum ada tindak lanjut')).toBeInTheDocument()
    const summary = within(screen.getByLabelText('Ringkasan pribadi'))
    expect(summary.getAllByText('0', { selector: 'strong' })).toHaveLength(4)
  })
})
