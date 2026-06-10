import { useReadContracts } from 'wagmi'
import type { Address } from 'viem'

import { FeeProxyABI, type ProtocolConfig } from '../contracts'

import { useFeeProxyAddress } from './useFeeProxyAddress'

const abi = FeeProxyABI as any

/**
 * Batch-read the protocol-level config of the singleton: multiVault, treasury,
 * caps, registration fee, and global paused flag. Disabled (returns
 * `config: undefined`) when the singleton address is not configured.
 */
export function useProtocolConfig() {
  const { feeProxy, configured } = useFeeProxyAddress()
  const base = { abi, address: feeProxy } as const

  const result = useReadContracts({
    contracts: [
      { ...base, functionName: 'multiVault' },
      { ...base, functionName: 'treasury' },
      { ...base, functionName: 'maxBps' },
      { ...base, functionName: 'maxFixedFee' },
      { ...base, functionName: 'registrationFee' },
      { ...base, functionName: 'paused' },
    ],
    allowFailure: false,
    query: { enabled: configured },
  })

  const config: ProtocolConfig | undefined = result.data
    ? {
        multiVault: result.data[0] as Address,
        treasury: result.data[1] as Address,
        maxBps: result.data[2] as bigint,
        maxFixedFee: result.data[3] as bigint,
        registrationFee: result.data[4] as bigint,
        paused: result.data[5] as boolean,
      }
    : undefined

  return { ...result, config, configured }
}
