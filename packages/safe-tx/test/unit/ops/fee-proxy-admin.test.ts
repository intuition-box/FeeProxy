import { describe, expect, it } from 'vitest'
import { decodeFunctionData, getAddress, keccak256, toBytes, toFunctionSelector } from 'viem'
import * as feeProxy from '../../../src/ops/fee-proxy-admin.js'

const FP = getAddress('0xf10D442D0fB934D4037DC30769a6EfCf2f54F7B6')
const AFFILIATE = getAddress('0xc634457aD68b037E2D5aA1C10c3930d7e4E2d551')

const ABI = [
  { type: 'function', name: 'setMaxBps', inputs: [{ type: 'uint256' }], outputs: [], stateMutability: 'nonpayable' },
  { type: 'function', name: 'setMaxFixedFee', inputs: [{ type: 'uint256' }], outputs: [], stateMutability: 'nonpayable' },
  { type: 'function', name: 'setRegistrationFee', inputs: [{ type: 'uint256' }], outputs: [], stateMutability: 'nonpayable' },
  { type: 'function', name: 'pause', inputs: [], outputs: [], stateMutability: 'nonpayable' },
  { type: 'function', name: 'unpause', inputs: [], outputs: [], stateMutability: 'nonpayable' },
  { type: 'function', name: 'pauseAffiliate', inputs: [{ type: 'address' }], outputs: [], stateMutability: 'nonpayable' },
  { type: 'function', name: 'unpauseAffiliate', inputs: [{ type: 'address' }], outputs: [], stateMutability: 'nonpayable' },
  { type: 'function', name: 'grantRole', inputs: [{ type: 'bytes32' }, { type: 'address' }], outputs: [], stateMutability: 'nonpayable' },
  { type: 'function', name: 'revokeRole', inputs: [{ type: 'bytes32' }, { type: 'address' }], outputs: [], stateMutability: 'nonpayable' },
] as const

describe('role identifiers', () => {
  it('DEFAULT_ADMIN_ROLE is the zero bytes32', () => {
    expect(feeProxy.DEFAULT_ADMIN_ROLE).toBe(`0x${'0'.repeat(64)}`)
  })
  it('PAUSER_ROLE is keccak256("PAUSER_ROLE")', () => {
    expect(feeProxy.PAUSER_ROLE).toBe(keccak256(toBytes('PAUSER_ROLE')))
  })
  it('resolveRole maps aliases and raw hashes', () => {
    expect(feeProxy.resolveRole('admin')).toBe(feeProxy.DEFAULT_ADMIN_ROLE)
    expect(feeProxy.resolveRole('pauser')).toBe(feeProxy.PAUSER_ROLE)
    const raw = `0x${'cd'.repeat(32)}`
    expect(feeProxy.resolveRole(raw)).toBe(raw)
    expect(() => feeProxy.resolveRole('owner')).toThrow(/role must be/)
  })
})

describe('fee-proxy-admin AdminOp builders', () => {
  it('setMaxBps', () => {
    const op = feeProxy.setMaxBps(FP, 1000n)
    expect(op.to).toBe(FP)
    expect(op.value).toBe(0n)
    expect(op.data.slice(0, 10)).toBe(toFunctionSelector('setMaxBps(uint256)'))
    const decoded = decodeFunctionData({ abi: ABI, data: op.data })
    expect(decoded.functionName).toBe('setMaxBps')
    expect(decoded.args).toEqual([1000n])
  })

  it('setMaxFixedFee', () => {
    const op = feeProxy.setMaxFixedFee(FP, 10n ** 18n)
    expect(op.data.slice(0, 10)).toBe(toFunctionSelector('setMaxFixedFee(uint256)'))
    expect(decodeFunctionData({ abi: ABI, data: op.data }).args).toEqual([10n ** 18n])
  })

  it('setRegistrationFee', () => {
    const op = feeProxy.setRegistrationFee(FP, 5n * 10n ** 17n)
    expect(op.data.slice(0, 10)).toBe(toFunctionSelector('setRegistrationFee(uint256)'))
    expect(decodeFunctionData({ abi: ABI, data: op.data }).args).toEqual([5n * 10n ** 17n])
  })

  it('pause / unpause take no args', () => {
    expect(feeProxy.pause(FP).data).toBe(toFunctionSelector('pause()'))
    expect(feeProxy.unpause(FP).data).toBe(toFunctionSelector('unpause()'))
  })

  it('pauseAffiliate / unpauseAffiliate', () => {
    const p = feeProxy.pauseAffiliate(FP, AFFILIATE)
    expect(p.data.slice(0, 10)).toBe(toFunctionSelector('pauseAffiliate(address)'))
    expect(decodeFunctionData({ abi: ABI, data: p.data }).args).toEqual([AFFILIATE])

    const u = feeProxy.unpauseAffiliate(FP, AFFILIATE)
    expect(decodeFunctionData({ abi: ABI, data: u.data }).functionName).toBe('unpauseAffiliate')
  })

  it('grantRole / revokeRole', () => {
    const g = feeProxy.grantRole(FP, feeProxy.PAUSER_ROLE, AFFILIATE)
    expect(g.data.slice(0, 10)).toBe(toFunctionSelector('grantRole(bytes32,address)'))
    expect(decodeFunctionData({ abi: ABI, data: g.data }).args).toEqual([feeProxy.PAUSER_ROLE, AFFILIATE])

    const r = feeProxy.revokeRole(FP, feeProxy.DEFAULT_ADMIN_ROLE, AFFILIATE)
    expect(decodeFunctionData({ abi: ABI, data: r.data }).args).toEqual([feeProxy.DEFAULT_ADMIN_ROLE, AFFILIATE])
  })

  it('all builders set value to 0n and target the FeeProxy', () => {
    const ops = [
      feeProxy.setMaxBps(FP, 1n),
      feeProxy.pause(FP),
      feeProxy.pauseAffiliate(FP, AFFILIATE),
      feeProxy.grantRole(FP, feeProxy.PAUSER_ROLE, AFFILIATE),
    ]
    for (const op of ops) {
      expect(op.value).toBe(0n)
      expect(op.to).toBe(FP)
    }
  })
})
