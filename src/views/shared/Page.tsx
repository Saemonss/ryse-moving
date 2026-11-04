/*
 * Éléments partagés par les accueils : en-tête de page, chiffres clés en ligne, aperçu des prochaines étapes.
 */
import type { ReactNode } from 'react'
import { ArrowUpRight } from 'lucide-react'
import { useI18n, type TKey } from '../../i18n'
import { StatusBadge } from '../../ui/StatusBadge'

export function PageHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <header className="mb-7">
      <h1 className="text-[28px] font-semibold leading-tight tracking-[-0.025em] text-ink text-balance">{title}</h1>
      {subtitle && <p className="mt-1.5 text-[15px] text-muted first-letter:uppercase">{subtitle}</p>}
    </header>
  )
}

/** Quelques chiffres sur une seule bande (pas une grille de cartes identiques). */
export function FactStrip({ facts }: { facts: { label: string; value: ReactNode; tone?: 'danger' }[] }) {
  return (
    <dl className="mb-6 flex flex-wrap divide-line rounded-2xl border border-line/80 bg-white shadow-card sm:divide-x">
      {facts.map((f) => (
        <div key={f.label} className="min-w-[180px] flex-1 px-5 py-4">
          <dt className="text-[13px] font-medium text-muted">{f.label}</dt>
          <dd className={`tabular mt-1 text-2xl font-semibold tracking-[-0.02em] ${f.tone === 'danger' ? 'text-danger' : 'text-ink'}`}>{f.value}</dd>
        </div>
      ))}
    </dl>
  )
}

/** Ce qui arrivera dans cette vue aux étapes suivantes (texte seulement, aucun bouton). */
export function UpcomingPreview({ items, compact = false }: { items: TKey[]; compact?: boolean }) {
  const { t } = useI18n()
  return (
    <section className={`self-start rounded-2xl border border-dashed border-accent-pale bg-white/60 ${compact ? 'p-4' : 'p-5'}`}>
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <h2 className={`font-semibold text-ink ${compact ? 'text-[17px]' : 'text-[15px]'}`}>{t('common.previewTitle')}</h2>
        <StatusBadge tone="accent">{t('common.previewTag')}</StatusBadge>
      </div>
      <ul className="space-y-2">
        {items.map((k) => (
          <li key={k} className={`flex items-start gap-2.5 text-ink/85 ${compact ? 'text-[17px] leading-snug' : 'text-[15px]'}`}>
            <ArrowUpRight size={18} className="mt-0.5 shrink-0 text-accent" aria-hidden="true" />
            {t(k)}
          </li>
        ))}
      </ul>
    </section>
  )
}
