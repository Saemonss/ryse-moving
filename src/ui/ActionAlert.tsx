/*
 * Alerte avec action : dit ce qui ne va pas ET propose quoi faire (bouton à droite).
 */
import { CircleAlert, Info, TriangleAlert, type LucideIcon } from 'lucide-react'
import { Button } from './Button'

type AlertTone = 'danger' | 'warning' | 'info'

const ICONS: Record<AlertTone, LucideIcon> = { danger: CircleAlert, warning: TriangleAlert, info: Info }
const ICON_BG: Record<AlertTone, string> = {
  danger: 'bg-danger-soft text-danger',
  warning: 'bg-warning-soft text-warning',
  info: 'bg-info-soft text-info',
}

interface ActionAlertProps {
  tone: AlertTone
  title: string
  text: string
  actionLabel: string
  onAction: () => void
}

export function ActionAlert({ tone, title, text, actionLabel, onAction }: ActionAlertProps) {
  const Icon = ICONS[tone]
  return (
    <div className="flex items-center gap-3 py-3">
      <span className={`grid size-9 shrink-0 place-items-center rounded-xl ${ICON_BG[tone]}`}>
        <Icon size={18} aria-hidden="true" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[15px] font-semibold leading-snug text-ink">{title}</p>
        <p className="text-sm leading-snug text-muted">{text}</p>
      </div>
      <Button size="sm" variant="secondary" onClick={onAction}>
        {actionLabel}
      </Button>
    </div>
  )
}
