import type { Address as AddressType } from 'viem'

import Address from './Address'
import { CopyInline } from './CopyInline'

/**
 * The copy-paste integration kit shown on a registered affiliate's dashboard.
 *
 * In the singleton model the affiliate doesn't own a contract — their dApp
 * calls the ONE FeeProxy and passes their own wallet as the `affiliate`
 * argument (the routing tag). This block hands them the two values + a ready
 * `depositVia` snippet so they can wire it without reading the ABI.
 */
export function IntegrationKit({
  feeProxy,
  affiliate,
  network,
}: {
  feeProxy: AddressType
  affiliate: AddressType
  network: 'mainnet' | 'testnet'
}) {
  const snippet = `import { writeContract } from '@wagmi/core'
import { FeeProxyABI } from './abi/feeProxy'

// One-time, per user: the receiver must approve the FeeProxy on MultiVault
// (ApprovalTypes.DEPOSIT). Creation routing needs ApprovalTypes.CREATION.

await writeContract(config, {
  address: '${feeProxy}', // FeeProxy singleton (${network})
  abi: FeeProxyABI,
  functionName: 'depositVia',
  args: [
    '${affiliate}', // your affiliate id — fees route to your recipient
    receiver,       // who receives the shares
    termId,
    curveId,
    grossAssets,    // pre-fee amount (also the tx value)
    minShares,
    { maxFeeBps, maxFixedFee }, // per-call front-run guard
  ],
  value: grossAssets,
})`

  return (
    <section className="space-y-4">
      <div className="space-y-1">
        <h2 className="font-semibold text-ink">Integration kit</h2>
        <p className="text-sm text-muted">
          Paste this into your dApp. Every routed deposit or creation passes
          your affiliate id, so fees flow to your recipient and this dashboard
          tracks the activity. Creation uses{' '}
          <code className="font-mono text-ink text-[0.9em]">createAtomsVia</code>{' '}
          /{' '}
          <code className="font-mono text-ink text-[0.9em]">createTriplesVia</code>{' '}
          with the same shape.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <KitField
          label="FeeProxy singleton"
          value={feeProxy}
          hint="Same address for every affiliate on this network"
        />
        <KitField
          label="Your affiliate id"
          value={affiliate}
          hint="Pass as the affiliate argument"
        />
      </div>

      <div className="relative rounded-lg border border-line bg-surface">
        <div className="absolute right-2 top-2">
          <CopyInline value={snippet} />
        </div>
        <pre className="overflow-x-auto px-4 py-3 text-xs leading-relaxed text-ink font-mono">
          {snippet}
        </pre>
      </div>
    </section>
  )
}

function KitField({
  label,
  value,
  hint,
}: {
  label: string
  value: AddressType
  hint: string
}) {
  return (
    <div className="rounded-lg border border-line bg-surface px-3 py-2.5 space-y-1">
      <div className="text-[11px] font-medium uppercase tracking-wider text-subtle">
        {label}
      </div>
      <div className="flex items-center gap-2">
        <Address value={value} variant="short" />
      </div>
      <div className="text-[11px] text-subtle">{hint}</div>
    </div>
  )
}
