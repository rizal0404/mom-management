import { describe, expect, it } from 'vitest'
import { evidencePath, validateEvidence } from './evidenceService'

describe('evidence validation', () => {
  it('rejects empty, oversized, executable and mismatched files', () => {
    for (const file of [
      { name: 'empty.pdf', size: 0, type: 'application/pdf' },
      { name: 'big.pdf', size: 10485761, type: 'application/pdf' },
      { name: 'app.exe', size: 1, type: 'application/octet-stream' },
      { name: 'fake.pdf', size: 10, type: 'text/html' },
    ]) expect(() => validateEvidence(file)).toThrow()
  })
  it('accepts supported files at the size boundary and empty browser MIME', () => {
    expect(validateEvidence({ name: 'Evidence.PDF', size: 10485760, type: '' })).toBe('application/pdf')
  })
  it('keeps uploaded names inside the target folder and unique on each selection', () => {
    const a = evidencePath('meetings', 'target', '../../bukti 日本.pdf')
    expect(a.split('/')).toHaveLength(3)
    expect(a).toMatch(/\.pdf$/)
    expect(a).not.toBe(evidencePath('meetings', 'target', '../../bukti 日本.pdf'))
  })
})
