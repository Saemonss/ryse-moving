/*
 * Onglets accessibles : clic ou flèches gauche/droite au clavier.
 */
import type { KeyboardEvent } from 'react'

interface TabsProps<T extends string> {
  tabs: { id: T; label: string }[]
  value: T
  onChange: (id: T) => void
  label: string
}

export function Tabs<T extends string>({ tabs, value, onChange, label }: TabsProps<T>) {
  const onKey = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return
    const i = tabs.findIndex((t) => t.id === value)
    const next = tabs[(i + (e.key === 'ArrowRight' ? 1 : tabs.length - 1)) % tabs.length]
    if (next) {
      onChange(next.id)
      e.currentTarget.querySelector<HTMLButtonElement>(`[data-tab="${next.id}"]`)?.focus()
    }
  }
  return (
    <div role="tablist" aria-label={label} onKeyDown={onKey} className="inline-flex gap-1 rounded-xl bg-surface p-1">
      {tabs.map((tab) => {
        const active = tab.id === value
        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            data-tab={tab.id}
            aria-selected={active}
            tabIndex={active ? 0 : -1}
            onClick={() => onChange(tab.id)}
            className={`h-9 rounded-lg px-3.5 text-sm font-medium transition-[background-color,color,box-shadow] duration-150 ${
              active ? 'bg-white text-ink shadow-card' : 'text-muted hover:text-ink'
            }`}
          >
            {tab.label}
          </button>
        )
      })}
    </div>
  )
}
