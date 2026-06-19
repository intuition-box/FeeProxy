import { useMemo } from 'react'
import type { Abi } from 'viem'
import { useReadContracts } from 'wagmi'

import { FeeProxyABI, type AffiliateStats } from '../contracts'

import { useAffiliates } from './useAffiliates'
import { useFeeProxyAddress } from './useFeeProxyAddress'

/**
 * Network-wide aggregate stats for the Home hero card. Enumerates affiliates
 * from registration events, then batch-reads each `affiliateStats` and sums
 * the headline figures. No indexer needed; fine for the current scale.
 */
export function useProtocolStats() {
  const { feeProxy, configured } = useFeeProxyAddress()
  const { affiliates, isLoading: listLoading } = useAffiliates()

  const contracts = useMemo(
    () =>
      affiliates.map((a) => ({
        address: feeProxy,
        abi: FeeProxyABI as Abi,
        functionName: 'affiliateStats',
        args: [a.affiliate],
      })),
    [affiliates, feeProxy],
  )

  const { data, isLoading: statsLoading } = useReadContracts({
    contracts: contracts as any,
    query: { enabled: configured && affiliates.length > 0 },
  })

  const agg = useMemo(() => {
    let totalForwarded = 0n
    let totalFees = 0n
    let totalGross = 0n
    let totalTx = 0n
    if (data) {
      for (const r of data) {
        if (r.status === 'success' && r.result) {
          const s = r.result as unknown as AffiliateStats
          totalForwarded += s.totalForwardedAssets
          totalFees += s.totalFees
          totalGross += s.totalGrossAssets
          totalTx += s.txCount
        }
      }
    }
    return { totalForwarded, totalFees, totalGross, totalTx }
  }, [data])

  return {
    affiliateCount: affiliates.length,
    ...agg,
    configured,
    isLoading: listLoading || statsLoading,
  }
}
