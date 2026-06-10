import { useWriteContract } from 'wagmi'
import type { Address } from 'viem'

import { FeeProxyABI, type FeeConfig } from '@intuition-fee-proxy/sdk'

import { useFeeProxyAddress } from './useFeeProxyAddress'

const abi = FeeProxyABI as any

/** `registerAffiliate(fees, feeRecipient)` — must send exactly `registrationFee`. */
export function useRegisterAffiliate() {
  const { feeProxy, configured } = useFeeProxyAddress()
  const { writeContractAsync, data, isPending, error, reset } = useWriteContract()

  function register(fees: FeeConfig, feeRecipient: Address, registrationFee: bigint) {
    if (!configured) throw new Error('FeeProxy not configured on this network')
    return writeContractAsync({
      abi,
      address: feeProxy,
      functionName: 'registerAffiliate',
      args: [fees, feeRecipient],
      value: registrationFee,
    })
  }

  return { register, hash: data, isPending, error, reset, canWrite: configured }
}

/** `updateAffiliateFees(fees)` — caller's own row. */
export function useUpdateAffiliateFees() {
  const { feeProxy, configured } = useFeeProxyAddress()
  const { writeContractAsync, data, isPending, error, reset } = useWriteContract()

  function update(fees: FeeConfig) {
    if (!configured) throw new Error('FeeProxy not configured on this network')
    return writeContractAsync({
      abi,
      address: feeProxy,
      functionName: 'updateAffiliateFees',
      args: [fees],
    })
  }

  return { update, hash: data, isPending, error, reset, canWrite: configured }
}

/** `updateFeeRecipient(recipient)` — caller's own row. */
export function useUpdateFeeRecipient() {
  const { feeProxy, configured } = useFeeProxyAddress()
  const { writeContractAsync, data, isPending, error, reset } = useWriteContract()

  function update(recipient: Address) {
    if (!configured) throw new Error('FeeProxy not configured on this network')
    return writeContractAsync({
      abi,
      address: feeProxy,
      functionName: 'updateFeeRecipient',
      args: [recipient],
    })
  }

  return { update, hash: data, isPending, error, reset, canWrite: configured }
}
