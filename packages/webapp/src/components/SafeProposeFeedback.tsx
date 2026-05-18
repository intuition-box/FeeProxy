import type { SafeProposeResult } from '../hooks/useSafePropose'

interface Props {
  proposed: SafeProposeResult | null
  error: string | null
}

/**
 * Shared success/error banner for the "Propose via Safe" flow. Same
 * markup the original SetFeesPanel inlined — extracted so every panel
 * that exposes a Safe-propose action surfaces feedback identically.
 */
export function SafeProposeFeedback({ proposed, error }: Props) {
  if (!proposed && !error) return null

  return (
    <div className="space-y-2">
      {proposed && (
        <div className="rounded-md border border-emerald-400/30 bg-emerald-400/5 px-3 py-2 text-xs text-emerald-300 space-y-1">
          <div>
            <strong>Proposed.</strong> safeTxHash:{' '}
            <code className="font-mono break-all">{proposed.safeTxHash}</code>
          </div>
          <div>
            Owners can co-sign and execute in{' '}
            <a
              href={proposed.denUrl}
              target="_blank"
              rel="noreferrer"
              className="underline decoration-emerald-400/60 hover:decoration-emerald-200"
            >
              Den
            </a>
            .
          </div>
        </div>
      )}
      {error && (
        <p className="text-xs text-rose-400 font-mono">Safe propose: {error}</p>
      )}
    </div>
  )
}
