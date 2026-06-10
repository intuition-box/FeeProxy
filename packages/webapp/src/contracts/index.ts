/**
 * Vendored FeeProxy contract surface — ABI, addresses, chains and domain types.
 *
 * The webapp works against the audited interface ABI only; the
 * `@intuition-fee-proxy/sdk` package is reintegrated later. Import everything
 * contract-related from here (`../contracts`) so there is a single swap point
 * when the SDK / compiled artifact lands.
 */
export { FeeProxyABI } from './feeProxyAbi'
export { INTUITION_MAINNET, INTUITION_TESTNET } from './chains'
export {
  MULTIVAULT_ADDRESSES,
  FEEPROXY_ADDRESSES,
  type NetworkName,
} from './addresses'
export type {
  FeeConfig,
  ProtocolConfig,
  AffiliateConfig,
  AffiliateStats,
  AffiliateUserStats,
  FeeGuard,
} from './types'
