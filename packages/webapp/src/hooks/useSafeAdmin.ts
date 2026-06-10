import type { Address } from 'viem'
import { useSafeStatus } from './useSafeStatus'

/**
 * Detect whether the connected admin account is a Gnosis Safe. When it is,
 * admin actions are proposed through the Safe (propose + co-sign in Den)
 * instead of being sent as a direct EOA transaction.
 *
 * Returns `safe = undefined` when the account is an EOA / generic contract /
 * still detecting.
 */
export function useSafeAdmin(account: Address | undefined): {
  safe: Address | undefined
  isSafe: boolean
  isLoading: boolean
} {
  const status = useSafeStatus(account)
  const isSafe = status.kind === 'safe'
  return {
    safe: isSafe ? account : undefined,
    isSafe,
    isLoading: status.kind === 'unknown' && Boolean(account),
  }
}
