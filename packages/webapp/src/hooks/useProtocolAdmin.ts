import { encodeFunctionData, type Address, type Hex } from 'viem'
import { useWriteContract } from 'wagmi'

import { FeeProxyABI, feeProxyRoles } from '@intuition-fee-proxy/sdk'
import { type AdminOp } from '@intuition-fee-proxy/safe-tx'

import { useFeeProxyAddress } from './useFeeProxyAddress'

const abi = FeeProxyABI as any

export type RoleName = 'admin' | 'pauser'

/**
 * A protocol-admin action on the singleton, parameter-typed. Each maps to a
 * single FeeProxy admin function; `useProtocolAdmin` turns one into either a
 * direct EOA tx or a Safe `AdminOp` for the propose flow.
 */
export type AdminAction =
  | { kind: 'setMaxBps'; value: bigint }
  | { kind: 'setMaxFixedFee'; value: bigint }
  | { kind: 'setRegistrationFee'; value: bigint }
  | { kind: 'pause' }
  | { kind: 'unpause' }
  | { kind: 'pauseAffiliate'; affiliate: Address }
  | { kind: 'unpauseAffiliate'; affiliate: Address }
  | { kind: 'grantRole'; role: RoleName; account: Address }
  | { kind: 'revokeRole'; role: RoleName; account: Address }

function actionToCall(action: AdminAction): {
  functionName: string
  args: readonly unknown[]
  description: string
} {
  switch (action.kind) {
    case 'setMaxBps':
      return { functionName: 'setMaxBps', args: [action.value], description: `setMaxBps(${action.value})` }
    case 'setMaxFixedFee':
      return { functionName: 'setMaxFixedFee', args: [action.value], description: `setMaxFixedFee(${action.value})` }
    case 'setRegistrationFee':
      return { functionName: 'setRegistrationFee', args: [action.value], description: `setRegistrationFee(${action.value})` }
    case 'pause':
      return { functionName: 'pause', args: [], description: 'pause()' }
    case 'unpause':
      return { functionName: 'unpause', args: [], description: 'unpause()' }
    case 'pauseAffiliate':
      return { functionName: 'pauseAffiliate', args: [action.affiliate], description: `pauseAffiliate(${action.affiliate})` }
    case 'unpauseAffiliate':
      return { functionName: 'unpauseAffiliate', args: [action.affiliate], description: `unpauseAffiliate(${action.affiliate})` }
    case 'grantRole':
      return { functionName: 'grantRole', args: [feeProxyRoles[action.role], action.account], description: `grantRole(${action.role}, ${action.account})` }
    case 'revokeRole':
      return { functionName: 'revokeRole', args: [feeProxyRoles[action.role], action.account], description: `revokeRole(${action.role}, ${action.account})` }
  }
}

/**
 * Protocol-admin write surface for the singleton. Build a Safe {@link AdminOp}
 * with `buildOp` (routed through useSafePropose when the admin is a Safe) or
 * send a direct EOA tx with `writeDirect`.
 */
export function useProtocolAdmin() {
  const { feeProxy, configured } = useFeeProxyAddress()
  const { writeContractAsync, data, isPending, error, reset } = useWriteContract()

  function buildOp(action: AdminAction): AdminOp {
    const { functionName, args, description } = actionToCall(action)
    return {
      to: feeProxy,
      value: 0n,
      data: encodeFunctionData({ abi, functionName: functionName as any, args: args as any }) as Hex,
      description: `${description} on ${feeProxy}`,
    }
  }

  function writeDirect(action: AdminAction) {
    if (!configured) throw new Error('FeeProxy not configured on this network')
    const { functionName, args } = actionToCall(action)
    return writeContractAsync({
      abi,
      address: feeProxy,
      functionName: functionName as any,
      args: args as any,
    })
  }

  return { buildOp, writeDirect, hash: data, isPending, error, reset, canWrite: configured }
}
