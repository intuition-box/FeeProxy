import { getAddress, type Address, type Hex } from 'viem'
import * as feeProxy from '../ops/fee-proxy-admin.js'
import type { AdminOp } from '../types.js'

/**
 * Declarative registry of every admin op exposed by the CLI. Adding an
 * op is a single entry — the CLI subcommand, flag parsing, and dispatch
 * are derived from this table.
 *
 * All ops target the multi-tenant `FeeProxy` singleton; the `--feeproxy`
 * flag carries its address (falls back to the `FEEPROXY_ADDRESS` env in the
 * command layer).
 */

export type OpFlagType = 'address' | 'bigint' | 'bool' | 'hex' | 'role'

export type OpFlag = {
  name: string
  type: OpFlagType
  description: string
  required: boolean
}

export type OpRegistration = {
  name: string
  category: 'fee-proxy'
  description: string
  flags: OpFlag[]
  build: (args: Record<string, unknown>) => AdminOp
}

const PROXY_FLAG: OpFlag = {
  name: 'feeproxy',
  type: 'address',
  description: 'FeeProxy singleton address',
  required: true,
}

export const OP_REGISTRY: OpRegistration[] = [
  // ----- global config (DEFAULT_ADMIN_ROLE) -----
  {
    name: 'set-max-bps',
    category: 'fee-proxy',
    description: 'Set the protocol-wide bps cap affiliates may charge (base 10000)',
    flags: [PROXY_FLAG, { name: 'value', type: 'bigint', description: 'New cap in basis points (≤ 10000)', required: true }],
    build: ({ feeproxy, value }) => feeProxy.setMaxBps(feeproxy as Address, value as bigint),
  },
  {
    name: 'set-max-fixed-fee',
    category: 'fee-proxy',
    description: 'Set the protocol-wide fixed-fee cap affiliates may charge (TRUST wei)',
    flags: [PROXY_FLAG, { name: 'value', type: 'bigint', description: 'New cap in wei', required: true }],
    build: ({ feeproxy, value }) => feeProxy.setMaxFixedFee(feeproxy as Address, value as bigint),
  },
  {
    name: 'set-registration-fee',
    category: 'fee-proxy',
    description: 'Set the affiliate registration fee (TRUST wei, forwarded to treasury)',
    flags: [PROXY_FLAG, { name: 'value', type: 'bigint', description: 'New registration fee in wei', required: true }],
    build: ({ feeproxy, value }) => feeProxy.setRegistrationFee(feeproxy as Address, value as bigint),
  },

  // ----- global pause (PAUSER_ROLE to pause, DEFAULT_ADMIN_ROLE to unpause) -----
  {
    name: 'pause',
    category: 'fee-proxy',
    description: 'Globally pause routing + registration (PAUSER_ROLE)',
    flags: [PROXY_FLAG],
    build: ({ feeproxy }) => feeProxy.pause(feeproxy as Address),
  },
  {
    name: 'unpause',
    category: 'fee-proxy',
    description: 'Lift the global pause (DEFAULT_ADMIN_ROLE)',
    flags: [PROXY_FLAG],
    build: ({ feeproxy }) => feeProxy.unpause(feeproxy as Address),
  },

  // ----- per-affiliate kill switch -----
  {
    name: 'pause-affiliate',
    category: 'fee-proxy',
    description: 'Pause one affiliate row, blocking its routing (PAUSER_ROLE)',
    flags: [PROXY_FLAG, { name: 'affiliate', type: 'address', description: 'Affiliate address to pause', required: true }],
    build: ({ feeproxy, affiliate }) => feeProxy.pauseAffiliate(feeproxy as Address, affiliate as Address),
  },
  {
    name: 'unpause-affiliate',
    category: 'fee-proxy',
    description: 'Re-enable a paused affiliate row (DEFAULT_ADMIN_ROLE)',
    flags: [PROXY_FLAG, { name: 'affiliate', type: 'address', description: 'Affiliate address to unpause', required: true }],
    build: ({ feeproxy, affiliate }) => feeProxy.unpauseAffiliate(feeproxy as Address, affiliate as Address),
  },

  // ----- role management (AccessControl) -----
  {
    name: 'grant-role',
    category: 'fee-proxy',
    description: 'Grant a role (admin | pauser | 0x<bytes32>) to an account',
    flags: [
      PROXY_FLAG,
      { name: 'role', type: 'role', description: "Role: 'admin', 'pauser', or a 32-byte hash", required: true },
      { name: 'account', type: 'address', description: 'Account to grant the role to', required: true },
    ],
    build: ({ feeproxy, role, account }) => feeProxy.grantRole(feeproxy as Address, role as Hex, account as Address),
  },
  {
    name: 'revoke-role',
    category: 'fee-proxy',
    description: 'Revoke a role (admin | pauser | 0x<bytes32>) from an account',
    flags: [
      PROXY_FLAG,
      { name: 'role', type: 'role', description: "Role: 'admin', 'pauser', or a 32-byte hash", required: true },
      { name: 'account', type: 'address', description: 'Account to revoke the role from', required: true },
    ],
    build: ({ feeproxy, role, account }) => feeProxy.revokeRole(feeproxy as Address, role as Hex, account as Address),
  },
]

export function getOpRegistration(name: string): OpRegistration {
  const def = OP_REGISTRY.find((o) => o.name === name)
  if (!def) {
    throw new Error(
      `safe-tx: unknown op "${name}". Available: ${OP_REGISTRY.map((o) => o.name).join(', ')}`,
    )
  }
  return def
}

export function parseOpFlag(value: string, type: OpFlagType): unknown {
  switch (type) {
    case 'address':
      return getAddress(value)
    case 'bigint':
      return BigInt(value)
    case 'bool':
      if (value === 'true' || value === '1') return true
      if (value === 'false' || value === '0') return false
      throw new Error(`safe-tx: bool flag must be 'true' or 'false', got ${value}`)
    case 'hex':
      if (!/^0x[0-9a-fA-F]*$/.test(value)) {
        throw new Error(`safe-tx: hex flag must be 0x-prefixed hex, got ${value}`)
      }
      return value as Hex
    case 'role':
      return feeProxy.resolveRole(value)
  }
}

export function parseOpFlags(
  def: OpRegistration,
  rawFlags: Record<string, string | undefined>,
): Record<string, unknown> {
  const out: Record<string, unknown> = {}
  for (const flag of def.flags) {
    const raw = rawFlags[flag.name]
    if (raw === undefined) {
      if (flag.required) {
        throw new Error(`safe-tx: missing required flag --${flag.name} for op ${def.name}`)
      }
      continue
    }
    out[flag.name] = parseOpFlag(raw, flag.type)
  }
  return out
}
