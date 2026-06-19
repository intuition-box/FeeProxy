import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAccount } from 'wagmi'

import { useAffiliate } from '../hooks/useAffiliate'
import { useFeeProxyAddress } from '../hooks/useFeeProxyAddress'
import Address from '../components/Address'
import { Spinner } from '../components/Spinner'
import { AffiliateConfigCard, AffiliateStatsCard } from '../components/AffiliateView'
import { ManageAffiliate } from '../components/ManageAffiliate'
import { IntegrationKit } from '../components/IntegrationKit'
import { ActivityFeed } from '../components/ActivityFeed'

type TabKey = 'analytics' | 'integration' | 'config'

const TABS: { id: TabKey; label: string }[] = [
  { id: 'analytics', label: 'Analytics' },
  { id: 'integration', label: 'Integration' },
  { id: 'config', label: 'Config' },
]

export default function MyAffiliatePage() {
  const { address } = useAccount()
  const { feeProxy, network, configured } = useFeeProxyAddress()
  const { config, stats, registered, isLoading, refetch } = useAffiliate(address)
  const [tab, setTab] = useState<TabKey>('analytics')

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <header className="space-y-2">
        <div className="text-[11px] font-medium uppercase tracking-wider text-brand">
          Affiliate
        </div>
        <h1 className="text-3xl font-semibold tracking-tight text-ink">My affiliate</h1>
        {address && (
          <div className="text-xs text-subtle inline-flex items-center gap-2">
            <Address value={address} variant="short" />
          </div>
        )}
      </header>

      {!address && (
        <p className="text-sm text-muted">Connect a wallet to view your affiliate row.</p>
      )}

      {address && !configured && (
        <div className="rounded-lg border border-amber-400/30 bg-amber-400/5 px-4 py-3 text-sm text-amber-300">
          The FeeProxy singleton is not configured on this network yet.
        </div>
      )}

      {address && configured && isLoading && (
        <div className="text-sm text-muted inline-flex items-center gap-2">
          <Spinner /> Loading…
        </div>
      )}

      {address && configured && !isLoading && !registered && (
        <div className="rounded-lg border border-line bg-surface px-4 py-4 text-sm text-muted space-y-2">
          <p>This wallet is not registered as an affiliate yet.</p>
          <Link to="/register" className="btn-primary px-4 py-2 inline-flex">
            Register as affiliate
          </Link>
        </div>
      )}

      {address && configured && registered && config && (
        <div className="space-y-8">
          <div className="flex items-center gap-6 border-b border-line">
            {TABS.map((t) => {
              const isActive = tab === t.id
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setTab(t.id)}
                  className={`relative pb-3 text-sm transition-colors ${
                    isActive ? 'text-ink' : 'text-muted hover:text-ink'
                  }`}
                >
                  {t.label}
                  <span
                    className={`absolute inset-x-0 -bottom-px h-px transition-opacity ${
                      isActive ? 'bg-ink opacity-100' : 'opacity-0'
                    }`}
                  />
                </button>
              )
            })}
          </div>

          {tab === 'analytics' && (
            <div className="space-y-10">
              {stats && <AffiliateStatsCard stats={stats} />}
              <ActivityFeed affiliate={address} />
            </div>
          )}

          {tab === 'integration' && (
            <IntegrationKit feeProxy={feeProxy} affiliate={address} network={network} />
          )}

          {tab === 'config' && (
            <div className="space-y-10">
              <AffiliateConfigCard config={config} />
              {config.paused ? (
                <div className="rounded-lg border border-rose-400/40 bg-rose-400/5 px-4 py-3 text-xs text-rose-300">
                  Your affiliate is paused by a protocol admin. Routing is blocked
                  until an admin unpauses it. Fee and recipient updates are
                  read-only while paused.
                </div>
              ) : (
                <ManageAffiliate config={config} onUpdated={refetch} />
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
