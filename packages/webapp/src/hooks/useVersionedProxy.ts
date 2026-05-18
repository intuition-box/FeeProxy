import { useEffect, useState } from 'react'
import {
  useBlockNumber,
  usePublicClient,
  useReadContract,
  useReadContracts,
  useWriteContract,
} from 'wagmi'
import {
  getAddress,
  hexToString,
  stringToHex,
  type Address,
  type Hex,
} from 'viem'

import { IntuitionVersionedFeeProxyABI } from '@intuition-fee-proxy/sdk'

const abi = IntuitionVersionedFeeProxyABI as any

export function useProxyVersions(proxy: Address | undefined) {
  const result = useReadContracts({
    contracts: [
      { abi, address: proxy, functionName: 'getVersions' },
      { abi, address: proxy, functionName: 'getDefaultVersion' },
      { abi, address: proxy, functionName: 'proxyAdminCount' },
    ],
    allowFailure: false,
    query: {
      enabled: Boolean(proxy),
      // Auto-poll so the admin count reflects grants/revokes happening
      // from another wallet or tab without forcing the user to refresh.
      refetchInterval: 10_000,
    },
  })

  return {
    ...result,
    versions: (result.data?.[0] as Hex[] | undefined) ?? [],
    defaultVersion: result.data?.[1] as Hex | undefined,
    proxyAdminCount: (result.data?.[2] as bigint | undefined) ?? 0n,
  }
}

/**
 * Cheap 1-read hook for pages that only need the currently-active version
 * label (Explore card, etc.). Avoids the overhead of `useProxyVersions`
 * when the versions list / admin count aren't needed.
 *
 * Decodes the bytes32 to a human-readable label ("v2.0.0"). Empty string
 * if the proxy has no default set yet (shouldn't happen — Factory always
 * registers the initial version).
 */
export function useProxyDefaultVersion(proxy: Address | undefined) {
  const result = useReadContract({
    abi,
    address: proxy,
    functionName: 'getDefaultVersion',
    query: { enabled: Boolean(proxy) },
  })

  const raw = result.data as Hex | undefined
  let label: string | undefined
  if (raw) {
    try {
      label = hexToString(raw, { size: 32 }).replace(/\0+$/, '') || undefined
    } catch {
      label = undefined
    }
  }

  return { ...result, defaultVersion: raw, label }
}

export function useProxyImplementation(
  proxy: Address | undefined,
  version: Hex | undefined,
) {
  return useReadContract({
    abi,
    address: proxy,
    functionName: 'getImplementation',
    args: version ? [version] : undefined,
    query: { enabled: Boolean(proxy && version) },
  })
}

export function useRegisterVersion(proxy: Address | undefined) {
  const { writeContractAsync, data, isPending, error, reset } = useWriteContract()

  function register(version: Hex, implementation: Address) {
    if (!proxy) throw new Error('Proxy address missing')
    return writeContractAsync({
      abi,
      address: proxy,
      functionName: 'registerVersion',
      args: [version, implementation],
    })
  }

  return { register, hash: data, isPending, error, reset }
}

export function useSetDefaultVersion(proxy: Address | undefined) {
  const { writeContractAsync, data, isPending, error, reset } = useWriteContract()

  function setDefault(version: Hex) {
    if (!proxy) throw new Error('Proxy address missing')
    return writeContractAsync({
      abi,
      address: proxy,
      functionName: 'setDefaultVersion',
      args: [version],
    })
  }

  return { setDefault, hash: data, isPending, error, reset }
}

/**
 * Grant or revoke the Role 1 (proxyAdmin) whitelist for an address.
 * Mirrors the Role 2 `setWhitelistedAdmin` pattern — instant, no 2-step
 * ceremony. The contract enforces:
 *  - idempotent reject (revert if status already matches)
 *  - last-admin guard (revert if revoke would empty the whitelist)
 */
export function useSetProxyAdmin(proxy: Address | undefined) {
  const { writeContractAsync, data, isPending, error, reset } = useWriteContract()

  function setProxyAdmin(admin: Address, status: boolean) {
    if (!proxy) throw new Error('Proxy address missing')
    return writeContractAsync({
      abi,
      address: proxy,
      functionName: 'setProxyAdmin',
      args: [admin, status],
    })
  }

  return { setProxyAdmin, hash: data, isPending, error, reset }
}

/**
 * Reconstruct the current proxyAdmin whitelist from the on-chain
 * `ProxyAdminGranted` / `ProxyAdminRevoked` event log. Mirrors the
 * Role 2 `useAdmins` pattern — the contract doesn't expose a getter
 * for the full list, so we reduce events.
 */
export function useProxyAdmins(proxy: Address | undefined) {
  const publicClient = usePublicClient()
  const { data: currentBlock } = useBlockNumber({ watch: true })
  const [admins, setAdmins] = useState<Address[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => {
    if (!publicClient || !proxy || !currentBlock) return
    let cancelled = false
    setIsLoading(true)
    setError(null)
    Promise.all([
      publicClient.getLogs({
        address: proxy,
        event: {
          type: 'event',
          name: 'ProxyAdminGranted',
          inputs: [{ type: 'address', name: 'admin', indexed: true }],
        },
        fromBlock: 0n,
        toBlock: currentBlock,
      }),
      publicClient.getLogs({
        address: proxy,
        event: {
          type: 'event',
          name: 'ProxyAdminRevoked',
          inputs: [{ type: 'address', name: 'admin', indexed: true }],
        },
        fromBlock: 0n,
        toBlock: currentBlock,
      }),
    ])
      .then(([grants, revokes]) => {
        if (cancelled) return
        type LogShape = { args: { admin: Address }; blockNumber: bigint; logIndex: number }
        // Order all events by (block, logIndex) and replay them.
        const events: Array<{ admin: Address; granted: boolean; bn: bigint; li: number }> =
          [
            ...grants.map((l) => {
              const x = l as unknown as LogShape
              return {
                admin: x.args.admin,
                granted: true,
                bn: x.blockNumber,
                li: x.logIndex,
              }
            }),
            ...revokes.map((l) => {
              const x = l as unknown as LogShape
              return {
                admin: x.args.admin,
                granted: false,
                bn: x.blockNumber,
                li: x.logIndex,
              }
            }),
          ].sort((a, b) => (a.bn === b.bn ? a.li - b.li : a.bn < b.bn ? -1 : 1))

        const set = new Set<string>()
        for (const e of events) {
          const a = getAddress(e.admin)
          if (e.granted) set.add(a)
          else set.delete(a)
        }
        setAdmins(Array.from(set) as Address[])
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
  }, [publicClient, proxy, currentBlock ? Number(currentBlock) : 0, refreshKey])

  return { admins, isLoading, error, refetch: () => setRefreshKey((k) => k + 1) }
}

/** Read whether a given address is currently a proxyAdmin. */
export function useIsProxyAdmin(
  proxy: Address | undefined,
  candidate: Address | undefined,
) {
  const result = useReadContract({
    abi,
    address: proxy,
    functionName: 'isProxyAdmin',
    args: candidate ? [candidate] : undefined,
    query: { enabled: Boolean(proxy && candidate) },
  })
  return { ...result, isProxyAdmin: Boolean(result.data) }
}

/** Read the proxy's human-readable name (bytes32, decoded to string). */
export function useProxyName(proxy: Address | undefined) {
  const result = useReadContract({
    abi,
    address: proxy,
    functionName: 'getName',
    query: { enabled: Boolean(proxy) },
  })

  const raw = result.data as Hex | undefined
  const name = (() => {
    if (!raw) return ''
    try {
      return hexToString(raw, { size: 32 }).replace(/\0+$/, '')
    } catch {
      return ''
    }
  })()

  const unsupported = Boolean(result.error)

  return { ...result, name, unsupported }
}

export function useSetProxyName(proxy: Address | undefined) {
  const { writeContractAsync, data, isPending, error, reset } = useWriteContract()

  function setName(newName: string) {
    if (!proxy) throw new Error('Proxy address missing')
    const bytes: Hex = newName
      ? stringToHex(newName, { size: 32 })
      : '0x0000000000000000000000000000000000000000000000000000000000000000'
    return writeContractAsync({
      abi,
      address: proxy,
      functionName: 'setName',
      args: [bytes],
    })
  }

  return { setName, hash: data, isPending, error, reset }
}
