import { useChainId } from 'wagmi'
import type { Address } from 'viem'

import { addressesFor, isZeroAddress, networkFor } from '../lib/addresses'

/**
 * Resolve the FeeProxy singleton + MultiVault for the connected chain.
 * `configured` is false when the singleton address is still the zero
 * placeholder — read paths show empty state, write buttons stay disabled.
 */
export function useFeeProxyAddress(): {
  feeProxy: Address
  multiVault: Address
  network: 'mainnet' | 'testnet'
  configured: boolean
} {
  const chainId = useChainId()
  const network = networkFor(chainId)
  const { feeProxy, multiVault } = addressesFor(network)
  return {
    feeProxy,
    multiVault,
    network,
    configured: !isZeroAddress(feeProxy),
  }
}
