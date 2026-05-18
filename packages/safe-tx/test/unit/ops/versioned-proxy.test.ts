import { describe, expect, it } from 'vitest'
import { decodeFunctionData, getAddress, toFunctionSelector } from 'viem'
import * as versionedProxy from '../../../src/ops/versioned-proxy.js'

const PROXY = getAddress('0xf10D442D0fB934D4037DC30769a6EfCf2f54F7B6')
const ADMIN = getAddress('0xc634457aD68b037E2D5aA1C10c3930d7e4E2d551')

const SELECTOR_SET_PROXY_ADMIN = toFunctionSelector('setProxyAdmin(address,bool)')

const ABI = [
  {
    type: 'function',
    name: 'setProxyAdmin',
    inputs: [{ type: 'address' }, { type: 'bool' }],
    outputs: [],
    stateMutability: 'nonpayable',
  },
] as const

describe('versioned-proxy AdminOp builders', () => {
  it('setProxyAdmin grant', () => {
    const op = versionedProxy.setProxyAdmin(PROXY, ADMIN, true)
    expect(op.to).toBe(PROXY)
    expect(op.value).toBe(0n)
    expect(op.data.slice(0, 10)).toBe(SELECTOR_SET_PROXY_ADMIN)
    expect(op.description).toContain('setProxyAdmin')
    const decoded = decodeFunctionData({ abi: ABI, data: op.data })
    expect(decoded.functionName).toBe('setProxyAdmin')
    expect(decoded.args).toEqual([ADMIN, true])
  })

  it('setProxyAdmin revoke', () => {
    const op = versionedProxy.setProxyAdmin(PROXY, ADMIN, false)
    const decoded = decodeFunctionData({ abi: ABI, data: op.data })
    expect(decoded.args).toEqual([ADMIN, false])
  })
})
