/*
 * Briques de l'écran téléphone (chauffeur), pensées pour un utilisateur peu à l'aise avec la technologie :
 * - PhoneScreen : « Maintenant : … » toujours visible, progression, retour, UNE action principale en très gros bouton
 *   (protégée contre le double appui : jamais deux étapes sautées par erreur).
 * - Sheet : panneau qui monte du bas, DANS le téléphone (choix d'une photo, d'un dégât…).
 * - BigChoice : choix en un tap (un seul ou plusieurs).
 * - Keypad : pavé numérique géant.
 */
import { useEffect, useRef, useState, type ReactNode } from 'react'
import { ArrowLeft, Delete, X, type LucideIcon } from 'lucide-react'
import { useI18n } from '../../i18n'
import { Button } from '../Button'

interface PhoneAction {
  label: string
  icon?: LucideIcon
  onClick: () => void
  disabled?: boolean
  /** Explication affichée quand l'action n'est pas encore possible. */
  hint?: string
}

interface PhoneScreenProps {
  now: string
  title?: string
  progress?: { n: number; total: number; label: string }
  onBack?: () => void
  action?: PhoneAction
  /** Boutons secondaires (petits), au-dessus de l'action principale. */
  secondary?: ReactNode
  children?: ReactNode
  /** Bandeau au-dessus de tout (ex. « Pas de réseau »). */
  banner?: ReactNode
}

export function PhoneScreen({ now, title, progress, onBack, action, secondary, children, banner }: PhoneScreenProps) {
  const { t } = useI18n()
  // Anti double appui : après chaque appui, le bouton fait une courte pause (0,4 s) ; un second appui trop rapide
  // (double tap) est ignoré, même si le bouton affiche déjà l'étape suivante.
  const [cooling, setCooling] = useState(false)
  const timer = useRef<number | undefined>(undefined)
  useEffect(() => () => window.clearTimeout(timer.current), [])
  const run = () => {
    if (!action || action.disabled || cooling) return
    setCooling(true)
    timer.current = window.setTimeout(() => setCooling(false), 400)
    action.onClick()
  }
  return (
    <div className="flex min-h-full flex-col text-[17px] text-ink">
      {banner}
      <div className="flex-1 space-y-4 px-5 pb-4 pt-2">
        {(onBack || title) && (
          <div className="flex items-center gap-2">
            {onBack && (
              <button
                type="button"
                onClick={onBack}
                aria-label={t('terrain.mission.back')}
                className="-ml-2 grid size-12 shrink-0 place-items-center rounded-full text-ink transition-colors hover:bg-surface-2/70"
              >
                <ArrowLeft size={24} aria-hidden="true" />
              </button>
            )}
            {title && <h1 className="text-[22px] font-bold leading-tight tracking-[-0.015em]">{title}</h1>}
          </div>
        )}
        {progress && (
          <div>
            <p className="text-[15px] font-semibold text-accent">{t('terrain.mission.progress', { n: progress.n, total: progress.total })}</p>
            <div className="mt-1.5 flex gap-1" aria-hidden="true">
              {Array.from({ length: progress.total }, (_, i) => (
                <span key={i} className={`h-1.5 flex-1 rounded-full ${i < progress.n ? 'bg-accent' : 'bg-surface-2'}`} />
              ))}
            </div>
            <p className="mt-1.5 text-[19px] font-bold leading-snug">{progress.label}</p>
          </div>
        )}
        <div role="status" className="rounded-2xl bg-ink px-4 py-3.5 text-white">
          <p className="leading-snug">
            <strong className="font-semibold text-accent-on-dark">{t('chauffeur.now')}</strong> {now}
          </p>
        </div>
        {children}
      </div>
      {(action || secondary) && (
        <div className="sticky bottom-0 space-y-2 bg-gradient-to-t from-[#f7f6fc] from-75% to-transparent px-5 pb-3 pt-6">
          {secondary && <div className="flex gap-2">{secondary}</div>}
          {action && (
            <>
              {action.disabled && action.hint && (
                <p id="phone-action-hint" className="text-center text-[15px] font-medium text-muted">
                  {action.hint}
                </p>
              )}
              <Button
                size="xl"
                icon={action.icon}
                onClick={run}
                disabled={action.disabled || cooling}
                aria-busy={cooling || undefined}
                aria-describedby={action.disabled && action.hint ? 'phone-action-hint' : undefined}
              >
                {action.label}
              </Button>
            </>
          )}
        </div>
      )}
    </div>
  )
}

/** Panneau qui monte du bas, à l'intérieur du téléphone. Échap ou la croix le ferment. */
export function Sheet({ open, title, onClose, children }: { open: boolean; title: string; onClose: () => void; children: ReactNode }) {
  const { t } = useI18n()
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!open) return
    ref.current?.querySelector<HTMLElement>('button, input')?.focus()
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose])
  if (!open) return null
  return (
    <div data-sheet className="absolute inset-0 z-30 flex flex-col justify-end">
      <div className="absolute inset-0 bg-ink/40 animate-[rm-fade_180ms_ease-out]" onClick={onClose} aria-hidden="true" />
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="relative max-h-[88%] overflow-y-auto rounded-t-[28px] bg-white px-5 pb-6 pt-4 shadow-float animate-[rm-sheet_240ms_var(--ease-out)] [scrollbar-width:none]"
      >
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 className="text-[20px] font-bold leading-tight">{title}</h2>
          <button type="button" onClick={onClose} aria-label={t('common.close')} className="grid size-11 shrink-0 place-items-center rounded-full bg-surface text-ink">
            <X size={22} aria-hidden="true" />
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}

interface BigChoiceProps<T extends string> {
  options: { value: T; label: string; icon?: LucideIcon }[]
  value: T | T[] | null
  onChange: (value: T) => void
  columns?: 1 | 2
  label: string
}

/** Choix en un tap : très gros boutons, état choisi bien visible (coche + couleur). */
export function BigChoice<T extends string>({ options, value, onChange, columns = 2, label }: BigChoiceProps<T>) {
  const selected = (v: T) => (Array.isArray(value) ? value.includes(v) : value === v)
  return (
    <div role="group" aria-label={label} className={`grid gap-2 ${columns === 2 ? 'grid-cols-2' : 'grid-cols-1'}`}>
      {options.map(({ value: v, label: l, icon: Icon }) => {
        const on = selected(v)
        return (
          <button
            key={v}
            type="button"
            data-crawl-sample
            aria-pressed={on}
            onClick={() => onChange(v)}
            className={`flex min-h-14 items-center gap-2 rounded-2xl border-2 px-3 py-2 text-left text-[17px] font-semibold leading-tight transition-[background-color,border-color,transform] duration-150 active:scale-[0.97] ${
              on ? 'border-accent bg-surface-2 text-ink' : 'border-line bg-white text-ink'
            }`}
          >
            {Icon && <Icon size={22} aria-hidden="true" className={on ? 'text-accent' : 'text-muted'} />}
            {l}
          </button>
        )
      })}
    </div>
  )
}

/** Pavé numérique géant. decimal = virgule autorisée (montants). */
export function Keypad({ value, onChange, maxLength = 6, decimal = false }: { value: string; onChange: (v: string) => void; maxLength?: number; decimal?: boolean }) {
  const { t } = useI18n()
  const press = (k: string) => {
    if (k === 'del') return onChange(value.slice(0, -1))
    if (value.length >= maxLength) return
    if (k === ',' && (value.includes(',') || value === '')) return
    if (decimal && value.includes(',') && value.split(',')[1]!.length >= 2) return
    onChange(value + k)
  }
  // « Effacer » n'apparaît que s'il y a quelque chose à effacer (jamais de bouton sans effet)
  const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', decimal ? ',' : '', '0', value ? 'del' : '']
  return (
    <div className="grid grid-cols-3 gap-2">
      {keys.map((k, i) =>
        k === '' ? (
          <span key={i} />
        ) : (
          <button
            key={k}
            type="button"
            data-crawl-sample
            onClick={() => press(k)}
            aria-label={k === 'del' ? t('terrain.keypad.erase') : k}
            className="grid h-16 place-items-center rounded-2xl bg-white text-[28px] font-semibold text-ink shadow-card ring-1 ring-line transition-transform duration-100 active:scale-[0.95] active:bg-surface-2"
          >
            {k === 'del' ? <Delete size={26} aria-hidden="true" /> : k}
          </button>
        ),
      )}
    </div>
  )
}

/** Petit bouton secondaire du téléphone (≥ 48 px de haut, icône + mot). */
export function PhoneSecondary({ icon: Icon, children, onClick }: { icon: LucideIcon; children: ReactNode; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex min-h-12 flex-1 items-center justify-center gap-2 rounded-2xl border border-line bg-white px-3 text-[16px] font-semibold text-ink shadow-card active:scale-[0.97]"
    >
      <Icon size={20} aria-hidden="true" className="text-accent" />
      {children}
    </button>
  )
}

/** Message de confirmation rassurant, affiché après chaque action. */
export function useConfirm(): [string | null, (msg: string) => void] {
  const [msg, setMsg] = useState<string | null>(null)
  const timer = useRef<number | undefined>(undefined)
  useEffect(() => () => window.clearTimeout(timer.current), [])
  const show = (m: string) => {
    setMsg(m)
    window.clearTimeout(timer.current)
    timer.current = window.setTimeout(() => setMsg(null), 3500)
  }
  return [msg, show]
}
