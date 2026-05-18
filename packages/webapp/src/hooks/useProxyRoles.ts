import { useReadContract } from 'wagmi'
import type { Address } from 'viem'

import { IntuitionVersionedFeeProxyABI } from '@intuition-fee-proxy/sdk'

export interface ProxyRoles {
  /** True when the connected wallet is a whitelisted fee admin (Role 2). */
  isFeeAdmin: boolean
  /** True when the connected wallet is in the proxyAdmins whitelist (Role 1). */
  isProxyAdmin: boolean
  /** True when the connected wallet holds both roles simultaneously. */
  hasBothRoles: boolean
  /** True when the connected wallet holds neither role (= read-only view). */
  isViewer: boolean
}

/**
 * Derives the four role booleans from `account` + on-chain
 * `isProxyAdmin(account)` lookup + a precomputed `isFeeAdmin`.
 *
 * Role 1 became a whitelist (post 2-step retirement), so a single
 * `proxyAdmin` address comparison is no longer enough — we hit the
 * contract's `isProxyAdmin(addr)` view.
 */
export function useProxyRoles({
  proxy,
  account,
  isFeeAdmin,
}: {
  proxy: Address | undefined
  account: Address | undefined
  isFeeAdmin: boolean
}): ProxyRoles {
  const result = useReadContract({
    abi: IntuitionVersionedFeeProxyABI as any,
    address: proxy,
    functionName: 'isProxyAdmin',
    args: account ? [account] : undefined,
    query: { enabled: Boolean(proxy && account) },
  })
  const isProxyAdmin = Boolean(result.data)
  const hasBothRoles = isProxyAdmin && isFeeAdmin
  const isViewer = !isFeeAdmin && !isProxyAdmin

  return { isFeeAdmin, isProxyAdmin, hasBothRoles, isViewer }
}
