/*
 * Planificateur › Planning : dossiers à planifier (à glisser ou « Affecter »), conflits en direct avec « Résoudre »,
 * planning de la semaine modifiable, et « Publier le planning » (envoi simulé aux équipes).
 */
import { useMemo, useState } from 'react'
import { GripVertical, Send, TriangleAlert } from 'lucide-react'
import { useI18n } from '../../i18n'
import { fmtDate, fmtTime } from '../../i18n/format'
import { useDemo } from '../../store/demoStore'
import { detectConflicts } from '../../data/conflicts'
import { byId, cityName, customerOf } from '../../data/selectors'
import type { ISODate, PlanConflict } from '../../data/types'
import { Card } from '../../ui/Card'
import { Button } from '../../ui/Button'
import { toast } from '../../ui/Toast'
import { PageHeader } from '../shared/Page'
import { Planning } from '../shared/planning/Planning'
import { TYPE_COLORS } from '../shared/planning/planningKit'
import { conflictTexts } from '../shared/conflictText'
import { AssignDialog } from './AssignDialog'
import { MoveSummaryDialog } from './MoveSummaryDialog'
import { PLANNABLE } from '../../data/planning'
import { PublishDialog } from './PublishDialog'

export function PlanificateurPlanning() {
  const { t, lang } = useI18n()
  const data = useDemo((s) => s.data)
  const today = useDemo((s) => s.seedDay)
  const assignMove = useDemo((s) => s.assignMove)
  const [assigning, setAssigning] = useState<string | null>(null)
  const [viewing, setViewing] = useState<string | null>(null)
  const [publishing, setPublishing] = useState(false)
  /** Dossier encore planifiable → « Affecter » ; sinon (en cours, réalisé) → résumé en lecture seule. */
  const openMove = (id: string) => (PLANNABLE.includes(byId(data.moves, id)?.status ?? '') ? setAssigning(id) : setViewing(id))

  const toPlan = data.moves.filter((m) => m.status === 'devisSigne').sort((a, b) => a.date.localeCompare(b.date))
  const conflicts = useMemo(() => detectConflicts(data).filter((c) => c.date >= today), [data, today])

  const onDrop = (moveId: string, crewId: string, date: ISODate) => {
    const move = byId(data.moves, moveId)
    if (!move || !PLANNABLE.includes(move.status)) return
    if (date < today) {
      toast(t('planif.pastRefused'), 'info')
      return
    }
    const team = byId(data.teams, crewId)
    const truck = move.vehicleIds.find((v) => byId(data.vehicles, v)?.kind !== 'monteMeubles') ?? team?.defaultVehicleId ?? ''
    assignMove(moveId, { date, crewId, vehicleId: truck })
    toast(t('assign.done', { team: t('planning.team', { name: byId(data.staff, team?.leaderId)?.firstName ?? '' }), day: fmtDate(date, lang, 'weekday') }))
  }

  return (
    <>
      <PageHeader title={t('planning.title')} subtitle={t('planif.subtitle')} />

      {toPlan.length > 0 && (
        <Card title={t('planif.toPlanTitle')} aside={<span className="text-[13px] text-muted">{t('planif.dragHint')}</span>} className="mb-4">
          <ul className="flex flex-wrap gap-3">
            {toPlan.map((m) => (
              <li
                key={m.id}
                draggable
                onDragStart={(e) => {
                  e.dataTransfer.setData('text/move', m.id)
                  e.dataTransfer.effectAllowed = 'move'
                }}
                data-move={m.id}
                className="flex min-w-[250px] flex-1 cursor-grab items-center gap-3 rounded-xl border border-line bg-white px-3 py-2.5 shadow-card active:cursor-grabbing"
                style={{ maxWidth: 340 }}
              >
                <GripVertical size={16} className="shrink-0 text-subtle" aria-hidden="true" />
                <span className="size-2.5 shrink-0 rounded-full" style={{ background: TYPE_COLORS[m.type].dot }} aria-hidden="true" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[15px] font-semibold">{customerOf(data, m)?.name}</p>
                  <p className="truncate text-[13px] text-muted">
                    {fmtDate(m.date, lang, 'dayMonth')} · {cityName(m.from.cityId, lang)} · {m.volumeM3} m³
                  </p>
                </div>
                <Button size="sm" variant="secondary" onClick={() => setAssigning(m.id)}>
                  {t('planif.assign')}
                </Button>
              </li>
            ))}
          </ul>
        </Card>
      )}

      {conflicts.length > 0 && <ConflictPanel conflicts={conflicts} />}

      <Planning
        editable
        onOpenMove={openMove}
        onDrop={onDrop}
        toolbar={
          <>
            {data.published && (
              <span className="text-[13px] text-muted">
                {t('planif.publishedAt', { time: fmtTime(data.published.at, lang), n: data.published.staffIds.length })}
              </span>
            )}
            <Button size="sm" icon={Send} onClick={() => setPublishing(true)}>
              {t('planif.publish')}
            </Button>
          </>
        }
      />

      <AssignDialog moveId={assigning} onClose={() => setAssigning(null)} />
      <MoveSummaryDialog moveId={viewing} onClose={() => setViewing(null)} />
      <PublishDialog open={publishing} onClose={() => setPublishing(false)} />
    </>
  )
}

function ConflictPanel({ conflicts }: { conflicts: PlanConflict[] }) {
  const { t, lang } = useI18n()
  const data = useDemo((s) => s.data)
  const resolveConflict = useDemo((s) => s.resolveConflict)
  return (
    <section aria-labelledby="conflicts-title" className="mb-4 rounded-2xl border border-danger/25 bg-danger-soft/60 px-5 py-4">
      <h2 id="conflicts-title" className="flex items-center gap-2 text-[15px] font-semibold text-danger">
        <TriangleAlert size={18} aria-hidden="true" />
        {t('planif.conflictsTitle', { n: conflicts.length })}
      </h2>
      <ul className="mt-2 divide-y divide-danger/15">
        {conflicts.map((c) => {
          const txt = conflictTexts(c, data, t, lang)
          return (
            <li key={c.id} className="flex flex-wrap items-center gap-x-4 gap-y-2 py-2.5">
              <div className="min-w-0 flex-1">
                <p className="text-[15px] font-semibold text-ink">{txt.titleWithDay}</p>
                <p className="text-sm text-ink/80">{txt.text}</p>
                <p className="text-sm text-muted">{txt.fix}</p>
              </div>
              {c.fix && (
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => {
                    const ok = resolveConflict(c)
                    toast(ok ? t('conflicts.done') : t('conflicts.stale'), ok ? 'success' : 'info')
                  }}
                >
                  {t('conflicts.resolve')}
                </Button>
              )}
            </li>
          )
        })}
      </ul>
    </section>
  )
}
