/**
 * Fee math + role helpers for the `FeeProxy` singleton.
 *
 * The routing entry points (`depositVia` / `createAtomsVia` / …) take a caller
 * `FeeGuard {maxFeeBps, maxFixedFee}` as front-run protection: if the
 * affiliate's configured fee exceeds the guard at execution time the tx
 * reverts (`FeeProxy_BpsExceedsCallerGuard` / `…FixedFeeExceedsCallerGuard`).
 * Build that guard from the affiliate's live fees with {@link buildFeeGuard}.
 */
import { keccak256, toBytes } from 'viem'
import type { Address, PublicClient } from 'viem'

import { FeeProxyABI } from './abis/feeProxy'

/** Basis-points denominator — `1 bps = 0.01%`, `10_000 = 100%`. Mirrors on-chain. */
export const BPS_DIVISOR = 10_000n

/** AccessControl role identifiers on the singleton. */
export const DEFAULT_ADMIN_ROLE =
  '0x0000000000000000000000000000000000000000000000000000000000000000' as const
export const PAUSER_ROLE = keccak256(toBytes('PAUSER_ROLE'))

/** Named lookup for the two roles the contract defines. */
export const feeProxyRoles = {
  admin: DEFAULT_ADMIN_ROLE,
  pauser: PAUSER_ROLE,
} as const

/** Caller-supplied execution-time caps pinned onto a routing call. */
export type FeeGuard = {
  /** Max bps (base 10000) accepted from the affiliate's configured fee. */
  maxFeeBps: bigint
  /** Max fixed fee (TRUST wei) accepted from the affiliate's configured fee. */
  maxFixedFee: bigint
}

/** One side of an affiliate's fee schedule (deposit OR creation). */
export type SideFees = {
  bps: bigint
  fixedFee: bigint
}

/**
 * Per-call fee, mirroring the contract's `_calcFee`:
 *   fee = grossAssets * bps / 10000 + fixedFee
 * No `fee < grossAssets` invariant is applied here — the contract enforces it
 * at execution time (`FeeProxy_FeeExceedsGross`).
 */
export function calcFee(grossAssets: bigint, bps: bigint, fixedFee: bigint): bigint {
  return (grossAssets * bps) / BPS_DIVISOR + fixedFee
}

/**
 * Build a {@link FeeGuard} from an affiliate's live side fees, tolerating a
 * relative bump of `bufferBps / 10000` on each axis. `bufferBps = 0n` is
 * strict (any affiliate fee bump in the same block reverts the routing tx).
 *
 * Example: `bufferBps = 1000n` (10%) over a live 500-bps fee → guard of 550 bps.
 */
export function buildFeeGuard(live: SideFees, bufferBps: bigint = 0n): FeeGuard {
  return {
    maxFeeBps: live.bps + (live.bps * bufferBps) / BPS_DIVISOR,
    maxFixedFee: live.fixedFee + (live.fixedFee * bufferBps) / BPS_DIVISOR,
  }
}

const abi = FeeProxyABI as any

/** On-chain preview of the deposit-side fee for an affiliate. */
export async function previewDepositFee(
  client: PublicClient,
  feeProxy: Address,
  affiliate: Address,
  grossAssets: bigint,
): Promise<{ fee: bigint; forwarded: bigint }> {
  const [fee, forwarded] = (await client.readContract({
    abi,
    address: feeProxy,
    functionName: 'previewDepositFee',
    args: [affiliate, grossAssets],
  })) as [bigint, bigint]
  return { fee, forwarded }
}

/** On-chain preview of the creation-side fee for an affiliate. */
export async function previewCreationFee(
  client: PublicClient,
  feeProxy: Address,
  affiliate: Address,
  grossAssets: bigint,
): Promise<{ fee: bigint; forwarded: bigint }> {
  const [fee, forwarded] = (await client.readContract({
    abi,
    address: feeProxy,
    functionName: 'previewCreationFee',
    args: [affiliate, grossAssets],
  })) as [bigint, bigint]
  return { fee, forwarded }
}
