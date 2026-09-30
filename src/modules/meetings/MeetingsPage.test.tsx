import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  profile: { id: 'owner', role: 'MEMBER' as 'MEMBER' | 'ADMIN' },
}))

vi.mock('../auth/AuthProvider', () => ({ useAuth: () => ({ profile: mocks.profile }) }))
vi.mock('./meetingService', () => ({
  deleteMeetingDraft: vi.fn(),
  listMeetings: vi.fn(),
}))

import { deleteMeetingDraft, listMeetings } from './meetingService'
import { MeetingsPage } from './MeetingsPage'

const draft = {
  id: 'draft-1',
  owner_id: 'owner',
  version: 4,
  status: 'DRAFT' as const,
  title: 'Rapat DATA DEMO',
  starts_at: null,
  location_or_link: null,
  chair_name: 'Ketua DATA DEMO',
  participants: [],
  items: [],
}

const pageResult = { data: [draft], total: 1, page: 1, pageSize: 25 }

function renderPage() {
  return render(<MemoryRouter><MeetingsPage /></MemoryRouter>)
}

beforeEach(() => {
  vi.clearAllMocks()
  mocks.profile = { id: 'owner', role: 'MEMBER' }
  vi.mocked(listMeetings).mockResolvedValue(pageResult as never)
  vi.mocked(deleteMeetingDraft).mockResolvedValue(undefined)
})

afterEach(() => vi.unstubAllGlobals())

describe('aksi hapus draf pada daftar rapat', () => {
  it('menampilkan kontrol hanya kepada owner dan admin', async () => {
    const ownerView = renderPage()
    expect(await screen.findByRole('button', { name: 'Hapus notula Rapat DATA DEMO' })).toBeInTheDocument()
    ownerView.unmount()

    mocks.profile = { id: 'member-lain', role: 'MEMBER' }
    const memberView = renderPage()
    expect(await screen.findByRole('link', { name: /Rapat DATA DEMO/ })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Hapus notula Rapat DATA DEMO' })).not.toBeInTheDocument()
    memberView.unmount()

    mocks.profile = { id: 'admin', role: 'ADMIN' }
    renderPage()
    expect(await screen.findByRole('button', { name: 'Hapus notula Rapat DATA DEMO' })).toBeInTheDocument()
  })

  it('mengirim versi daftar ke RPC lalu menghapus draf dari daftar', async () => {
    const confirm = vi.fn(() => true)
    vi.stubGlobal('confirm', confirm)
    renderPage()

    fireEvent.click(await screen.findByRole('button', { name: 'Hapus notula Rapat DATA DEMO' }))

    await waitFor(() => expect(deleteMeetingDraft).toHaveBeenCalledWith('draft-1', 4))
    expect(confirm).toHaveBeenCalledOnce()
    await waitFor(() => expect(screen.queryByRole('link', { name: /Rapat DATA DEMO/ })).not.toBeInTheDocument())
  })

  it('membersihkan pesan konflik setelah daftar berhasil dimuat ulang', async () => {
    vi.stubGlobal('confirm', vi.fn(() => true))
    vi.mocked(deleteMeetingDraft).mockRejectedValueOnce(new Error('CONFLICT'))
    renderPage()

    fireEvent.click(await screen.findByRole('button', { name: 'Hapus notula Rapat DATA DEMO' }))
    const conflict = await screen.findByRole('alert')
    expect(conflict).toHaveTextContent('Notula berubah sejak daftar dimuat. Muat ulang lalu coba lagi.')

    fireEvent.click(screen.getByRole('button', { name: 'Muat ulang' }))

    await waitFor(() => expect(screen.queryByRole('alert')).not.toBeInTheDocument())
    expect(await screen.findByRole('link', { name: /Rapat DATA DEMO/ })).toBeInTheDocument()
    expect(listMeetings).toHaveBeenCalledTimes(2)
  })
})
