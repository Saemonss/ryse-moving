/*
 * Planning partagé (gérant en lecture, planificateur en modification).
 * - Vue semaine : une ligne par équipe puis par véhicule, une colonne par jour ; semaine précédente / suivante,
 *   « Aujourd'hui ». Chaque dossier est un bloc coloré par type ; un conflit est entouré de rouge.
 * - Vue jour : horaires et trajets de chaque équipe (dépôt → départ → arrivée → dépôt).
 * - Modification (planificateur) : glisser un dossier sur une case équipe/jour → onDrop.
 */
import { useMemo, useState, type ReactNode } from 'react'
import { ChevronLeft, ChevronRight, MapPin } from 'lucide-react'
import { useI18n } from '../../../i18n'
import { fmtDate, fmtNumber } from '../../../i18n/format'
import { useDemo } from '../../../store/demoStore'
import { addDays, at, startOfWeek } from '../../../data/dates'
import { detectConflicts } from '../../../data/conflicts'
import { legKm } from '../../../data/geo'
import { byId, cityName, customerOf, fullName } from '../../../data/selectors'
import type { ISODate, Move, Team } from '../../../data/types'
import { Button } from '../../../ui/Button'
import { Tabs } from '../../../ui/Tabs'
import { Avatar } from '../../../ui/Avatar'
import { MoveBlock, TYPE_COLORS, TypeLegend } from './planningKit'

const SHOWN = ['planifie', 'enCours', 'termine', 'facture', 'paye']

interface PlanningProps {
  editable?: boolean
  onOpenMove: (moveId: string) => void
  onDrop?: (moveId: string, crewId: string, date: ISODate) => void
  /** Contenu ajouté à droite de la barre d'outils (ex. « Publier »). */
  toolbar?: ReactNode
}

export function Planning({ editable = false, onOpenMove, onDrop, toolbar }: PlanningProps) {
  const { t, lang } = useI18n()
  const data = useDemo((s) => s.data)
  const today = useDemo((s) => s.seedDay)
  const [monday, setMonday] = useState(() => startOfWeek(today))
  const [mode, setMode] = useState<'week' | 'day'>('week')
  const [day, setDay] = useState<ISODate>(today)
  const [over, setOver] = useState<string | null>(null)

  const days = Array.from({ length: 7 }, (_, i) => addDays(monday, i))
  const conflicted = useMemo(() => new Set(detectConflicts(data).flatMap((c) => (c.otherMoveId ? [c.moveId, c.otherMoveId] : [c.moveId]))), [data])
  const shown = data.moves.filter((m) => SHOWN.includes(m.status))
  const crewOf = (m: Move) => m.crewId ?? data.teams.find((tm) => tm.leaderId === m.teamIds[0])?.id

  const goToday = () => {
    setMonday(startOfWeek(today))
    setDay(today)
  }
  const shift = (n: number) => {
    setMonday((d) => addDays(d, n * 7))
    setDay((d) => addDays(d, n * 7))
  }
  const changeMode = (m: 'week' | 'day') => {
    setMode(m)
    if (m === 'week') setMonday(startOfWeek(day))
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <Tabs
          label={t('planning.viewMode')}
          value={mode}
          onChange={changeMode}
          tabs={[
            { id: 'week', label: t('planning.weekView') },
            { id: 'day', label: t('planning.dayView') },
          ]}
        />
        <div className="flex items-center gap-1">
          <Button size="sm" variant="secondary" icon={ChevronLeft} aria-label={t(mode === 'week' ? 'planning.prev' : 'planning.prevDay')} onClick={() => (mode === 'week' ? shift(-1) : setDay((d) => addDays(d, -1)))} />
          <Button
            size="sm"
            variant="secondary"
            onClick={goToday}
            aria-pressed={mode === 'week' ? monday === startOfWeek(today) : day === today}
          >
            {t('planning.today')}
          </Button>
          <Button size="sm" variant="secondary" icon={ChevronRight} aria-label={t(mode === 'week' ? 'planning.next' : 'planning.nextDay')} onClick={() => (mode === 'week' ? shift(1) : setDay((d) => addDays(d, 1)))} />
        </div>
        <h2 className="text-[17px] font-semibold tracking-[-0.01em] text-ink first-letter:uppercase" aria-live="polite">
          {mode === 'week'
            ? t('planning.weekTitle', { from: fmtDate(days[0]!, lang, 'dayMonth'), to: fmtDate(days[6]!, lang, 'dayMonth') })
            : fmtDate(day, lang, 'long')}
        </h2>
        <div className="ml-auto flex items-center gap-2">{toolbar}</div>
      </div>

      {mode === 'week' ? (
        <div className="overflow-x-auto rounded-2xl border border-line/80 bg-white shadow-card">
          <div className="grid min-w-[900px]" style={{ gridTemplateColumns: '156px repeat(7, minmax(0, 1fr))' }}>
            <div className="sticky left-0 border-b border-line bg-white" />
            {days.map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => {
                  setDay(d)
                  setMode('day')
                }}
                aria-label={t('planning.openDay', { day: fmtDate(d, lang, 'weekday') })}
                className={`border-b border-l border-line px-2 py-2.5 text-left transition-colors hover:bg-surface ${d === today ? 'bg-surface-2/60' : ''}`}
              >
                <span className={`block text-[13px] capitalize ${d === today ? 'font-semibold text-accent' : 'text-muted'}`}>
                  {new Intl.DateTimeFormat(lang === 'nl' ? 'nl-BE' : 'fr-BE', { weekday: 'short' }).format(new Date(`${d}T12:00`))}
                </span>
                <span className={`tabular block text-[15px] font-semibold ${d === today ? 'text-accent' : 'text-ink'}`}>{fmtDate(d, lang, 'dayMonth')}</span>
              </button>
            ))}

            <SectionRow label={t('planning.teams')} />
            {data.teams.map((team) => (
              <Row key={team.id} label={<TeamLabel team={team} />}>
                {days.map((d) => {
                  const cell = `${team.id}|${d}`
                  const moves = shown.filter((m) => m.date === d && crewOf(m) === team.id).sort((a, b) => a.startTime.localeCompare(b.startTime))
                  return (
                    <div
                      key={d}
                      data-cell={cell}
                      onDragOver={(e) => {
                        if (!editable || !e.dataTransfer.types.includes('text/move')) return
                        e.preventDefault()
                        setOver(cell)
                      }}
                      onDragLeave={() => setOver((o) => (o === cell ? null : o))}
                      onDrop={(e) => {
                        const id = e.dataTransfer.getData('text/move')
                        setOver(null)
                        if (editable && id && onDrop) onDrop(id, team.id, d)
                      }}
                      className={`min-h-[76px] space-y-1.5 border-l border-t border-line p-1.5 transition-colors ${d < today ? 'bg-surface/50' : ''} ${
                        over === cell ? 'bg-accent-pale/40 outline-2 -outline-offset-2 outline-dashed outline-accent' : ''
                      }`}
                    >
                      {moves.map((m) => (
                        <MoveBlock key={m.id} move={m} data={data} conflict={conflicted.has(m.id)} draggable={editable && m.date >= today && m.status === 'planifie'} onOpen={() => onOpenMove(m.id)} />
                      ))}
                    </div>
                  )
                })}
              </Row>
            ))}

            <SectionRow label={t('planning.vehicles')} />
            {data.vehicles.map((v) => (
              <Row
                key={v.id}
                label={
                  <span className="min-w-0">
                    <span className="block truncate text-[13px] font-semibold text-ink">{v.plate}</span>
                    <span className="block truncate text-xs text-muted">{t(`vehicleKind.${v.kind}`)}</span>
                  </span>
                }
              >
                {days.map((d) => {
                  const moves = shown.filter((m) => m.date === d && m.vehicleIds.includes(v.id))
                  return (
                    <div key={d} className={`min-h-[44px] space-y-1 border-l border-t border-line p-1.5 ${d < today ? 'bg-surface/50' : ''}`}>
                      {moves.map((m) => (
                        <MoveBlock key={m.id} move={m} data={data} conflict={conflicted.has(m.id)} compact onOpen={() => onOpenMove(m.id)} />
                      ))}
                    </div>
                  )
                })}
              </Row>
            ))}
          </div>
        </div>
      ) : (
        <DayPlanning day={day} onOpenMove={onOpenMove} conflicted={conflicted} />
      )}

      <TypeLegend />
    </div>
  )
}

function SectionRow({ label }: { label: string }) {
  return (
    <div className="col-span-8 border-t border-line bg-surface/70 px-4 py-1.5 text-[12px] font-semibold uppercase tracking-[0.04em] text-muted">{label}</div>
  )
}

function Row({ label, children }: { label: ReactNode; children: ReactNode }) {
  return (
    <>
      <div className="sticky left-0 z-10 flex items-center border-t border-line bg-white px-4 py-2">{label}</div>
      {children}
    </>
  )
}

function TeamLabel({ team }: { team: Team }) {
  const { t } = useI18n()
  const data = useDemo((s) => s.data)
  const leader = byId(data.staff, team.leaderId)
  return (
    <span className="min-w-0">
      <span className="block truncate text-[13px] font-semibold text-ink">{t('planning.team', { name: leader?.firstName ?? '' })}</span>
      <span className="mt-1 flex -space-x-1">
        {team.memberIds.map((id) => {
          const s = byId(data.staff, id)
          return s ? <Avatar key={id} name={fullName(s)} size={20} className="ring-2 ring-white" /> : null
        })}
      </span>
    </span>
  )
}

/** Vue jour : pour chaque équipe, ses dossiers avec horaires et trajets. */
function DayPlanning({ day, onOpenMove, conflicted }: { day: ISODate; onOpenMove: (id: string) => void; conflicted: Set<string> }) {
  const { t, lang } = useI18n()
  const data = useDemo((s) => s.data)
  const moves = data.moves.filter((m) => m.date === day && SHOWN.includes(m.status)).sort((a, b) => a.startTime.localeCompare(b.startTime))
  if (!moves.length) return <p className="rounded-2xl border border-line/80 bg-white px-5 py-10 text-center text-muted shadow-card">{t('planning.emptyDay')}</p>

  const time = (d: Date) => new Intl.DateTimeFormat(lang === 'nl' ? 'nl-BE' : 'fr-BE', { hour: '2-digit', minute: '2-digit' }).format(d)
  return (
    <ul className="space-y-3">
      {moves.map((m) => {
        const team = data.teams.find((tm) => tm.id === m.crewId)
        const depot = team?.agencyId === 'a-lille' ? 'lille' : 'nivelles'
        const start = at(m.date, m.startTime)
        const end = new Date(start.getTime() + m.plannedHours * 3_600_000)
        const stops = [depot, m.from.cityId, ...(m.to ? [m.to.cityId] : []), depot]
        const leader = byId(data.staff, m.teamIds[0])
        return (
          <li key={m.id} className={`rounded-2xl border bg-white p-4 shadow-card ${conflicted.has(m.id) ? 'border-danger' : 'border-line/80'}`}>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
              <span className="size-2.5 rounded-full" style={{ background: TYPE_COLORS[m.type].dot }} aria-hidden="true" />
              <span className="tabular text-[15px] font-semibold">
                {t('planning.slot', { start: time(start), end: time(end) })}
              </span>
              <button type="button" data-crawl-sample onClick={() => onOpenMove(m.id)} className="font-semibold text-accent underline-offset-4 hover:underline">
                {customerOf(data, m)?.name}
              </button>
              <span className="text-sm text-muted">
                {t(`moveType.${m.type}`)} · {t('common.volume', { n: m.volumeM3 })} · {leader ? t('planning.team', { name: leader.firstName }) : ''} ·{' '}
                {m.vehicleIds.map((id) => byId(data.vehicles, id)?.plate).join(' + ')}
              </span>
            </div>
            <ol className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-2 text-sm">
              {stops.map((city, i) => (
                <li key={`${city}-${i}`} className="flex items-center gap-2">
                  {i > 0 && (
                    <span className="tabular rounded-full bg-surface px-2 py-0.5 text-xs text-muted">
                      {t('planning.leg', { km: fmtNumber(legKm(stops[i - 1]!, city), lang), min: legKm(stops[i - 1]!, city) })}
                    </span>
                  )}
                  <span className="inline-flex items-center gap-1 font-medium text-ink">
                    <MapPin size={14} className="text-muted" aria-hidden="true" />
                    {i === 0 || i === stops.length - 1 ? t('planning.depot', { city: cityName(city, lang) }) : cityName(city, lang)}
                  </span>
                </li>
              ))}
            </ol>
          </li>
        )
      })}
    </ul>
  )
}
