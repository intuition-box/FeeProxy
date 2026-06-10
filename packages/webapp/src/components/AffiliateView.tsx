import type { AffiliateConfig, AffiliateStats } from '../contracts'
import Address from './Address'
import { Stat } from './Stat'
import { Metric } from './Metric'
import { formatBps, formatDateParts, formatTrust } from '../lib/format'

/** Read-only render of an affiliate's registry row. */
export function AffiliateConfigCard({ config }: { config: AffiliateConfig }) {
  const reg = formatDateParts(Number(config.registeredAt))
  return (
    <section className="space-y-4">
      <div className="flex items-center gap-3">
        <h2 className="font-semibold text-ink">Configuration</h2>
        {config.paused ? (
          <span className="text-[10px] font-mono uppercase tracking-wider text-rose-400 border border-rose-400/40 rounded px-1.5 py-0.5">
            Paused
          </span>
        ) : (
          <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-400 border border-emerald-400/40 rounded px-1.5 py-0.5">
            Active
          </span>
        )}
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <Stat label="Fee recipient" value={config.feeRecipient} mono />
        <Stat label="Registered" value={`${reg.date} ${reg.time}`} />
        <Stat
          label="Deposit fee"
          value={`${formatBps(config.fees.depositBps)} + ${formatTrust(config.fees.depositFixedFee)} TRUST`}
        />
        <Stat
          label="Creation fee"
          value={`${formatBps(config.fees.creationBps)} + ${formatTrust(config.fees.creationFixedFee)} TRUST`}
        />
      </div>

      <div className="text-xs text-subtle inline-flex items-center gap-2">
        Recipient: <Address value={config.feeRecipient} variant="short" />
      </div>
    </section>
  )
}

/** Read-only render of an affiliate's aggregate analytics. */
export function AffiliateStatsCard({ stats }: { stats: AffiliateStats }) {
  return (
    <section className="space-y-4">
      <h2 className="font-semibold text-ink">Analytics</h2>
      <div className="grid gap-3 sm:grid-cols-3">
        <Metric label="Transactions" value={stats.txCount.toString()} />
        <Metric label="Unique users" value={stats.uniqueUsers.toString()} />
        <Metric label="Total fees" value={`${formatTrust(stats.totalFees)} TRUST`} emphasize />
        <Metric label="Gross routed" value={`${formatTrust(stats.totalGrossAssets)} TRUST`} />
        <Metric label="Forwarded" value={`${formatTrust(stats.totalForwardedAssets)} TRUST`} />
        <Metric label="Deposits" value={stats.depositCount.toString()} />
        <Metric label="Atom/triple creations" value={stats.creationCount.toString()} />
        <Metric label="Deposit fees" value={`${formatTrust(stats.depositFees)} TRUST`} />
        <Metric label="Creation fees" value={`${formatTrust(stats.creationFees)} TRUST`} />
      </div>
    </section>
  )
}
