/*
 * Frise du fil rouge d'un dossier : demande → devis → planifié → en cours → terminé → facturé → payé.
 * Les étapes franchies sont pleines (avec leur date), l'étape en cours est mise en avant.
 */
import { Check } from 'lucide-react'
import { useI18n } from '../../i18n'
import { fmtDate } from '../../i18n/format'
import type { Move, MoveStatus } from '../../data/types'

const STEPS = ['request', 'quote', 'planned', 'started', 'done', 'invoiced', 'paid'] as const
const STEP_OF: Record<MoveStatus, number> = { demande: 0, visite: 0, devisEnvoye: 1, devisSigne: 1, planifie: 2, enCours: 3, termine: 4, facture: 5, paye: 6 }

export function Timeline({ move }: { move: Move }) {
  const { t, lang } = useI18n()
  const current = STEP_OF[move.status]
  const dates: (string | undefined)[] = [
    move.requestedOn,
    move.signedOn ?? move.quoteSentOn,
    move.status === 'planifie' || current > 2 ? move.date : undefined,
    move.startedAt?.slice(0, 10) ?? (current > 3 ? move.date : undefined),
    current > 3 ? move.date : undefined,
    move.invoicedOn,
    move.paidOn,
  ]
  return (
    <ol className="grid grid-cols-7 gap-1 pt-1">
      {STEPS.map((step, i) => {
        const reached = i <= current
        const isCurrent = i === current
        const date = dates[i]
        return (
          <li key={step} className="relative flex flex-col items-center text-center" aria-current={isCurrent ? 'step' : undefined}>
            {i > 0 && (
              <span aria-hidden="true" className={`absolute right-1/2 top-[13px] h-0.5 w-[calc(100%+0.25rem)] ${i <= current ? 'bg-accent' : 'bg-line'}`} />
            )}
            <span
              className={`relative z-10 grid size-7 place-items-center rounded-full text-[13px] font-semibold ${
                isCurrent ? 'bg-accent text-white ring-4 ring-accent-pale' : reached ? 'bg-accent text-white' : 'border-2 border-line bg-white text-subtle'
              }`}
            >
              {reached && !isCurrent ? <Check size={15} strokeWidth={3} aria-hidden="true" /> : i + 1}
            </span>
            <span className={`mt-2 text-[13px] leading-tight ${isCurrent ? 'font-semibold text-ink' : reached ? 'text-ink' : 'text-muted'}`}>{t(`file.steps.${step}`)}</span>
            <span className="tabular mt-0.5 h-4 text-xs text-muted">{reached && date ? fmtDate(date, lang, 'dayMonth') : ''}</span>
          </li>
        )
      })}
    </ol>
  )
}
