import { useEffect, useState } from 'react'
import { getAbiItem, type Address, type Hash } from 'viem'
import { usePublicClient } from 'wagmi'

import { FeeProxyABI } from '../contracts'

import { useFeeProxyAddress } from './useFeeProxyAddress'

export type ActivityKind = 'deposit' | 'depositBatch' | 'createAtoms' | 'createTriples'

export type ActivityItem = {
  kind: ActivityKind
  user: Address
  gross: bigint
  fee: bigint
  forwarded: bigint
  /** atom/triple count, or batch legs; undefined for single deposit. */
  count?: bigint
  blockNumber: bigint
  txHash: Hash
}

const ROUTING_EVENTS: { name: string; kind: ActivityKind }[] = [
  { name: 'DepositedVia', kind: 'deposit' },
  { name: 'DepositedBatchVia', kind: 'depositBatch' },
  { name: 'CreatedAtomsVia', kind: 'createAtoms' },
  { name: 'CreatedTriplesVia', kind: 'createTriples' },
]

/**
 * Replay an affiliate's routing events (filtered on the indexed `affiliate`
 * topic) into a flat, block-sorted activity feed. No indexer needed — the
 * events carry user + amounts directly. Returns most-recent-first.
 */
export function useAffiliateActivity(affiliate: Address | undefined) {
  const { feeProxy, configured } = useFeeProxyAddress()
  const publicClient = usePublicClient()
  const [items, setItems] = useState<ActivityItem[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => {
    if (!publicClient || !configured || !affiliate) {
      setItems([])
      return
    }
    let cancelled = false
    setIsLoading(true)
    setError(null)

    Promise.all(
      ROUTING_EVENTS.map(({ name, kind }) =>
        publicClient
          .getLogs({
            address: feeProxy,
            event: getAbiItem({ abi: FeeProxyABI, name }) as any,
            args: { affiliate } as any,
            fromBlock: 0n,
            toBlock: 'latest',
          })
          .then((logs) => logs.map((log) => toItem(kind, log))),
      ),
    )
      .then((batches) => {
        if (cancelled) return
        const merged = batches
          .flat()
          .sort((a, b) => (b.blockNumber > a.blockNumber ? 1 : -1))
        setItems(merged)
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
  }, [publicClient, feeProxy, configured, affiliate, refreshKey])

  return {
    items,
    isLoading,
    error,
    refetch: () => setRefreshKey((k) => k + 1),
  }
}

function toItem(kind: ActivityKind, log: any): ActivityItem {
  const a = log.args as {
    user: Address
    grossAssets?: bigint
    fee?: bigint
    forwardedAssets?: bigint
    totalGrossAssets?: bigint
    totalFee?: bigint
    totalForwardedAssets?: bigint
    atomCount?: bigint
    tripleCount?: bigint
  }
  return {
    kind,
    user: a.user,
    gross: a.grossAssets ?? a.totalGrossAssets ?? 0n,
    fee: a.fee ?? a.totalFee ?? 0n,
    forwarded: a.forwardedAssets ?? a.totalForwardedAssets ?? 0n,
    count: a.atomCount ?? a.tripleCount,
    blockNumber: log.blockNumber as bigint,
    txHash: log.transactionHash as Hash,
  }
}
