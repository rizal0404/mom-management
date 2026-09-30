import { describe, expect, it } from 'vitest'

import {
  getPasswordRecoveryRedirectUrl,
  passwordRecoveryRequestSchema,
  passwordUpdateSchema,
} from './accountPasswordService'

describe('password recovery inputs and redirect target', () => {
  it('trims valid recovery addresses and rejects malformed ones', () => {
    expect(passwordRecoveryRequestSchema.parse({ email: ' member@example.test ' })).toEqual({ email: 'member@example.test' })
    expect(passwordRecoveryRequestSchema.safeParse({ email: 'not-an-email' }).success).toBe(false)
  })

  it('requires a sufficiently long password and matching confirmation', () => {
    expect(passwordUpdateSchema.safeParse({ password: 'short', confirmation: 'short' }).success).toBe(false)
    expect(passwordUpdateSchema.safeParse({ password: 'LongEnough123!', confirmation: 'Different123!' }).success).toBe(false)
    expect(passwordUpdateSchema.safeParse({ password: 'LongEnough123!', confirmation: 'LongEnough123!' }).success).toBe(true)
  })

  it('builds one fixed same-application callback and rejects a path masquerading as an origin', () => {
    expect(getPasswordRecoveryRedirectUrl('https://mom.example')).toBe('https://mom.example/account/password')
    expect(() => getPasswordRecoveryRedirectUrl('https://mom.example/elsewhere')).toThrow('Alamat aplikasi tidak valid.')
  })
})
