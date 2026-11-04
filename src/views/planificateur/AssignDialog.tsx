/*
 * Fenêtre « Affecter » : choisir la date, l'équipe et le camion d'un dossier (alternative clavier au
 * glisser-déposer). Les conflits que cette affectation créerait sont affichés AVANT de valider.
 */
import { useEffect, useMemo, useState } from 'react'
import { CircleCheck, TriangleAlert } from 'lucide-react'
import { useI18n } from '../../i18n'
import { fmtDate } from '../../i18n/format'
import { useDemo } from '../../store/demoStore'
import { addDays } from '../../data/dates'
import { TRUCK_KINDS, detectConflicts } from '../../data/conflicts'
import { assignMoveData, suggestCrew } from '../../data/planning'
import { byId, customerOf, vehicleBusy } from '../../data/selectors'
import { Modal } from '../../ui/Modal'
import { Button } from '../../ui/Button'
import { Select } from '../../ui/Select'
import { toast } from '../../ui/Toast'
import { conflictTexts } from '../shared/conflictText'

export function AssignDialog({ moveId, onClose }: { moveId: string | null; onClose: () => void }) {
  const { t, lang } = useI18n()
  const data = useDemo((s) => s.data)
  const today = useDemo((s) => s.seedDay)
  const assignMove = useDemo((s) => s.assignMove)
  const move = byId(data.moves, moveId ?? undefined)

  const [date, setDate] = useState(today)
  const [crewId, setCrewId] = useState('')
  const [vehicleId, setVehicleId] = useState('')

  // Valeurs proposées à l'ouverture
  useEffect(() => {
    if (!move) return
    const d = move.date > today ? move.date : addDays(today, 1)
    const crew = suggestCrew(data, move.id, d)
    setDate(d)
    setCrewId(crew)
    setVehicleId(move.vehicleIds.find((v) => byId(data.vehicles, v)?.kind !== 'monteMeubles') ?? byId(data.teams, crew)?.defaultVehicleId ?? '')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [moveId])

  const preview = useMemo(() => {
    if (!move || !crewId || !vehicleId) return []
    const next = assignMoveData(data, move.id, { date, crewId, vehicleId })
    return detectConflicts(next).filter((c) => c.moveId === move.id || c.otherMoveId === move.id).map((c) => conflictTexts(c, next, t, lang))
  }, [data, move, date, crewId, vehicleId, t, lang])

  if (!move) return <Modal open={false} onClose={onClose} title="">{null}</Modal>

  const dates = Array.from({ length: 21 }, (_, i) => addDays(today, i))
  if (!dates.includes(date)) dates.unshift(date)
  const trucks = data.vehicles.filter((v) => TRUCK_KINDS.includes(v.kind))
  const teamName = (id: string) => t('planning.team', { name: byId(data.staff, byId(data.teams, id)?.leaderId)?.firstName ?? '' })

  return (
    <Modal
      open={!!moveId}
      onClose={onClose}
      title={t('assign.title', { client: customerOf(data, move)?.name ?? '' })}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            {t('common.cancel')}
          </Button>
          <Button
            onClick={() => {
              assignMove(move.id, { date, crewId, vehicleId })
              onClose()
              toast(t('assign.done', { team: teamName(crewId), day: fmtDate(date, lang, 'weekday') }))
            }}
          >
            {t('assign.confirm')}
          </Button>
        </>
      }
    >
      <p className="mb-4 text-muted">
        {move.ref} · {t(`moveType.${move.type}`)} · {t('common.volume', { n: move.volumeM3 })} · {t('assign.wished', { day: fmtDate(move.date, lang, 'dayMonth') })}
      </p>
      <div className="grid gap-3 sm:grid-cols-3">
        <Select
          label={t('assign.date')}
          value={date}
          onChange={setDate}
          options={dates.map((d) => ({ value: d, label: fmtDate(d, lang, 'weekday') }))}
        />
        <Select label={t('assign.team')} value={crewId} onChange={setCrewId} options={data.teams.map((tm) => ({ value: tm.id, label: teamName(tm.id) }))} />
        <Select
          label={t('assign.truck')}
          value={vehicleId}
          onChange={setVehicleId}
          options={trucks.map((v) => ({
            value: v.id,
            label: `${v.plate} · ${v.volumeM3} m³${vehicleBusy(data, v, date) && !move.vehicleIds.includes(v.id) ? ` · ${t('assign.busy')}` : ''}`,
          }))}
        />
      </div>
      <div className="mt-4" aria-live="polite">
        {preview.length === 0 ? (
          <p className="flex items-center gap-2 rounded-xl bg-success-soft px-4 py-3 text-success">
            <CircleCheck size={18} aria-hidden="true" />
            {t('assign.noConflict')}
          </p>
        ) : (
          <div className="rounded-xl bg-warning-soft px-4 py-3">
            <p className="flex items-center gap-2 font-semibold text-warning">
              <TriangleAlert size={18} aria-hidden="true" />
              {t('assign.willConflict', { n: preview.length })}
            </p>
            <ul className="mt-1.5 list-disc space-y-1 pl-6 text-ink">
              {preview.map((p) => (
                <li key={p.text}>{p.text}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </Modal>
  )
}
