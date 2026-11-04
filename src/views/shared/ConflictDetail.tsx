/*
 * Détail d'un conflit de planning : l'explication en une phrase, les dossiers concernés, la solution proposée.
 * Utilisé dans la fenêtre d'alerte du gérant et dans le panneau de conflits du planificateur.
 */
import { CircleAlert, Lightbulb } from 'lucide-react'
import { useI18n } from '../../i18n'
import { byId, fullName } from '../../data/selectors'
import type { PlanConflict } from '../../data/types'
import { useDemo } from '../../store/demoStore'
import { conflictTexts } from './conflictText'

export function ConflictDetail({ conflict }: { conflict: PlanConflict }) {
  const { t, lang } = useI18n()
  const data = useDemo((s) => s.data)
  const texts = conflictTexts(conflict, data, t, lang)
  const moves = [conflict.moveId, conflict.otherMoveId].map((id) => byId(data.moves, id)).filter((m) => !!m)

  return (
    <div className="space-y-4">
      <p className="flex gap-2.5">
        <CircleAlert size={18} className="mt-1 shrink-0 text-danger" aria-hidden="true" />
        <span>
          <span className="font-semibold">{texts.titleWithDay}.</span> {texts.text}
        </span>
      </p>
      <ul className="divide-y divide-line rounded-xl border border-line">
        {moves.map((m) => {
          const chief = byId(data.staff, m.teamIds[0])
          return (
            <li key={m.id} className="flex items-center justify-between gap-3 px-4 py-3">
              <div>
                <p className="font-semibold">{byId(data.customers, m.customerId)?.name}</p>
                <p className="text-sm text-muted">
                  {m.ref} · {m.startTime} · {t(`moveType.${m.type}`)} · {t('common.volume', { n: m.volumeM3 })}
                </p>
              </div>
              {chief && <span className="whitespace-nowrap text-sm text-muted">{fullName(chief)}</span>}
            </li>
          )
        })}
      </ul>
      <p className={`flex gap-2.5 rounded-xl px-4 py-3 ${conflict.fix ? 'bg-success-soft text-ink' : 'bg-surface text-muted'}`}>
        <Lightbulb size={18} className={`mt-0.5 shrink-0 ${conflict.fix ? 'text-success' : 'text-muted'}`} aria-hidden="true" />
        {texts.fix}
      </p>
    </div>
  )
}
