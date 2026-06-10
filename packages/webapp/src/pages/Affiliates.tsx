import { Link } from 'react-router-dom'

import { useAffiliates, type AffiliateRow } from '../hooks/useAffiliates'
import { useAffiliate } from '../hooks/useAffiliate'
import { useFeeProxyAddress } from '../hooks/useFeeProxyAddress'
import Address from '../components/Address'
import { Spinner } from '../components/Spinner'
import { formatDateParts, formatTrust } from '../lib/format'

export default function AffiliatesPage() {
  const { configured } = useFeeProxyAddress()
  const { affiliates, isLoading, error, refetch } = useAffiliates()

  return (
    <div className="space-y-8">
      <header className="flex items-end justify-between gap-4 flex-wrap">
        <div className="space-y-2">
          <div className="text-[11px] font-medium uppercase tracking-wider text-brand">
            Directory
          </div>
          <h1 className="text-3xl font-semibold tracking-tight text-ink">Affiliates</h1>
          <p className="text-sm text-muted">
            Every dApp registered on the FeeProxy singleton, reconstructed from
            on-chain registration events.
          </p>
        </div>
        <button
          type="button"
          onClick={refetch}
          disabled={isLoading || !configured}
          className="text-[11px] text-muted hover:text-ink transition-colors disabled:opacity-50"
        >
          Refresh
        </button>
      </header>

      {!configured && (
        <div className="rounded-lg border border-amber-400/30 bg-amber-400/5 px-4 py-3 text-sm text-amber-300">
          The FeeProxy singleton is not configured on this network yet.
        </div>
      )}

      {error && (
        <p className="text-sm font-mono text-rose-400">Failed to load: {error.message}</p>
      )}

      {configured && isLoading && affiliates.length === 0 && (
        <div className="text-sm text-muted inline-flex items-center gap-2">
          <Spinner /> Loading affiliates…
        </div>
      )}

      {configured && !isLoading && affiliates.length === 0 && !error && (
        <p className="text-sm text-subtle border-l-2 border-line pl-3">
          No affiliates registered yet.
        </p>
      )}

      {affiliates.length > 0 && (
        <ul className="grid gap-3">
          {affiliates.map((row) => (
            <AffiliateListRow key={row.affiliate} row={row} />
          ))}
        </ul>
      )}
    </div>
  )
}

function AffiliateListRow({ row }: { row: AffiliateRow }) {
  const { config, stats } = useAffiliate(row.affiliate)
  const reg = formatDateParts(Number(config?.registeredAt ?? 0n))

  return (
    <li>
      <Link
        to={`/affiliate/${row.affiliate}`}
        className="card flex items-center justify-between gap-4 hover:border-line-strong transition-colors"
      >
        <div className="min-w-0 space-y-1">
          <div className="flex items-center gap-2">
            <Address value={row.affiliate} variant="short" copy={false} />
            {config?.paused && (
              <span className="text-[10px] font-mono uppercase tracking-wider text-rose-400 border border-rose-400/40 rounded px-1.5 py-0.5">
                Paused
              </span>
            )}
          </div>
          <div className="text-[11px] text-subtle inline-flex items-center gap-1.5">
            <span>recipient</span>
            <Address value={row.feeRecipient} variant="short" copy={false} />
            {config && config.registeredAt > 0n && (
              <span className="text-subtle">· since {reg.date}</span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-6 shrink-0 text-right">
          <div>
            <div className="text-[10px] uppercase tracking-wider text-subtle">Txs</div>
            <div className="text-sm font-semibold text-ink">
              {stats ? stats.txCount.toString() : '—'}
            </div>
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-wider text-subtle">Total fees</div>
            <div className="text-sm font-semibold text-brand">
              {stats ? `${formatTrust(stats.totalFees)} TRUST` : '—'}
            </div>
          </div>
        </div>
      </Link>
    </li>
  )
}
