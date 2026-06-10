import { useReadContracts } from 'wagmi'
import type { Address } from 'viem'

import {
  FeeProxyABI,
  DEFAULT_ADMIN_ROLE,
  PAUSER_ROLE,
} from '@intuition-fee-proxy/sdk'

import { useFeeProxyAddress } from './useFeeProxyAddress'

const abi = FeeProxyABI as any

export interface FeeProxyRoles {
  /** Holds DEFAULT_ADMIN_ROLE — global caps, registration fee, role grants. */
  isAdmin: boolean
  /** Holds PAUSER_ROLE — global pause + per-affiliate pause. */
  isPauser: boolean
  /** Holds either role — gates the admin management surface. */
  hasAnyRole: boolean
  isLoading: boolean
}

/**
 * Resolve the connected `account`'s AccessControl membership on the singleton
 * (DEFAULT_ADMIN_ROLE + PAUSER_ROLE). Disabled when no account / not configured.
 */
export function useFeeProxyRoles(account: Address | undefined): FeeProxyRoles {
  const { feeProxy, configured } = useFeeProxyAddress()
  const enabled = Boolean(configured && account)
  const base = { abi, address: feeProxy } as const

  const { data, isLoading } = useReadContracts({
    contracts: [
      { ...base, functionName: 'hasRole', args: account ? [DEFAULT_ADMIN_ROLE, account] : undefined },
      { ...base, functionName: 'hasRole', args: account ? [PAUSER_ROLE, account] : undefined },
    ],
    allowFailure: false,
    query: { enabled },
  })

  const isAdmin = Boolean(data?.[0])
  const isPauser = Boolean(data?.[1])

  return {
    isAdmin,
    isPauser,
    hasAnyRole: isAdmin || isPauser,
    isLoading: enabled && isLoading,
  }
}
