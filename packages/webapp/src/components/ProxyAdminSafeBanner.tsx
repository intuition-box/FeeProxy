import { Link } from 'react-router-dom'
import type { Address } from 'viem'
import { useChainId } from 'wagmi'
import { useSafeStatus } from '../hooks/useSafeStatus'

interface Props {
  /** The connected admin account. */
  admin: Address | undefined
}

const INTUITION_MAINNET_CHAIN_ID = 1155

/**
 * Banner shown above the protocol admin panel. When the connected admin is a
 * Safe, admin actions route through the Safe propose/co-sign flow — surfaced
 * here so the operator knows what to expect. An EOA admin on mainnet is
 * flagged as high-risk (single key controls global protocol config).
 */
export function ProxyAdminSafeBanner({ admin }: Props) {
  const chainId = useChainId()
  const status = useSafeStatus(admin)
  const onMainnet = chainId === INTUITION_MAINNET_CHAIN_ID

  if (!admin || status.kind === 'unknown') return null

  if (status.kind === 'safe') {
    return (
      <div className="rounded-lg border border-emerald-400/30 bg-emerald-400/5 px-4 py-2.5 text-xs text-emerald-300">
        <strong>Safe-managed admin.</strong> Actions are proposed to the Safe and require multisig quorum — they will not execute immediately.
      </div>
    )
  }

  if (status.kind === 'contract') {
    return (
      <div className="rounded-lg border border-line bg-surface px-4 py-2.5 text-xs text-muted">
        <strong>Smart-contract admin</strong> — not detected as a known Safe singleton. Actions are sent directly.
      </div>
    )
  }

  // EOA
  if (onMainnet) {
    return (
      <div className="rounded-lg border border-rose-400/50 bg-rose-400/5 px-4 py-3 text-xs text-rose-300">
        <strong>EOA admin on mainnet — high risk.</strong> A single key controls every global protocol setting and role grant. Move the admin role to a Gnosis Safe before production use.{' '}
        <Link
          to="/docs/safe-admin"
          className="underline decoration-rose-400/60 hover:decoration-rose-200 font-medium"
        >
          Read the Safe admin guide
        </Link>
        .
      </div>
    )
  }

  return (
    <div className="rounded-lg border border-amber-400/30 bg-amber-400/5 px-4 py-2.5 text-xs text-amber-300">
      <strong>EOA admin.</strong> Fine for dev / testing. Move to a Safe before mainnet.{' '}
      <Link
        to="/docs/safe-admin"
        className="underline decoration-amber-400/60 hover:decoration-amber-200"
      >
        Safe admin guide
      </Link>
      .
    </div>
  )
}
