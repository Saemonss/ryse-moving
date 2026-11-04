/*
 * Badge d'état. Une couleur = un sens, partout dans la démo :
 * success = fait / payé · warning = à surveiller · danger = à régler · info = en cours / pour info
 * accent = étape commerciale · neutral = neutre.
 */
import type { ReactNode } from 'react'

export type Tone = 'success' | 'warning' | 'danger' | 'info' | 'neutral' | 'accent'

export const TONE_CLASSES: Record<Tone, string> = {
  success: 'bg-success-soft text-success',
  warning: 'bg-warning-soft text-warning',
  danger: 'bg-danger-soft text-danger',
  info: 'bg-info-soft text-info',
  neutral: 'bg-surface text-muted',
  accent: 'bg-surface-2 text-accent',
}

const DOT: Record<Tone, string> = {
  success: 'bg-success',
  warning: 'bg-warning',
  danger: 'bg-danger',
  info: 'bg-info',
  neutral: 'bg-subtle',
  accent: 'bg-accent',
}

export function StatusBadge({ tone, children, size = 'sm' }: { tone: Tone; children: ReactNode; size?: 'sm' | 'lg' }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full font-medium ${TONE_CLASSES[tone]} ${
        size === 'lg' ? 'px-3 py-1 text-[15px]' : 'px-2.5 py-0.5 text-[13px]'
      }`}
    >
      <span className={`size-1.5 rounded-full ${DOT[tone]}`} aria-hidden="true" />
      {children}
    </span>
  )
}
