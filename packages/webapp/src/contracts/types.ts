/**
 * FeeProxy domain types (vendored from the SDK). Mirror the structs in
 * `IFeeProxy.sol`; numeric fields are `bigint` as decoded by viem.
 */
import type { Address } from 'viem'

/** Per-affiliate fee configuration. Bps are basis points (1 bps = 0.01%). */
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

/** Caller-supplied execution-time fee caps pinned onto a routing call. */
export type FeeGuard = {
  maxFeeBps: bigint
  maxFixedFee: bigint
}
