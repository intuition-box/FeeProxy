import { useReadContracts } from 'wagmi'
import type { Address } from 'viem'

import {
  FeeProxyABI,
  type AffiliateConfig,
  type AffiliateStats,
} from '../contracts'

import { useFeeProxyAddress } from './useFeeProxyAddress'

const abi = FeeProxyABI as any

/**
 * Read a single affiliate's registry row (config) + aggregate analytics
 * (stats) from the singleton. `registered` is derived from `registeredAt`.
 */
export function useAffiliate(affiliate: Address | undefined) {
  const { feeProxy, configured } = useFeeProxyAddress()
  const enabled = Boolean(configured && affiliate)
  const base = { abi, address: feeProxy } as const

  const result = useReadContracts({
    contracts: [
      {
        ...base,
        functionName: 'affiliateConfig',
        args: affiliate ? [affiliate] : undefined,
      },
      {
        ...base,
        functionName: 'affiliateStats',
        args: affiliate ? [affiliate] : undefined,
      },
    ],
    allowFailure: false,
    query: { enabled },
  })

  const config = result.data?.[0] as AffiliateConfig | undefined
  const stats = result.data?.[1] as AffiliateStats | undefined
  const registered = Boolean(config && config.registeredAt > 0n)

  return { ...result, config, stats, registered }
}
