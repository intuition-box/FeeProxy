import { FEEPROXY_ADDRESSES, MULTIVAULT_ADDRESSES } from '@intuition-fee-proxy/sdk'
import type { Address } from 'viem'

type Network = 'mainnet' | 'testnet'

export const ZERO_ADDRESS =
  '0x0000000000000000000000000000000000000000' as Address

const DEV_FEEPROXY = import.meta.env.VITE_FEEPROXY_ADDRESS as Address | undefined
const DEV_MULTIVAULT = import.meta.env.VITE_MULTIVAULT_ADDRESS as
  | Address
  | undefined

/**
 * FeeProxy singleton + MultiVault addresses per network. Treasury, caps and
 * the registration fee are read live from the singleton (see
 * `readProtocolConfig` / `useProtocolConfig`) — never snapshotted here.
 *
 * Dev overrides via `VITE_FEEPROXY_ADDRESS` and `VITE_MULTIVAULT_ADDRESS`
 * take precedence on either network when set — point the webapp at a local
 * Anvil-fork deploy without touching the SDK. The .env.local is gitignored.
 *
 * A zero `feeProxy` means "not configured yet": read paths degrade to an
 * empty/"not configured" state and write buttons stay disabled.
 */
export function addressesFor(network: Network): {
  feeProxy: Address
  multiVault: Address
} {
  return {
    feeProxy: (DEV_FEEPROXY ?? FEEPROXY_ADDRESSES[network]) as Address,
    multiVault: (DEV_MULTIVAULT ?? MULTIVAULT_ADDRESSES[network]) as Address,
  }
}

/** True when an address is unset (zero) — used to gate reads/writes. */
export function isZeroAddress(addr: Address | undefined): boolean {
  return !addr || addr.toLowerCase() === ZERO_ADDRESS
}

/** Pick the active network based on the connected chainId (fallback: testnet). */
export function networkFor(chainId: number | undefined): Network {
  return chainId === 1155 ? 'mainnet' : 'testnet'
}
