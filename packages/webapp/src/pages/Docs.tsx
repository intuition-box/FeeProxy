import { type ReactNode } from 'react'
import { Link, NavLink, useParams } from 'react-router-dom'

type SectionId =
  | 'overview'
  | 'affiliate-model'
  | 'call-flow'
  | 'approvals'
  | 'fees-caps'
  | 'refunds'
  | 'safe-admin'
  | 'integration'

const GROUPS = [
  {
    label: 'Introduction',
    items: [
      { id: 'overview' as SectionId, label: 'Overview' },
      { id: 'affiliate-model' as SectionId, label: 'Affiliate model' },
    ],
  },
  {
    label: 'Concepts',
    items: [
      { id: 'call-flow' as SectionId, label: 'Call flow' },
      { id: 'approvals' as SectionId, label: 'MultiVault approvals' },
      { id: 'fees-caps' as SectionId, label: 'Fees & caps' },
      { id: 'refunds' as SectionId, label: 'Refunds' },
    ],
  },
  {
    label: 'Operations',
    items: [
      { id: 'safe-admin' as SectionId, label: 'Admin & roles via Safe' },
      { id: 'integration' as SectionId, label: 'SDK integration' },
    ],
  },
] as const

const ALL_ITEMS: ReadonlyArray<{ id: SectionId; label: string }> = GROUPS.flatMap(
  (g) => g.items.map((i) => ({ id: i.id, label: i.label })),
)
const ALL_IDS: ReadonlyArray<SectionId> = ALL_ITEMS.map((i) => i.id)

export default function DocsPage() {
  const params = useParams<{ section?: SectionId }>()
  const section = (params.section ?? 'overview') as SectionId

  return (
    <div className="grid gap-12 md:grid-cols-[200px_1fr]">
      <Sidebar active={section} />
      <article className="min-w-0 max-w-2xl">
        <SectionContent id={section} />
        <SectionFooter id={section} />
      </article>
    </div>
  )
}

function Sidebar({ active }: { active: SectionId }) {
  return (
    <aside className="hidden md:block">
      <nav className="sticky top-20 space-y-6 text-sm">
        {GROUPS.map((group) => (
          <div key={group.label}>
            <div className="mb-2 text-[11px] font-medium uppercase tracking-wider text-subtle">
              {group.label}
            </div>
            <ul className="space-y-0.5">
              {group.items.map((item) => (
                <li key={item.id}>
                  <NavLink
                    to={`/docs/${item.id}`}
                    className={() =>
                      `block border-l px-3 py-1.5 -ml-px transition-colors ${
                        active === item.id
                          ? 'border-brand text-ink'
                          : 'border-transparent text-muted hover:text-ink hover:border-line-strong'
                      }`
                    }
                  >
                    {item.label}
                  </NavLink>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>
    </aside>
  )
}

function SectionContent({ id }: { id: SectionId }) {
  switch (id) {
    case 'overview':
      return <Overview />
    case 'affiliate-model':
      return <AffiliateModel />
    case 'call-flow':
      return <CallFlow />
    case 'approvals':
      return <Approvals />
    case 'fees-caps':
      return <FeesCaps />
    case 'refunds':
      return <Refunds />
    case 'safe-admin':
      return <SafeAdmin />
    case 'integration':
      return <Integration />
  }
}

function SectionFooter({ id }: { id: SectionId }) {
  const idx = ALL_IDS.indexOf(id)
  const prev = idx > 0 ? ALL_IDS[idx - 1] : null
  const next = idx < ALL_IDS.length - 1 ? ALL_IDS[idx + 1] : null
  if (!prev && !next) return null
  const labelOf = (s: SectionId) => ALL_ITEMS.find((i) => i.id === s)?.label ?? ''
  return (
    <div className="mt-16 flex items-center justify-between gap-4 border-t border-line pt-6 text-sm">
      {prev ? (
        <Link to={`/docs/${prev}`} className="text-muted hover:text-ink transition-colors">
          ← {labelOf(prev)}
        </Link>
      ) : (
        <span />
      )}
      {next && (
        <Link to={`/docs/${next}`} className="text-muted hover:text-ink transition-colors">
          {labelOf(next)} →
        </Link>
      )}
    </div>
  )
}

// ---- shared atoms ----

function PageHeader({ kicker, title }: { kicker: string; title: string }) {
  return (
    <div className="mb-8 space-y-2">
      <div className="text-[11px] font-medium uppercase tracking-wider text-brand">
        {kicker}
      </div>
      <h1 className="text-3xl font-semibold tracking-tight text-ink">{title}</h1>
    </div>
  )
}

function P({ children }: { children: ReactNode }) {
  return <p className="text-sm leading-relaxed text-muted">{children}</p>
}

function H3({ children }: { children: ReactNode }) {
  return <h3 className="text-sm font-semibold text-ink mt-8 mb-3">{children}</h3>
}

function Code({ children }: { children: ReactNode }) {
  return <code className="font-mono text-ink text-[0.9em]">{children}</code>
}

function Block({ children }: { children: ReactNode }) {
  return (
    <pre className="rounded-lg border border-line bg-canvas p-4 text-[12px] font-mono text-ink overflow-x-auto leading-relaxed">
      {children}
    </pre>
  )
}

function Callout({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="my-6 rounded-lg border-l-4 border-l-brand border border-line bg-surface p-4 text-sm">
      <div className="font-medium text-ink mb-1">{title}</div>
      <div className="text-muted leading-relaxed">{children}</div>
    </div>
  )
}

// ---- sections ----

function Overview() {
  return (
    <div className="space-y-5">
      <PageHeader kicker="Introduction" title="Overview" />
      <P>
        FeeProxy is a single multi-tenant contract per network that sits in
        front of the Intuition MultiVault. Any dApp builder registers once as an
        affiliate, configures a fee schedule, and points their app at their
        affiliate address. On every routed deposit or atom/triple creation the
        proxy takes the affiliate&apos;s fee, pushes it to their fee recipient,
        and forwards the rest to the MultiVault.
      </P>
      <P>
        There is no per-dApp deployment, no upgradeable proxy, no fee pool, and
        no withdraw step. The contract holds no affiliate balance: fees are
        pushed at routing time.
      </P>
    </div>
  )
}

function AffiliateModel() {
  return (
    <div className="space-y-5">
      <PageHeader kicker="Introduction" title="Affiliate model" />
      <P>
        Each wallet keys at most one affiliate row, keyed by its own address —{' '}
        <Code>affiliate = msg.sender</Code> at registration. You manage your own
        row; nobody else can.
      </P>
      <H3>Register</H3>
      <P>
        Call <Code>registerAffiliate(FeeConfig fees, address feeRecipient)</Code>{' '}
        and send exactly the current <Code>registrationFee</Code> in native
        TRUST (forwarded to the protocol treasury).
      </P>
      <H3>Manage</H3>
      <P>
        <Code>updateAffiliateFees(FeeConfig)</Code> and{' '}
        <Code>updateFeeRecipient(address)</Code> update your row. A protocol
        admin can pause/unpause your affiliate; while paused, routing through
        your address reverts.
      </P>
    </div>
  )
}

function CallFlow() {
  return (
    <div className="space-y-5">
      <PageHeader kicker="Concepts" title="Call flow" />
      <P>
        A dApp routes a user&apos;s deposit through the singleton, naming the
        affiliate. The proxy computes the fee, pushes it to the affiliate&apos;s
        recipient, and forwards the remainder to the MultiVault, which mints the
        position to the original user.
      </P>
      <Block>{`registerAffiliate(fees, feeRecipient)   // once, by the dApp builder
        |
depositVia(affiliate, receiver, termId,  // per user deposit
           curveId, grossAssets,
           minShares, feeGuard)
        |
MultiVault.deposit(...)                  // position minted to receiver`}</Block>
      <P>
        The caller passes a <Code>FeeGuard {`{ maxFeeBps, maxFixedFee }`}</Code>{' '}
        as front-run protection: if the affiliate&apos;s live fee exceeds the
        guard at execution time, the tx reverts. Build it from the
        affiliate&apos;s live fees with the SDK&apos;s <Code>buildFeeGuard</Code>.
      </P>
    </div>
  )
}

function Approvals() {
  return (
    <div className="space-y-5">
      <PageHeader kicker="Concepts" title="MultiVault approvals" />
      <P>
        Routing pulls assets and mints on the MultiVault on behalf of the user
        or receiver. Before a dApp can route for them, the relevant account must
        approve the FeeProxy on the MultiVault.
      </P>
      <P>
        Check <Code>isApprovedToDeposit(receiver, proxy)</Code> and{' '}
        <Code>isApprovedToCreate(creator, proxy)</Code> on the MultiVault; if
        false, the user/receiver must approve the FeeProxy first or routing
        reverts with <Code>FeeProxy_ProxyNotApprovedForDeposit</Code> /{' '}
        <Code>…ForCreation</Code>.
      </P>
      <Callout title="Prerequisite for dApp integrators">
        Surface the approval step in your own UI before the first routed
        deposit. It is a one-time MultiVault approval per account, not a FeeProxy
        concern.
      </Callout>
    </div>
  )
}

function FeesCaps() {
  return (
    <div className="space-y-5">
      <PageHeader kicker="Concepts" title="Fees & caps" />
      <P>
        A fee schedule is{' '}
        <Code>{`FeeConfig { depositBps, creationBps, depositFixedFee, creationFixedFee }`}</Code>.
        bps use a base of 10000 (so 250 = 2.5%); fixed fees are in TRUST wei. The
        per-call fee is <Code>grossAssets * bps / 10000 + fixedFee</Code>.
      </P>
      <P>
        Protocol admins set global maxima: <Code>maxBps</Code> and{' '}
        <Code>maxFixedFee</Code>. Registration or a fee update reverts if any
        configured value exceeds its cap.
      </P>
    </div>
  )
}

function Refunds() {
  return (
    <div className="space-y-5">
      <PageHeader kicker="Concepts" title="Refunds" />
      <P>
        When a routed call sends more native value than required, the surplus is
        refunded. The proxy attempts a push refund to the user; if that fails
        (e.g. a contract receiver that rejects value) the amount is credited as
        a pull-fallback.
      </P>
      <P>
        A user reads <Code>pendingRefund(user)</Code> and claims it with{' '}
        <Code>claimRefund()</Code> or <Code>claimRefundTo(recipient)</Code>.
      </P>
    </div>
  )
}

function SafeAdmin() {
  return (
    <div className="space-y-5">
      <PageHeader kicker="Operations" title="Admin & roles via Safe" />
      <P>
        The singleton uses OpenZeppelin AccessControl with two roles:{' '}
        <Code>DEFAULT_ADMIN_ROLE</Code> (global caps, registration fee,
        affiliate unpause, role grants) and <Code>PAUSER_ROLE</Code> (global
        pause and per-affiliate pause). The Admin page gates each control on the
        connected wallet&apos;s role.
      </P>
      <H3>Safe-managed admin</H3>
      <P>
        When the connected admin is a Gnosis Safe (Intuition mainnet, via Den),
        the Admin page proposes each action through the Safe propose / co-sign /
        execute flow instead of sending a direct transaction. An EOA admin sends
        directly. Move the admin role to a Safe before production: a single key
        controlling global protocol config is high risk.
      </P>
      <Callout title="No Safe support on testnet">
        Intuition testnet has no Safe infrastructure — admin actions there are
        EOA-only.
      </Callout>
    </div>
  )
}

function Integration() {
  return (
    <div className="space-y-5">
      <PageHeader kicker="Operations" title="SDK integration" />
      <P>
        <Code>@intuition-fee-proxy/sdk</Code> ships the <Code>FeeProxyABI</Code>,
        addresses, chain configs, fee math, and viem-based readers.
      </P>
      <Block>{`import {
  FeeProxyABI,
  FEEPROXY_ADDRESSES,
  readAffiliateConfig,
  buildFeeGuard,
} from '@intuition-fee-proxy/sdk'

const feeProxy = FEEPROXY_ADDRESSES.testnet
const cfg = await readAffiliateConfig(client, feeProxy, affiliate)
const guard = buildFeeGuard(
  { bps: cfg.fees.depositBps, fixedFee: cfg.fees.depositFixedFee },
  1000n, // tolerate a 10% bump
)`}</Block>
      <P>
        In a wagmi app, import <Code>FeeProxyABI</Code> and use{' '}
        <Code>useReadContract</Code> / <Code>useWriteContract</Code> directly —
        the readers are for non-wagmi consumers.
      </P>
    </div>
  )
}
