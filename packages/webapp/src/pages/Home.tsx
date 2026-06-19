import { Link } from 'react-router-dom'

import { useProtocolStats } from '../hooks/useProtocolStats'
import { formatTrust } from '../lib/format'

export default function HomePage() {
  return (
    <div className="space-y-20">
      {/* Hero: text + CTA left, live stats right, beam centered behind (Layout) */}
      <section className="grid min-h-[560px] items-center gap-12 pt-6 lg:grid-cols-2">
        <div className="space-y-6">
          <h1 className="text-5xl font-semibold tracking-tight text-ink leading-[1.1]">
            A shared fee layer for the{' '}
            <span className="text-brand">Intuition MultiVault</span>.
          </h1>
          <p className="text-lg text-muted leading-relaxed max-w-md">
            Register your dApp as an affiliate, set your fees once, and point
            your app at your affiliate address — fees route straight to your
            recipient on every deposit and atom creation.
          </p>
          <div className="flex items-center gap-4 pt-2">
            <Link to="/register" className="btn-primary px-5 py-2.5">
              Register as affiliate
            </Link>
            <Link
              to="/docs"
              className="rounded-md border border-line px-5 py-2.5 text-sm text-ink transition-colors hover:border-line-strong"
            >
              Read the docs
            </Link>
          </div>
        </div>

        <div className="w-full max-w-sm lg:justify-self-end">
          <NetworkStatsCard />
        </div>
      </section>

      {/* Call flow, descended below the hero (label removed, position kept) */}
      <section className="pt-8">
        <CallFlow />
      </section>
    </div>
  )
}

/** Glassy live-stats card sitting to the right of the beam in the hero. */
function NetworkStatsCard() {
  const { affiliateCount, totalForwarded, totalFees, totalTx, configured, isLoading } =
    useProtocolStats()

  const cell = (label: string, value: string) => (
    <div className="space-y-1 border-t border-line pt-3">
      <div className="text-[11px] uppercase tracking-wider text-subtle">{label}</div>
      <div className="text-lg font-semibold text-ink">{isLoading ? '…' : value}</div>
    </div>
  )

  return (
    <div className="rounded-2xl border border-brand/25 bg-surface/70 p-6 backdrop-blur-md shadow-[0_0_60px_-15px_rgba(240,122,63,0.35)]">
      <div className="text-[11px] font-medium uppercase tracking-wider text-subtle">
        {configured ? 'Live on Intuition testnet' : 'Network'}
      </div>
      <div className="mt-4 grid grid-cols-2 gap-x-6 gap-y-5">
        {cell('Affiliates', configured ? String(affiliateCount) : '—')}
        {cell('Funds routed', configured ? `${formatTrust(totalForwarded)} TRUST` : '—')}
        {cell('Fees paid', configured ? `${formatTrust(totalFees)} TRUST` : '—')}
        {cell('Transactions', configured ? totalTx.toString() : '—')}
      </div>
    </div>
  )
}

function CallFlow() {
  return (
    <div className="relative z-10 rounded-2xl border border-brand/25 bg-surface p-8 md:p-10 shadow-[0_0_60px_-15px_rgba(240,122,63,0.35)]">
      <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr_auto_1fr] items-stretch gap-4 md:gap-0">
        <FlowNode
          icon={<WalletIcon />}
          title="App"
          subtitle=""
          body="Routes a deposit through your affiliate address."
        />
        <FlowArrow />
        <FlowNode
          variant="fee"
          icon={<ProxyIcon />}
          title="FeeProxy"
          subtitle=""
          badge="FEE"
          body="Takes your configured fee, pushes it to your fee recipient, forwards the rest."
        />
        <FlowArrow />
        <FlowNode
          icon={<VaultIcon />}
          title="MultiVault"
          subtitle=""
          body="Executes the deposit; mints the position to the user."
        />
      </div>
    </div>
  )
}

function FlowNode({
  icon,
  title,
  subtitle,
  body,
  variant = 'neutral',
  badge,
}: {
  icon: React.ReactNode
  title: string
  subtitle: string
  body: string
  variant?: 'neutral' | 'fee'
  badge?: string
}) {
  const border = variant === 'fee' ? 'border-brand/50' : 'border-line'
  const bg = variant === 'fee' ? 'bg-brand/[0.06]' : 'bg-canvas'
  const accentText = variant === 'fee' ? 'text-brand' : 'text-ink'
  const iconText = variant === 'fee' ? 'text-brand' : 'text-muted'

  return (
    <div
      className={`rounded-xl border ${border} ${bg} p-5 flex flex-col gap-3 min-h-[160px] h-full`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2.5 min-w-0">
          <span
            className={`inline-flex h-8 w-8 items-center justify-center rounded-md border ${border} ${iconText}`}
          >
            {icon}
          </span>
          <div className="flex flex-col leading-tight min-w-0">
            <span className={`text-base font-semibold tracking-tight ${accentText}`}>
              {title}
            </span>
            <span className="text-[11px] font-mono uppercase tracking-wider text-subtle">
              {subtitle}
            </span>
          </div>
        </div>
        {badge && (
          <span
            className={`shrink-0 rounded border px-1.5 py-0.5 text-[9px] font-mono uppercase tracking-wider ${border} ${accentText}`}
          >
            {badge}
          </span>
        )}
      </div>
      <p className="text-sm text-muted leading-relaxed">{body}</p>
    </div>
  )
}

function FlowArrow() {
  return (
    <div className="flex items-center justify-center px-4 py-2 md:py-0 md:min-w-[100px]">
      <div className="flex items-center w-full">
        <span className="h-px flex-1 bg-line" />
        <svg
          width="10"
          height="10"
          viewBox="0 0 10 10"
          className="text-line ml-[-1px]"
          aria-hidden="true"
        >
          <path d="M0 1 L8 5 L0 9 Z" fill="currentColor" />
        </svg>
      </div>
    </div>
  )
}

function WalletIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="6" width="18" height="13" rx="2" />
      <path d="M16 12h3" />
      <path d="M3 9h14a2 2 0 0 1 2 2" />
    </svg>
  )
}

function ProxyIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="4" width="16" height="16" rx="3" />
      <path d="M8 9h8M8 12h8M8 15h5" />
    </svg>
  )
}

function VaultIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <circle cx="12" cy="12" r="3" />
      <path d="M12 9v-1M12 16v-1M15 12h1M8 12h1" />
    </svg>
  )
}
