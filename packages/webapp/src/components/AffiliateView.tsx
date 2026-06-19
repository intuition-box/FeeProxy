import type { ReactNode } from 'react'

import type { AffiliateConfig, AffiliateStats } from '../contracts'
import Address from './Address'
import { formatBps, formatDateParts, formatTrust } from '../lib/format'

/** Glassy card matching the home stats card, with a kicker title + cell grid. */
function Card({
  title,
  badge,
  cols,
  children,
}: {
  title?: string
  badge?: ReactNode
  cols: 2 | 3
  children: ReactNode
}) {
  const hasHeader = Boolean(title || badge)
  // Drop the hairline on the first row so it never sits at the card's top edge;
  // inner rows keep their top border as a separator.
  const firstRowFlat =
    cols === 3
      ? '[&>*:nth-child(-n+3)]:border-t-0 [&>*:nth-child(-n+3)]:pt-0'
      : '[&>*:nth-child(-n+2)]:border-t-0 [&>*:nth-child(-n+2)]:pt-0'
  return (
    <section className="rounded-2xl border border-brand/25 bg-surface/70 p-6 backdrop-blur-md shadow-[0_0_60px_-15px_rgba(240,122,63,0.35)]">
      {hasHeader && (
        <div className="flex items-center gap-3">
          {title && (
            <h2 className="text-[11px] font-medium uppercase tracking-wider text-subtle">
              {title}
            </h2>
          )}
          {badge}
        </div>
      )}
      <div
        className={`grid gap-x-6 gap-y-5 ${firstRowFlat} ${hasHeader ? 'mt-5' : ''} ${
          cols === 3 ? 'sm:grid-cols-3' : 'sm:grid-cols-2'
        }`}
      >
        {children}
      </div>
    </section>
  )
}

function Cell({
  label,
  children,
  emphasize,
}: {
  label: string
  children: ReactNode
  emphasize?: boolean
}) {
  return (
    <div className="space-y-1 border-t border-line pt-3">
      <div className="text-[11px] uppercase tracking-wider text-subtle">{label}</div>
      <div className={`text-lg font-semibold ${emphasize ? 'text-brand' : 'text-ink'}`}>
        {children}
      </div>
    </div>
  )
}

/** Read-only render of an affiliate's registry row. */
export function AffiliateConfigCard({ config }: { config: AffiliateConfig }) {
  const reg = formatDateParts(Number(config.registeredAt))
  const badge = config.paused ? (
    <span className="rounded border border-rose-400/40 px-1.5 py-0.5 text-[10px] font-mono uppercase tracking-wider text-rose-400">
      Paused
    </span>
  ) : (
    <span className="rounded border border-brand/40 px-1.5 py-0.5 text-[10px] font-mono uppercase tracking-wider text-brand">
      Active
    </span>
  )

  return (
    <Card title="Configuration" badge={badge} cols={2}>
      <Cell label="Fee recipient">
        <Address value={config.feeRecipient} variant="short" />
      </Cell>
      <Cell label="Registered">{`${reg.date} ${reg.time}`}</Cell>
      <Cell label="Deposit fee">
        {`${formatBps(config.fees.depositBps)} + ${formatTrust(config.fees.depositFixedFee)} TRUST`}
      </Cell>
      <Cell label="Creation fee">
        {`${formatBps(config.fees.creationBps)} + ${formatTrust(config.fees.creationFixedFee)} TRUST`}
      </Cell>
    </Card>
  )
}

/** Read-only render of an affiliate's aggregate analytics. */
export function AffiliateStatsCard({ stats }: { stats: AffiliateStats }) {
  return (
    <div className="space-y-4">
      <Card cols={3}>
        <Cell label="Transactions">{stats.txCount.toString()}</Cell>
        <Cell label="Unique users">{stats.uniqueUsers.toString()}</Cell>
        <Cell label="Total fees" emphasize>
          {`${formatTrust(stats.totalFees)} TRUST`}
        </Cell>
      </Card>
      <Card cols={3}>
        <Cell label="Gross routed">{`${formatTrust(stats.totalGrossAssets)} TRUST`}</Cell>
        <Cell label="Forwarded">{`${formatTrust(stats.totalForwardedAssets)} TRUST`}</Cell>
        <Cell label="Deposits">{stats.depositCount.toString()}</Cell>
        <Cell label="Atom/triple creations">{stats.creationCount.toString()}</Cell>
        <Cell label="Deposit fees">{`${formatTrust(stats.depositFees)} TRUST`}</Cell>
        <Cell label="Creation fees">{`${formatTrust(stats.creationFees)} TRUST`}</Cell>
      </Card>
    </div>
  )
}
