/**
 * Framework-agnostic readers for the multi-tenant `FeeProxy` singleton — use
 * them from any environment with a viem PublicClient (Node scripts, Next.js
 * RSC, Cloudflare Workers…). The webapp's wagmi hooks are thin adapters over
 * these; keep the two in sync when adding new reads.
 */

import { getAbiItem } from 'viem'
import type { Address, Hash, PublicClient } from 'viem'

import { FeeProxyABI } from './abis/feeProxy'

/** Per-affiliate fee schedule (mirrors the on-chain `FeeConfig` struct). */
export type FeeConfig = {
  depositBps: bigint
  creationBps: bigint
  depositFixedFee: bigint
  creationFixedFee: bigint
}

/** Protocol-level configuration of the singleton (read live, never snapshotted). */
export type ProtocolConfig = {
  multiVault: Address
  treasury: Address
  maxBps: bigint
  maxFixedFee: bigint
  registrationFee: bigint
  paused: boolean
}

/** A single affiliate's registry row. */
export type AffiliateConfig = {
  fees: FeeConfig
  feeRecipient: Address
  /** Unix seconds of registration; `0n` ⇒ never registered. */
  registeredAt: bigint
  paused: boolean
}

/** Aggregate per-affiliate analytics. */
export type AffiliateStats = {
  txCount: bigint
  uniqueUsers: bigint
  totalGrossAssets: bigint
  totalFees: bigint
  totalForwardedAssets: bigint
  depositCount: bigint
  depositGrossAssets: bigint
  depositFees: bigint
  depositForwardedAssets: bigint
  creationCount: bigint
  creationGrossAssets: bigint
  creationFees: bigint
  creationForwardedAssets: bigint
}

/** Per-affiliate, per-user analytics. */
export type AffiliateUserStats = {
  txCount: bigint
  totalGrossAssets: bigint
  totalFees: bigint
  totalForwardedAssets: bigint
  depositCount: bigint
  depositGrossAssets: bigint
  depositFees: bigint
  depositForwardedAssets: bigint
  creationCount: bigint
  creationGrossAssets: bigint
  creationFees: bigint
  creationForwardedAssets: bigint
}

const abi = FeeProxyABI as any

/**
 * Batch-read the protocol-level config of the singleton.
 *
 * Hybrid dispatch: tries `client.multicall()` first (1 RPC round-trip on
 * chains with Multicall3 — testnet + mainnet), falls back to parallel
 * `readContract` calls otherwise. Both paths return identical data.
 */
export async function readProtocolConfig(
  client: PublicClient,
  feeProxy: Address,
): Promise<ProtocolConfig> {
  const contracts = [
    { abi, address: feeProxy, functionName: 'multiVault' },
    { abi, address: feeProxy, functionName: 'treasury' },
    { abi, address: feeProxy, functionName: 'maxBps' },
    { abi, address: feeProxy, functionName: 'maxFixedFee' },
    { abi, address: feeProxy, functionName: 'registrationFee' },
    { abi, address: feeProxy, functionName: 'paused' },
  ] as const

  let results: readonly unknown[]
  try {
    results = await client.multicall({ allowFailure: false, contracts: contracts as any })
  } catch {
    results = await Promise.all(contracts.map((c) => client.readContract(c as any)))
  }
  const [multiVault, treasury, maxBps, maxFixedFee, registrationFee, paused] = results
  return {
    multiVault: multiVault as Address,
    treasury: treasury as Address,
    maxBps: maxBps as bigint,
    maxFixedFee: maxFixedFee as bigint,
    registrationFee: registrationFee as bigint,
    paused: paused as boolean,
  }
}

/** A single affiliate's registry row. `registeredAt === 0n` ⇒ unregistered. */
export async function readAffiliateConfig(
  client: PublicClient,
  feeProxy: Address,
  affiliate: Address,
): Promise<AffiliateConfig> {
  const raw = (await client.readContract({
    abi,
    address: feeProxy,
    functionName: 'affiliateConfig',
    args: [affiliate],
  })) as AffiliateConfig
  return raw
}

/** Aggregate analytics for an affiliate. Zero-filled if never active. */
export async function readAffiliateStats(
  client: PublicClient,
  feeProxy: Address,
  affiliate: Address,
): Promise<AffiliateStats> {
  return (await client.readContract({
    abi,
    address: feeProxy,
    functionName: 'affiliateStats',
    args: [affiliate],
  })) as AffiliateStats
}

/** Per-user analytics under a given affiliate. */
export async function readAffiliateUserStats(
  client: PublicClient,
  feeProxy: Address,
  affiliate: Address,
  user: Address,
): Promise<AffiliateUserStats> {
  return (await client.readContract({
    abi,
    address: feeProxy,
    functionName: 'affiliateUserStats',
    args: [affiliate, user],
  })) as AffiliateUserStats
}

/** True once an affiliate row exists (registered, possibly paused). */
export async function isAffiliateRegistered(
  client: PublicClient,
  feeProxy: Address,
  affiliate: Address,
): Promise<boolean> {
  return (await client.readContract({
    abi,
    address: feeProxy,
    functionName: 'isAffiliateRegistered',
    args: [affiliate],
  })) as boolean
}

/** True when an affiliate is registered AND not paused (routable). */
export async function isAffiliateActive(
  client: PublicClient,
  feeProxy: Address,
  affiliate: Address,
): Promise<boolean> {
  return (await client.readContract({
    abi,
    address: feeProxy,
    functionName: 'isAffiliateActive',
    args: [affiliate],
  })) as boolean
}

/** Pull-fallback refund owed to `user` (claimable via `claimRefund`). */
export async function readPendingRefund(
  client: PublicClient,
  feeProxy: Address,
  user: Address,
): Promise<bigint> {
  return (await client.readContract({
    abi,
    address: feeProxy,
    functionName: 'pendingRefund',
    args: [user],
  })) as bigint
}

/** AccessControl membership check. Resolve role hashes via {@link feeProxyRoles}. */
export async function hasFeeProxyRole(
  client: PublicClient,
  feeProxy: Address,
  role: `0x${string}`,
  account: Address,
): Promise<boolean> {
  return (await client.readContract({
    abi,
    address: feeProxy,
    functionName: 'hasRole',
    args: [role, account],
  })) as boolean
}

/** A registered affiliate, surfaced from an `AffiliateRegistered` log. */
export type AffiliateRegistration = {
  affiliate: Address
  feeRecipient: Address
  fees: FeeConfig
  registrationFee: bigint
  blockNumber: bigint
  txHash: Hash
}

/**
 * Replay `AffiliateRegistered` events to enumerate every affiliate the
 * singleton has onboarded. Pass `fromBlock` (the singleton's deploy block) to
 * bound the scan; defaults to genesis. The live row (fees, paused) should then
 * be read via {@link readAffiliateConfig} — the event only captures the
 * registration-time snapshot.
 */
export async function fetchAffiliates(
  client: PublicClient,
  feeProxy: Address,
  fromBlock: bigint = 0n,
): Promise<AffiliateRegistration[]> {
  const logs = await client.getLogs({
    address: feeProxy,
    event: getAbiItem({ abi: FeeProxyABI, name: 'AffiliateRegistered' }) as any,
    fromBlock,
    toBlock: 'latest',
  })
  return logs.map((log: any) => ({
    affiliate: log.args.affiliate as Address,
    feeRecipient: log.args.feeRecipient as Address,
    fees: log.args.fees as FeeConfig,
    registrationFee: log.args.registrationFee as bigint,
    blockNumber: log.blockNumber as bigint,
    txHash: log.transactionHash as Hash,
  }))
}
