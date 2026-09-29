import { describe, expect, it } from 'vitest'

import { loginSchema } from './authService'

describe('loginSchema', () => {
  it('rejects blank credentials before a request is made', () => {
    expect(loginSchema.safeParse({ email: '', password: '' }).success).toBe(false)
  })

  it('accepts a provisioned-account credential shape', () => {
    expect(loginSchema.safeParse({ email: 'anggota-a.demo@mom.local', password: 'DemoPass123!' }).success).toBe(true)
  })
})
