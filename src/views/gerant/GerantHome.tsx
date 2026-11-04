/*
 * Accueil du gérant : l'essentiel en un coup d'œil (divulgation progressive), chaque bloc mène à son écran.
 * 1. Les déménagements du jour et leur avancement  2. Les alertes, chacune avec son action
 * 3. Le chiffre d'affaires et la marge du mois  4. Les actions à faire
 */
import { useEffect, useMemo, useState } from 'react'
import { CalendarCheck, ClipboardList, FileSignature, Inbox, Receipt } from 'lucide-react'
import { useI18n } from '../../i18n'
import { fmtDate, fmtMoney } from '../../i18n/format'
import { useDemo } from '../../store/demoStore'
import { deriveAlerts } from '../../data/scenarios'
import { moveMargin } from '../../data/margin'
import { at } from '../../data/dates'
import { STATUS_TONE, byId, cityName, customerOf, movesOn } from '../../data/selectors'
import type { Alert, Move, MoveStatus } from '../../data/types'
import { Card } from '../../ui/Card'
import { StatusBadge } from '../../ui/StatusBadge'
import { ActionAlert } from '../../ui/ActionAlert'
import { Avatar } from '../../ui/Avatar'
import { PageHeader } from '../shared/Page'
import { ScreenLink } from '../shared/ScreenLink'
import { useViewUser } from '../../app/shellState'
import { go } from '../../app/router'
import { isScreenReady } from '../../app/views'
import { alertContent } from './alertContent'
import { AlertDialog } from './AlertDialog'

/** Avancement d'un déménagement du jour, estimé à partir de l'heure de départ et de la durée prévue. */
function progressOf(move: Move, now: Date): { pct: number; step: 'waiting' | 'late' | 'road' | 'loading' | 'delivery' | 'finishing' | 'done' } {
  if (['termine', 'facture', 'paye'].includes(move.status)) return { pct: 100, step: 'done' }
  if (move.status !== 'enCours' || !move.startedAt) {
    return { pct: 0, step: now > at(move.date, move.startTime) ? 'late' : 'waiting' }
  }
  const elapsed = (now.getTime() - new Date(move.startedAt).getTime()) / 60_000
  const pct = Math.max(3, Math.min(97, Math.round((elapsed / (move.plannedHours * 60)) * 100)))
  return { pct, step: pct < 15 ? 'road' : pct < 55 ? 'loading' : pct < 90 ? 'delivery' : 'finishing' }
}

export function GerantHome() {
  const { t, lang } = useI18n()
  const data = useDemo((s) => s.data)
  const today = useDemo((s) => s.seedDay)
  const user = useViewUser('gerant')
  const [openAlert, setOpenAlert] = useState<Alert | null>(null)
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 60_000)
    return () => window.clearInterval(id)
  }, [])

  const alerts = useMemo(
    () => deriveAlerts(data, today).filter((a) => a.kind !== 'lowMargin' || isScreenReady('gerant', 'rentabilite')),
    [data, today],
  )
  const todayMoves = movesOn(data, today)

  // Chiffre d'affaires et marge du mois = réalisé (terminé, facturé, payé) + planifié (planifié, en cours)
  const month = today.slice(0, 7)
  const ofMonth = data.moves.filter((m) => m.date.startsWith(month) && ['planifie', 'enCours', 'termine', 'facture', 'paye'].includes(m.status))
  const revenue = ofMonth.reduce((sum, m) => sum + m.priceCents, 0)
  const realised = ofMonth.filter((m) => ['termine', 'facture', 'paye'].includes(m.status)).reduce((sum, m) => sum + m.priceCents, 0)
  const margin = ofMonth.reduce((sum, m) => sum + moveMargin(m, data).cents, 0)
  const marginRate = revenue ? margin / revenue : 0
  const lowMarginRate = marginRate * 100 < data.settings.marginThresholdPct
  const count = (s: MoveStatus) => data.moves.filter((m) => m.status === s).length

  const todos: { icon: typeof Inbox; label: string; status: MoveStatus }[] = [
    { icon: Inbox, label: t('gerant.todoRequests', { n: count('demande') }), status: 'demande' },
    { icon: ClipboardList, label: t('gerant.todoVisits', { n: count('visite') }), status: 'visite' },
    { icon: FileSignature, label: t('gerant.todoToPlan', { n: count('devisSigne') }), status: 'devisSigne' },
    { icon: Receipt, label: t('gerant.todoToInvoice', { n: count('termine') }), status: 'termine' },
  ]

  const onAlert = (a: Alert) => (a.kind === 'lowMargin' ? go('gerant', 'rentabilite') : setOpenAlert(a))

  return (
    <>
      <PageHeader title={t('gerant.hello', { name: user.firstName })} subtitle={fmtDate(today, lang, 'long')} />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_400px]">
        <Card
          title={t('gerant.todayTitle')}
          aside={
            <ScreenLink view="gerant" screen="planning" arrow className="text-sm">
              {t('gerant.seePlanning')}
            </ScreenLink>
          }
          padded={false}
        >
          {todayMoves.length === 0 ? (
            <p className="px-5 py-8 text-center text-[15px] text-muted">{t('gerant.noMovesToday')}</p>
          ) : (
            <ul className="divide-y divide-line/70">
              {todayMoves.map((m) => {
                const p = progressOf(m, now)
                return (
                  <li key={m.id} className="grid grid-cols-[56px_minmax(0,1fr)_auto] items-center gap-x-4 gap-y-2 px-5 py-3.5">
                    <span className="tabular font-semibold">{m.startTime}</span>
                    <div className="min-w-0">
                      <ScreenLink view="gerant" screen="dossier" param={m.id} fallback className="font-medium text-ink">
                        {customerOf(data, m)?.name}
                      </ScreenLink>
                      <p className="truncate text-[13px] text-muted">
                        <span className="text-ink/80">
                          {cityName(m.from.cityId, lang)} → {m.to ? cityName(m.to.cityId, lang) : t(m.type === 'debarras' ? 'common.recycling' : 'common.storage')}
                        </span>
                        {' · '}
                        {t(`moveType.${m.type}`)} · {t('common.volume', { n: m.volumeM3 })} · {byId(data.vehicles, m.vehicleIds[0])?.plate}
                      </p>
                    </div>
                    <span className="flex -space-x-1.5">
                      {m.teamIds.map((id) => {
                        const s = byId(data.staff, id)
                        return s ? <Avatar key={id} name={`${s.firstName} ${s.lastName}`} size={26} className="ring-2 ring-white" /> : null
                      })}
                    </span>
                    <div className="col-start-2 col-end-4 flex items-center gap-3">
                      <div
                        className="h-1.5 flex-1 overflow-hidden rounded-full bg-surface-2"
                        role="progressbar"
                        aria-valuenow={p.pct}
                        aria-valuemin={0}
                        aria-valuemax={100}
                        aria-label={t(`gerant.progress.${p.step}`, { time: m.startTime })}
                      >
                        <div
                          className={`h-full rounded-full transition-[width] duration-500 ease-out ${p.step === 'done' ? 'bg-success' : 'bg-accent'}`}
                          style={{ width: `${p.pct}%` }}
                        />
                      </div>
                      <span className={`whitespace-nowrap text-[13px] font-medium ${p.step === 'late' ? 'text-warning' : 'text-muted'}`}>
                        {t(`gerant.progress.${p.step}`, { time: m.startTime })}
                      </span>
                      <StatusBadge tone={STATUS_TONE[m.status]}>{t(`status.${m.status}`)}</StatusBadge>
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </Card>

        <Card
          title={t('gerant.alertsTitle')}
          aside={alerts.length > 0 && <StatusBadge tone="danger">{t('gerant.alertsCount', { n: alerts.length })}</StatusBadge>}
        >
          {alerts.length === 0 ? (
            <p className="flex items-center gap-2 py-6 text-[15px] text-success">
              <CalendarCheck size={18} aria-hidden="true" />
              {t('gerant.alertsEmpty')}
            </p>
          ) : (
            <div className="-my-1 divide-y divide-line">
              {alerts.map((a) => {
                const c = alertContent(a, data, t, lang)
                return <ActionAlert key={a.id} tone={a.tone} title={c.title} text={c.text} actionLabel={c.action} onAction={() => onAlert(a)} />
              })}
            </div>
          )}
        </Card>

        <Card
          title={t('gerant.revenueTitle')}
          aside={
            <ScreenLink view="gerant" screen="rentabilite" arrow className="text-sm">
              {t('gerant.seeProfit')}
            </ScreenLink>
          }
        >
          <div className="flex flex-wrap items-end gap-x-8 gap-y-2">
            <p className="tabular text-[34px] font-semibold leading-none tracking-[-0.03em] text-ink">{fmtMoney(revenue, lang, false)}</p>
            <p className={`tabular pb-0.5 text-[15px] font-medium ${lowMarginRate ? 'text-danger' : 'text-success'}`}>
              {t('gerant.marginOfMonth', { pct: Math.round(marginRate * 100), amount: fmtMoney(margin, lang, false) })}
            </p>
          </div>
          <div className="mt-4 h-2 overflow-hidden rounded-full bg-surface-2" aria-hidden="true">
            <div className="h-full rounded-full bg-success" style={{ width: `${revenue ? (realised / revenue) * 100 : 0}%` }} />
          </div>
          <ul className="tabular mt-3 flex flex-wrap gap-x-6 gap-y-1 text-sm">
            <li className="flex items-center gap-1.5 text-ink">
              <span className="size-2 rounded-full bg-success" aria-hidden="true" />
              {t('gerant.revenueDone', { amount: fmtMoney(realised, lang, false) })}
            </li>
            <li className="flex items-center gap-1.5 text-ink">
              <span className="size-2 rounded-full bg-surface-2 ring-1 ring-accent-pale" aria-hidden="true" />
              {t('gerant.revenuePlanned', { amount: fmtMoney(revenue - realised, lang, false) })}
            </li>
            <li className="text-muted">{t('gerant.revenueMoves', { n: ofMonth.length })}</li>
          </ul>
        </Card>

        <Card title={t('gerant.todoTitle')}>
          <ul className="space-y-2.5">
            {todos.map(({ icon: Icon, label, status }) => (
              <li key={status} className="flex items-center gap-3 text-[15px] text-ink">
                <Icon size={18} className="shrink-0 text-muted" aria-hidden="true" />
                <ScreenLink view="gerant" screen="demenagements" param={status} fallback className="tabular text-ink">
                  {label}
                </ScreenLink>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      <AlertDialog alert={openAlert} onClose={() => setOpenAlert(null)} />
    </>
  )
}
