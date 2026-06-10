interface Props {
  connected: boolean
}

export function ViewerBanner({ connected }: Props) {
  return (
    <div className="rounded-lg border border-line bg-surface px-4 py-3 text-xs text-muted flex items-center gap-3">
      <span className="text-[10px] font-mono uppercase tracking-wider text-subtle border border-line rounded px-1.5 py-0.5 shrink-0">
        Read-only
      </span>
      <span className="leading-relaxed">
        {connected
          ? 'Your connected wallet is not this affiliate — management actions are hidden.'
          : 'Connect the affiliate wallet to update its fees or fee recipient.'}
      </span>
    </div>
  )
}
