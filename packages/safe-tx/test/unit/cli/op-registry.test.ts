import { describe, expect, it } from 'vitest'
import { getAddress } from 'viem'
import {
  OP_REGISTRY,
  getOpRegistration,
  parseOpFlag,
  parseOpFlags,
} from '../../../src/cli/op-registry.js'
import { DEFAULT_ADMIN_ROLE, PAUSER_ROLE } from '../../../src/ops/fee-proxy-admin.js'

describe('OP_REGISTRY', () => {
  it('contains 9 fee-proxy ops', () => {
    expect(OP_REGISTRY).toHaveLength(9)
    expect(OP_REGISTRY.every((o) => o.category === 'fee-proxy')).toBe(true)
  })

  it('every op has a unique CLI name', () => {
    const names = OP_REGISTRY.map((o) => o.name)
    expect(new Set(names).size).toBe(names.length)
  })

  it('every op requires the --feeproxy flag', () => {
    for (const op of OP_REGISTRY) {
      const proxyFlag = op.flags.find((f) => f.name === 'feeproxy')
      expect(proxyFlag?.required).toBe(true)
    }
  })

  it('every op has at least one required flag', () => {
    for (const op of OP_REGISTRY) {
      expect(op.flags.some((f) => f.required)).toBe(true)
    }
  })
})

describe('getOpRegistration', () => {
  it('returns the op when it exists', () => {
    const op = getOpRegistration('set-max-bps')
    expect(op.category).toBe('fee-proxy')
  })

  it('throws with the available list when the op is unknown', () => {
    expect(() => getOpRegistration('does-not-exist')).toThrow(/unknown op/)
  })
})

describe('parseOpFlag', () => {
  it('address', () => {
    const result = parseOpFlag('0xf10d442d0fb934d4037dc30769a6efcf2f54f7b6', 'address')
    expect(result).toBe(getAddress('0xf10d442d0fb934d4037dc30769a6efcf2f54f7b6'))
  })

  it('bigint', () => {
    expect(parseOpFlag('1000000000000000000', 'bigint')).toBe(10n ** 18n)
  })

  it('hex passes through valid hex', () => {
    expect(parseOpFlag('0xdeadbeef', 'hex')).toBe('0xdeadbeef')
  })

  it('hex throws on non-hex', () => {
    expect(() => parseOpFlag('not-hex', 'hex')).toThrow(/hex flag/)
  })

  it('role resolves the admin alias to zero bytes32', () => {
    expect(parseOpFlag('admin', 'role')).toBe(DEFAULT_ADMIN_ROLE)
  })

  it('role resolves the pauser alias to keccak256("PAUSER_ROLE")', () => {
    expect(parseOpFlag('pauser', 'role')).toBe(PAUSER_ROLE)
  })

  it('role passes through a raw 32-byte hash', () => {
    const raw = `0x${'ab'.repeat(32)}`
    expect(parseOpFlag(raw, 'role')).toBe(raw)
  })

  it('role throws on garbage', () => {
    expect(() => parseOpFlag('superuser', 'role')).toThrow(/role must be/)
  })
})

describe('parseOpFlags', () => {
  it('returns parsed args for a valid op', () => {
    const def = getOpRegistration('set-max-bps')
    const parsed = parseOpFlags(def, {
      feeproxy: '0xf10d442d0fb934d4037dc30769a6efcf2f54f7b6',
      value: '500',
    })
    expect(parsed.value).toBe(500n)
    expect(parsed.feeproxy).toBe(getAddress('0xf10d442d0fb934d4037dc30769a6efcf2f54f7b6'))
  })

  it('throws on missing required flag', () => {
    const def = getOpRegistration('set-max-bps')
    expect(() => parseOpFlags(def, { feeproxy: '0xf10d442d0fb934d4037dc30769a6efcf2f54f7b6' })).toThrow(
      /missing required flag --value/,
    )
  })

  it('every registered op builds a valid AdminOp with sample inputs', () => {
    const sample: Record<string, unknown> = {
      feeproxy: getAddress('0xf10D442D0fB934D4037DC30769a6EfCf2f54F7B6'),
      affiliate: getAddress('0xc634457aD68b037E2D5aA1C10c3930d7e4E2d551'),
      account: getAddress('0xc634457aD68b037E2D5aA1C10c3930d7e4E2d551'),
      role: PAUSER_ROLE,
      value: 100n,
    }
    for (const op of OP_REGISTRY) {
      const adminOp = op.build(sample)
      expect(adminOp.value).toBe(0n)
      expect(adminOp.data).toMatch(/^0x[0-9a-f]+$/)
      expect(adminOp.description.length).toBeGreaterThan(0)
    }
  })
})
