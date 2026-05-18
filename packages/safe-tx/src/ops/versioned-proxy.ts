import { encodeFunctionData, type Address } from 'viem'
import type { AdminOp } from '../types.js'

/**
 * Admin operations exposed by IntuitionVersionedFeeProxy. Role 1
 * (proxyAdmin) whitelist mutation, mirrors the Role 2
 * `setWhitelistedAdmin` pattern — instant grant/revoke, no 2-step
 * ceremony. The contract enforces last-admin guard + idempotent reject.
 */
const VERSIONED_PROXY_ABI = [
  {
    type: 'function',
    name: 'setProxyAdmin',
    inputs: [
      { name: 'admin', type: 'address' },
      { name: 'status', type: 'bool' },
    ],
    outputs: [],
    stateMutability: 'nonpayable',
  },
] as const

export function setProxyAdmin(
  proxy: Address,
  admin: Address,
  status: boolean,
): AdminOp {
  return {
    to: proxy,
    value: 0n,
    data: encodeFunctionData({
      abi: VERSIONED_PROXY_ABI,
      functionName: 'setProxyAdmin',
      args: [admin, status],
    }),
    description: `setProxyAdmin(${admin}, ${status}) on ${proxy}`,
  }
}
