import { describe, expect, it } from 'vitest'
import { formatWitaDateTimeInput, formatWitaTimestamp, parseWitaDateTimeInput } from './witaDateTime'

describe('waktu rapat WITA', () => {
  it('menyimpan jam lokal WITA sebagai UTC dan membacanya kembali tanpa bergantung zona browser', () => {
    expect(parseWitaDateTimeInput('2026-09-22T09:00')).toBe('2026-09-22T01:00:00.000Z')
    expect(formatWitaDateTimeInput('2026-09-22T01:00:00.000Z')).toBe('2026-09-22T09:00')
  })

  it('mempertahankan batas tengah malam WITA dan nilai kosong', () => {
    expect(formatWitaDateTimeInput('2026-09-21T15:59:00Z')).toBe('2026-09-21T23:59')
    expect(formatWitaDateTimeInput('2026-09-21T16:00:00Z')).toBe('2026-09-22T00:00')
    expect(formatWitaDateTimeInput(null)).toBe('')
  })

  it('menolak tanggal yang tampak sah tetapi tidak ada', () => {
    expect(() => parseWitaDateTimeInput('2026-02-30T09:00')).toThrow('Waktu rapat tidak valid.')
  })

  it('memberi label WITA pada waktu kejadian audit', () => {
    expect(formatWitaTimestamp('2026-09-21T16:00:00Z')).toContain('22 Sep 2026')
    expect(formatWitaTimestamp('2026-09-21T16:00:00Z')).toContain('00.00 WITA')
  })
})
