import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router'
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('../auth/AuthProvider', () => ({ useAuth: () => ({ profile: { id: 'owner', role: 'MEMBER' } }) }))
vi.mock('../../app/useUnsavedChanges', () => ({ useUnsavedChanges: () => ({ setDirty: vi.fn(), allowNextNavigation: vi.fn() }) }))
vi.mock('../evidence/EvidencePanel', () => ({ EvidencePanel: () => null }))
vi.mock('./FinalMeetingView', () => ({ FinalMeetingView: () => null }))
vi.mock('./meetingService', () => ({
  getMeetingDraft: vi.fn(),
  listActiveProfiles: vi.fn(),
  saveMeetingDraft: vi.fn(),
  deleteMeetingDraft: vi.fn(),
  finalizeMeeting: vi.fn(),
}))

import { getMeetingDraft, listActiveProfiles, saveMeetingDraft } from './meetingService'
import { MeetingEditorPage } from './MeetingEditorPage'

const savedMeeting = {
  id: 'fixture', owner_id: 'owner', version: 1, status: 'DRAFT',
  title: 'Rapat DATA DEMO', starts_at: '2026-09-22T01:00:00Z',
  location_or_link: null, chair_name: null,
  meeting_participants: [], meeting_items: [],
}

beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(getMeetingDraft).mockResolvedValue(savedMeeting as never)
  vi.mocked(listActiveProfiles).mockResolvedValue([])
})

describe('penyimpanan draf notula', () => {
  it('menampilkan WITA, tetap mempertahankan input saat gagal, lalu mengonfirmasi simpan dari server', async () => {
    let rejectFirst: (reason: Error) => void = () => {}
    vi.mocked(saveMeetingDraft).mockImplementationOnce(() => new Promise((_, reject) => { rejectFirst = reject }))
      .mockResolvedValueOnce({ id: 'fixture', version: 2 } as never)

    render(<MemoryRouter initialEntries={['/meetings/fixture']}>
      <Routes><Route path="/meetings/:id" element={<MeetingEditorPage />} /></Routes>
    </MemoryRouter>)

    expect(await screen.findByDisplayValue('Rapat DATA DEMO')).toBeInTheDocument()
    expect(screen.getByLabelText('Waktu rapat (WITA)')).toHaveValue('2026-09-22T09:00')
    expect(screen.getByText('Tersimpan ✓')).toBeInTheDocument()

    fireEvent.change(screen.getByLabelText('Judul rapat'), { target: { value: 'Rapat revisi DATA DEMO' } })
    expect(screen.getByText('Belum disimpan')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Simpan draf' }))
    expect(screen.getByText('Menyimpan…', { selector: '.save-indicator' })).toBeInTheDocument()
    expect(vi.mocked(saveMeetingDraft).mock.calls[0][0].starts_at).toBe('2026-09-22T01:00:00.000Z')

    rejectFirst(new Error('Jaringan gagal'))
    expect(await screen.findByText('Gagal ✗')).toBeInTheDocument()
    expect(screen.getByLabelText('Judul rapat')).toHaveValue('Rapat revisi DATA DEMO')
    expect(screen.getByRole('alert')).toHaveTextContent('Jaringan gagal')

    fireEvent.click(screen.getByRole('button', { name: 'Simpan draf' }))
    await waitFor(() => expect(screen.getByText('Tersimpan ✓')).toBeInTheDocument())
    expect(saveMeetingDraft).toHaveBeenCalledTimes(2)
  })
})
