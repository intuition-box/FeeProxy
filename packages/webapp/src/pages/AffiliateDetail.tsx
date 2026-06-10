import { Link, useParams } from 'react-router-dom'
import { isAddress, type Address } from 'viem'
import { useAccount } from 'wagmi'

import { useAffiliate } from '../hooks/useAffiliate'
import { useFeeProxyAddress } from '../hooks/useFeeProxyAddress'
import AddressDisplay from '../components/Address'
import { Spinner } from '../components/Spinner'
import { ViewerBanner } from '../components/ViewerBanner'
import { AffiliateConfigCard, AffiliateStatsCard } from '../components/AffiliateView'
import { ActivityFeed } from '../components/ActivityFeed'

export default function AffiliateDetailPage() {
  const params = useParams<{ address: string }>()
  const { address: connected } = useAccount()
  const { configured } = useFeeProxyAddress()

  const target = (params.address ?? '') as string
  const valid = isAddress(target)
  const affiliate = valid ? (target as Address) : undefined

  const { config, stats, registered, isLoading } = useAffiliate(affiliate)

  const isSelf =
    Boolean(connected && affiliate && connected.toLowerCase() === affiliate.toLowerCase())

  if (!valid) {
    return (
      <div className="max-w-2xl space-y-4">
        <p className="text-sm text-rose-400 font-mono">Invalid affiliate address.</p>
        <Link to="/affiliates" className="text-sm text-brand underline">
          ← Back to affiliates
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-3xl space-y-8">
      <header className="space-y-2">
        <Link to="/affiliates" className="text-xs text-muted hover:text-ink transition-colors">
          ← Affiliates
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight text-ink">Affiliate</h1>
        <AddressDisplay value={affiliate!} variant="full" />
      </header>

      {!configured && (
        <div className="rounded-lg border border-amber-400/30 bg-amber-400/5 px-4 py-3 text-sm text-amber-300">
          The FeeProxy singleton is not configured on this network yet.
        </div>
      )}

      {configured && isLoading && (
        <div className="text-sm text-muted inline-flex items-center gap-2">
          <Spinner /> Loading…
        </div>
      )}

      {configured && !isLoading && !registered && (
        <p className="text-sm text-subtle border-l-2 border-line pl-3">
          This address is not a registered affiliate.
        </p>
      )}

      {configured && registered && config && (
        <div className="space-y-10">
          <AffiliateConfigCard config={config} />
          {stats && <AffiliateStatsCard stats={stats} />}
          <ActivityFeed affiliate={affiliate!} />
          {isSelf ? (
            <div className="rounded-lg border border-line bg-surface px-4 py-3 text-sm text-muted">
              This is your affiliate.{' '}
              <Link to="/me" className="text-brand underline decoration-brand/60 hover:decoration-brand">
                Manage it →
              </Link>
            </div>
          ) : (
            <ViewerBanner connected={Boolean(connected)} />
          )}
        </div>
      )}
    </div>
  )
}
