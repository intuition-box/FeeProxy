import type { Address as AddressType } from 'viem'
import { useChainId } from 'wagmi'

import { useAffiliateActivity, type ActivityKind } from '../hooks/useAffiliateActivity'
import { TX_EXPLORER_BY_CHAIN } from '../lib/explorers'
import { formatTrust } from '../lib/format'
import AddressView from './Address'
import { Spinner } from './Spinner'

const KIND_LABEL: Record<ActivityKind, string> = {
  deposit: 'Deposit',
  depositBatch: 'Deposit (batch)',
  createAtoms: 'Create atoms',
  createTriples: 'Create triples',
}

/**
 * Recent routing activity through an affiliate, replayed from the indexed
 * `affiliate` event topic. Most-recent-first.
 */
export function ActivityFeed({ affiliate }: { affiliate: AddressType }) {
  const chainId = useChainId()
  const explorer = TX_EXPLORER_BY_CHAIN[chainId]
  const { items, isLoading } = useAffiliateActivity(affiliate)

  return (
    <section className="space-y-4">
      <h2 className="font-semibold text-ink">Activity</h2>

      {isLoading && (
        <div className="text-sm text-muted inline-flex items-center gap-2">
          <Spinner /> Scanning events…
        </div>
      )}

      {!isLoading && items.length === 0 && (
        <p className="text-sm text-muted">
          No routed activity yet. It appears here as soon as a dApp routes a
          deposit or creation through your affiliate id.
        </p>
      )}

      {!isLoading && items.length > 0 && (
        <div className="overflow-x-auto rounded-lg border border-line">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-line text-left text-[11px] uppercase tracking-wider text-subtle">
                <th className="px-3 py-2 font-medium">Type</th>
                <th className="px-3 py-2 font-medium">User</th>
                <th className="px-3 py-2 font-medium text-right">Gross</th>
                <th className="px-3 py-2 font-medium text-right">Fee</th>
                <th className="px-3 py-2 font-medium text-right">Block</th>
              </tr>
            </thead>
            <tbody>
              {items.map((it) => (
                <tr
                  key={`${it.txHash}-${it.kind}-${it.user}`}
                  className="border-b border-line/60 last:border-0"
                >
                  <td className="px-3 py-2 text-ink">
                    {KIND_LABEL[it.kind]}
                    {it.count !== undefined && (
                      <span className="text-subtle"> ×{it.count.toString()}</span>
                    )}
                  </td>
                  <td className="px-3 py-2">
                    <AddressView value={it.user} variant="short" />
                  </td>
                  <td className="px-3 py-2 text-right text-muted">
                    {formatTrust(it.gross)}
                  </td>
                  <td className="px-3 py-2 text-right text-ink">
                    {formatTrust(it.fee)}
                  </td>
                  <td className="px-3 py-2 text-right">
                    {explorer ? (
                      <a
                        href={`${explorer}/tx/${it.txHash}`}
                        target="_blank"
                        rel="noreferrer"
                        className="font-mono text-xs text-subtle hover:text-brand"
                      >
                        {it.blockNumber.toString()}
                      </a>
                    ) : (
                      <span className="font-mono text-xs text-subtle">
                        {it.blockNumber.toString()}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}
