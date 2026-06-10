import { encodeFunctionData, keccak256, toBytes, type Address, type Hex } from 'viem'
import type { AdminOp } from '../types.js'

/**
 * Protocol-admin operations on the multi-tenant `FeeProxy` singleton.
 *
 * The singleton uses OpenZeppelin AccessControl: the global config setters and
 * `pauseAffiliate`/`unpause` are gated on `DEFAULT_ADMIN_ROLE`, while `pause`
 * and `pauseAffiliate` are gated on `PAUSER_ROLE`. These builders produce the
 * `AdminOp` (target + calldata) a Safe owner proposes; the Safe holding the
 * role co-signs and executes.
 *
 * There is no `withdraw` here: affiliate fees are pushed to each affiliate's
 * `feeRecipient` at routing time, and the registration fee is forwarded to the
 * `treasury` — the singleton never accrues a withdrawable balance.
 */

/** Zero bytes32 — OpenZeppelin's `DEFAULT_ADMIN_ROLE`. */
export const DEFAULT_ADMIN_ROLE =
  '0x0000000000000000000000000000000000000000000000000000000000000000' as Hex
/** `keccak256("PAUSER_ROLE")`. */
export const PAUSER_ROLE = keccak256(toBytes('PAUSER_ROLE'))

/**
 * Resolve a role flag into a bytes32. Accepts the friendly aliases
 * `admin` / `pauser`, or a raw 0x-prefixed 32-byte hash.
 */
export function resolveRole(value: string): Hex {
  const v = value.toLowerCase()
  if (v === 'admin' || v === 'default_admin_role') return DEFAULT_ADMIN_ROLE
  if (v === 'pauser' || v === 'pauser_role') return PAUSER_ROLE
  if (/^0x[0-9a-f]{64}$/.test(v)) return value as Hex
  throw new Error(
    `safe-tx: role must be 'admin', 'pauser', or a 32-byte 0x hash, got ${value}`,
  )
}

const FEE_PROXY_ADMIN_ABI = [
  { type: 'function', name: 'setMaxBps', inputs: [{ name: 'newMaxBps', type: 'uint256' }], outputs: [], stateMutability: 'nonpayable' },
  { type: 'function', name: 'setMaxFixedFee', inputs: [{ name: 'newMaxFixedFee', type: 'uint256' }], outputs: [], stateMutability: 'nonpayable' },
  { type: 'function', name: 'setRegistrationFee', inputs: [{ name: 'newRegistrationFee', type: 'uint256' }], outputs: [], stateMutability: 'nonpayable' },
  { type: 'function', name: 'pause', inputs: [], outputs: [], stateMutability: 'nonpayable' },
  { type: 'function', name: 'unpause', inputs: [], outputs: [], stateMutability: 'nonpayable' },
  { type: 'function', name: 'pauseAffiliate', inputs: [{ name: 'affiliate', type: 'address' }], outputs: [], stateMutability: 'nonpayable' },
  { type: 'function', name: 'unpauseAffiliate', inputs: [{ name: 'affiliate', type: 'address' }], outputs: [], stateMutability: 'nonpayable' },
  { type: 'function', name: 'grantRole', inputs: [{ name: 'role', type: 'bytes32' }, { name: 'account', type: 'address' }], outputs: [], stateMutability: 'nonpayable' },
  { type: 'function', name: 'revokeRole', inputs: [{ name: 'role', type: 'bytes32' }, { name: 'account', type: 'address' }], outputs: [], stateMutability: 'nonpayable' },
] as const

function op(feeProxy: Address, functionName: string, args: readonly unknown[], description: string): AdminOp {
  return {
    to: feeProxy,
    value: 0n,
    data: encodeFunctionData({ abi: FEE_PROXY_ADMIN_ABI, functionName: functionName as any, args: args as any }),
    description,
  }
}

export function setMaxBps(feeProxy: Address, newMaxBps: bigint): AdminOp {
  return op(feeProxy, 'setMaxBps', [newMaxBps], `setMaxBps(${newMaxBps}) on ${feeProxy}`)
}

export function setMaxFixedFee(feeProxy: Address, newMaxFixedFee: bigint): AdminOp {
  return op(feeProxy, 'setMaxFixedFee', [newMaxFixedFee], `setMaxFixedFee(${newMaxFixedFee} wei) on ${feeProxy}`)
}

export function setRegistrationFee(feeProxy: Address, newRegistrationFee: bigint): AdminOp {
  return op(feeProxy, 'setRegistrationFee', [newRegistrationFee], `setRegistrationFee(${newRegistrationFee} wei) on ${feeProxy}`)
}

export function pause(feeProxy: Address): AdminOp {
  return op(feeProxy, 'pause', [], `pause() on ${feeProxy}`)
}

export function unpause(feeProxy: Address): AdminOp {
  return op(feeProxy, 'unpause', [], `unpause() on ${feeProxy}`)
}

export function pauseAffiliate(feeProxy: Address, affiliate: Address): AdminOp {
  return op(feeProxy, 'pauseAffiliate', [affiliate], `pauseAffiliate(${affiliate}) on ${feeProxy}`)
}

export function unpauseAffiliate(feeProxy: Address, affiliate: Address): AdminOp {
  return op(feeProxy, 'unpauseAffiliate', [affiliate], `unpauseAffiliate(${affiliate}) on ${feeProxy}`)
}

export function grantRole(feeProxy: Address, role: Hex, account: Address): AdminOp {
  return op(feeProxy, 'grantRole', [role, account], `grantRole(${role}, ${account}) on ${feeProxy}`)
}

export function revokeRole(feeProxy: Address, role: Hex, account: Address): AdminOp {
  return op(feeProxy, 'revokeRole', [role, account], `revokeRole(${role}, ${account}) on ${feeProxy}`)
}
