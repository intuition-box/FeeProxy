import { describe, expect, test } from 'bun:test'
import { keccak256, toBytes } from 'viem'

import {
  BPS_DIVISOR,
  DEFAULT_ADMIN_ROLE,
  PAUSER_ROLE,
  buildFeeGuard,
  calcFee,
} from './affiliateFees'

describe('calcFee', () => {
  test('applies bps then adds the fixed fee (mirrors _calcFee)', () => {
    // 1 TRUST gross, 500 bps (5%) + 0.1 TRUST fixed
    const gross = 10n ** 18n
    const fee = calcFee(gross, 500n, 10n ** 17n)
    expect(fee).toBe((gross * 500n) / BPS_DIVISOR + 10n ** 17n)
    expect(fee).toBe(5n * 10n ** 16n + 10n ** 17n)
  })

  test('floors bps division like integer math on-chain', () => {
    // 3 wei * 1 bps / 10000 = 0 (floored), plus 0 fixed
    expect(calcFee(3n, 1n, 0n)).toBe(0n)
  })

  test('zero fee config yields zero', () => {
    expect(calcFee(10n ** 18n, 0n, 0n)).toBe(0n)
  })
})

describe('buildFeeGuard', () => {
  test('strict guard (no buffer) equals the live fees', () => {
    const guard = buildFeeGuard({ bps: 500n, fixedFee: 10n ** 17n })
    expect(guard.maxFeeBps).toBe(500n)
    expect(guard.maxFixedFee).toBe(10n ** 17n)
  })

  test('buffered guard tolerates a relative bump on both axes', () => {
    // 10% buffer over 500 bps → 550 bps; over 1 TRUST → 1.1 TRUST
    const guard = buildFeeGuard({ bps: 500n, fixedFee: 10n ** 18n }, 1000n)
    expect(guard.maxFeeBps).toBe(550n)
    expect(guard.maxFixedFee).toBe(11n * 10n ** 17n)
  })
})

describe('role identifiers', () => {
  test('DEFAULT_ADMIN_ROLE is the zero bytes32', () => {
    expect(DEFAULT_ADMIN_ROLE).toBe(`0x${'0'.repeat(64)}`)
  })

  test('PAUSER_ROLE is keccak256("PAUSER_ROLE")', () => {
    expect(PAUSER_ROLE).toBe(keccak256(toBytes('PAUSER_ROLE')))
  })
})
