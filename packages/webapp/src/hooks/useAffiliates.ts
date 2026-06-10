import { useEffect, useState } from 'react'
import { getAbiItem, type Address, type Hash } from 'viem'
import { useBlockNumber, usePublicClient } from 'wagmi'

import { FeeProxyABI, type FeeConfig } from '../contracts'

import { useFeeProxyAddress } from './useFeeProxyAddress'

export type AffiliateRow = {
  affiliate: Address
  feeRecipient: Address
  fees: FeeConfig
  registrationFee: bigint
  blockNumber: bigint
  txHash: Hash
}

/**
 * Enumerate every affiliate the singleton has onboarded by replaying
 * `AffiliateRegistered` logs (mirrors the SDK `fetchAffiliates`, but as a
 * reactive wagmi hook). The live row (paused, current fees) is read per-row
 * via {@link useAffiliate} on the detail/list cards.
 */
export function useAffiliates() {
  const { feeProxy, configured } = useFeeProxyAddress()
  const publicClient = usePublicClient()
  const { data: currentBlock } = useBlockNumber({ watch: true })
  const [affiliates, setAffiliates] = useState<AffiliateRow[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => {
    if (!publicClient || !configured || !currentBlock) {
      setAffiliates([])
      return
    }
    let cancelled = false
    setIsLoading(true)
    setError(null)
    publicClient
      .getLogs({
        address: feeProxy,
        event: getAbiItem({ abi: FeeProxyABI, name: 'AffiliateRegistered' }) as any,
        fromBlock: 0n,
        toBlock: currentBlock,
      })
      .then((logs) => {
        if (cancelled) return
        // Last registration wins if an address somehow re-appears.
        const map = new Map<string, AffiliateRow>()
        for (const log of logs) {
          const args = (log as any).args as {
            affiliate: Address
            feeRecipient: Address
            fees: FeeConfig
            registrationFee: bigint
          }
          map.set(args.affiliate.toLowerCase(), {
            affiliate: args.affiliate,
            feeRecipient: args.feeRecipient,
            fees: args.fees,
            registrationFee: args.registrationFee,
            blockNumber: (log as any).blockNumber as bigint,
            txHash: (log as any).transactionHash as Hash,
          })
        }
        setAffiliates(Array.from(map.values()))
        setIsLoading(false)
      })
      .catch((e) => {
        if (cancelled) return
        setError(e as Error)
        setIsLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [publicClient, feeProxy, configured, currentBlock ? Number(currentBlock) : 0, refreshKey])

  return {
    affiliates,
    isLoading,
    error,
    refetch: () => setRefreshKey((k) => k + 1),
  }
}
