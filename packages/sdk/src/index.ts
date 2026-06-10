/**
 * Public surface of the @intuition-fee-proxy/sdk package.
 *
 * Thin integration layer for the multi-tenant `FeeProxy` singleton:
 *  - ABI + addresses + chain configs — the foundational pieces consumers
 *    need to read/write the contract.
 *  - Readers (readers.ts) — framework-agnostic helpers that take a viem
 *    PublicClient and return typed data (protocol config, affiliate config,
 *    affiliate analytics, role checks, affiliate enumeration). The webapp's
 *    wagmi hooks are thin adapters over these; other frameworks re-use them.
 *  - Fee math + roles (affiliateFees.ts) — pure helpers mirroring the
 *    on-chain fee formula, FeeGuard construction, and the AccessControl roles.
 *  - MultiVault primitives (caip / term / atom) — unchanged; the singleton
 *    forwards to the same MultiVault.
 *
 * Swappable: when Intuition ships their official SDK, consumers migrate import
 * by import; until then this package is the integration surface.
 */

export * from './addresses'
export * from './chains'
export * from './readers'
export * from './affiliateFees'
export * from './caip'
export * from './term'
export * from './atom'

export { FeeProxyABI } from './abis/feeProxy'
