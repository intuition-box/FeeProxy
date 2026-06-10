import { Link } from 'react-router-dom'

export default function HomePage() {
  return (
    <div className="space-y-10">
      <section className="max-w-xl space-y-6 pt-6">
        <h1 className="text-5xl font-semibold tracking-tight text-ink leading-[1.1]">
          A shared fee layer for the{' '}
          <span className="text-brand">Intuition MultiVault</span>.
        </h1>
        <p className="text-lg text-muted leading-relaxed max-w-md">
          One multi-tenant FeeProxy per network. Register your dApp as an
          affiliate, set your fees once, and point your app at your affiliate
          address — fees are routed straight to your recipient on every deposit
          and atom creation.
        </p>
      </section>

      <section className="space-y-6">
        <CallFlow />
        <div className="flex items-center gap-5 pt-2">
          <Link to="/register" className="btn-primary px-5 py-2.5">
            Register as affiliate
          </Link>
          <Link
            to="/affiliates"
            className="text-sm text-muted hover:text-ink transition-colors"
          >
            Browse affiliates →
          </Link>
          <Link
            to="/docs"
            className="ml-auto text-sm text-muted hover:text-ink transition-colors"
          >
            Read the docs →
          </Link>
        </div>
      </section>

      <section className="grid gap-12 sm:grid-cols-3">
        {[
          {
            title: 'Multi-tenant',
            body:
              'A single singleton hosts every affiliate. Your wallet keys one affiliate row — no per-dApp deployment, no proxy to manage.',
          },
          {
            title: 'Push-based fees',
            body:
              'Fees are forwarded to your fee recipient at routing time. No pool, no accumulated balance, no withdraw step.',
          },
          {
            title: 'Bounded by caps',
            body:
              'Protocol admins set global maximum bps and fixed fees. Your configured fees must stay within those caps or registration reverts.',
          },
        ].map((f) => (
          <div key={f.title} className="rounded-xl border border-line bg-surface p-6">
            <div className="text-base font-medium text-ink">{f.title}</div>
            <p className="mt-2 text-sm text-muted leading-relaxed">{f.body}</p>
          </div>
        ))}
      </section>
    </div>
  )
}

function CallFlow() {
  return (
    <div className="relative z-10 rounded-2xl border border-brand/25 bg-surface p-8 md:p-10 shadow-[0_0_60px_-15px_rgba(240,122,63,0.35)]">
      <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr_auto_1fr] items-stretch gap-4 md:gap-0">
        <FlowNode
          icon={<WalletIcon />}
          title="User / dApp"
          subtitle="depositVia(affiliate, …)"
          body="Routes a deposit through your affiliate address."
        />
        <FlowArrow />
        <FlowNode
          variant="fee"
          icon={<ProxyIcon />}
          title="FeeProxy"
          subtitle="singleton"
          badge="FEE"
          body="Takes your configured fee, pushes it to your fee recipient, forwards the rest."
        />
        <FlowArrow />
        <FlowNode
          icon={<VaultIcon />}
          title="MultiVault"
          subtitle="Intuition core"
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
