/**
 * FeeProxy singleton + MultiVault addresses per network (vendored from the SDK).
 *
 * One FeeProxy contract per network hosts every affiliate. `treasury`,
 * `multiVault`, `maxBps`, `maxFixedFee` and `registrationFee` are read live from
 * the singleton (see `useProtocolConfig`) — never snapshotted here.
 *
 * A zero `FEEPROXY_ADDRESSES` entry means "not configured yet": read paths
 * degrade to an empty state and write buttons stay disabled. Populate once
 * Intuition publishes the deployed singleton address (or override per-network
 * via `VITE_FEEPROXY_ADDRESS` / `VITE_MULTIVAULT_ADDRESS`).
 */

export type NetworkName = 'mainnet' | 'testnet'

export const MULTIVAULT_ADDRESSES = {
  mainnet: '0x6E35cF57A41fA15eA0EaE9C33e751b01A784Fe7e',
  testnet: '0x2Ece8D4dEdcB9918A398528f3fa4688b1d2CAB91',
} as const satisfies Record<NetworkName, `0x${string}`>

export const FEEPROXY_ADDRESSES = {
  mainnet: '0x0000000000000000000000000000000000000000',
  // Deployed FeeProxy singleton on the Intuition testnet (chain 13579).
  testnet: '0x667cD4eC689dC06dDBCf6BE19d5F0bb2a6c7c792',
} as const satisfies Record<NetworkName, `0x${string}`>
