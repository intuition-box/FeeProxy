import type { TabId } from '../types'

interface Props {
  active: TabId
  onChange: (t: TabId) => void
  /** Hide the management tab for read-only viewers. */
  canManage: boolean
}

export function Tabs({ active, onChange, canManage }: Props) {
  const items: { id: TabId; label: string }[] = canManage
    ? [
        { id: 'overview', label: 'Overview' },
        { id: 'manage', label: 'Manage' },
      ]
    : [{ id: 'overview', label: 'Overview' }]

  return (
    <div className="flex items-center gap-6 border-b border-line">
      {items.map((item) => {
        const isActive = active === item.id
        return (
          <button
            key={item.id}
            type="button"
            onClick={() => onChange(item.id)}
            className={`relative pb-3 text-sm transition-colors ${
              isActive ? 'text-ink' : 'text-muted hover:text-ink'
            }`}
          >
            {item.label}
            <span
              className={`absolute inset-x-0 -bottom-px h-px transition-opacity ${
                isActive ? 'bg-ink opacity-100' : 'opacity-0'
              }`}
            />
          </button>
        )
      })}
    </div>
  )
}
