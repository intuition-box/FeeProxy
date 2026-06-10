import { useEffect } from 'react'

import type { TabId } from '../types'

/**
 * Side-effect: if the connected wallet loses management rights (disconnect or
 * switched to a non-managing account) while on the Manage tab, snap back to
 * Overview. Prevents stale management UI from lingering post-disconnect.
 */
export function useTabAutoSnap({
  canManage,
  tab,
  setTab,
}: {
  canManage: boolean
  tab: TabId
  setTab: (t: TabId) => void
}): void {
  useEffect(() => {
    if (!canManage && tab !== 'overview') {
      setTab('overview')
    }
  }, [canManage, tab, setTab])
}
