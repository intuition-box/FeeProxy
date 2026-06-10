export type NetworkName = 'mainnet' | 'testnet'

export const MULTIVAULT_ADDRESSES = {
  mainnet: '0x6E35cF57A41fA15eA0EaE9C33e751b01A784Fe7e',
  testnet: '0x2Ece8D4dEdcB9918A398528f3fa4688b1d2CAB91',
} as const satisfies Record<NetworkName, `0x${string}`>

/**
 * Address of the multi-tenant `FeeProxy` singleton per network.
 *
 * One contract per network hosts every affiliate. `treasury`, `multiVault`,
 * `maxBps`, `maxFixedFee` and `registrationFee` are read live from this
 * address (see {@link readProtocolConfig}) — never snapshotted here, so the
 * SDK can't drift from on-chain state.
 *
 * The zero address means "not configured yet"; the webapp degrades gracefully
 * (read paths return empty, write paths stay disabled). Populate each entry
 * once Intuition publishes the deployed singleton address.
 */
export const FEEPROXY_ADDRESSES = {
  mainnet: '0x0000000000000000000000000000000000000000',
  testnet: '0x0000000000000000000000000000000000000000',
} as const satisfies Record<NetworkName, `0x${string}`>
