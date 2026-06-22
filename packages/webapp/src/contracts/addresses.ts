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
  // Upgraded testnet MultiVault (on-behalf-of / createAtomsFor surface).
  testnet: '0xeC6BdEb8BCc083ceCc1E73efDd463Be4443AbD9d',
} as const satisfies Record<NetworkName, `0x${string}`>

export const FEEPROXY_ADDRESSES = {
  mainnet: '0x0000000000000000000000000000000000000000',
  // Intuition's official FeeProxy singleton on the testnet (chain 13579),
  // wired to the upgraded MultiVault — routing (depositVia/createAtomsVia) works.
  testnet: '0x15458457aC9009BB83137025E5D228A0783207d7',
} as const satisfies Record<NetworkName, `0x${string}`>
