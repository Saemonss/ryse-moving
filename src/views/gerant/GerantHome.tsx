/*
 * Accueil du gérant : l'essentiel en un coup d'œil (divulgation progressive).
 * 1. Les déménagements du jour  2. Les alertes, chacune avec son action  3. Le chiffre d'affaires du mois  4. À faire
 */
import { useMemo, useState } from 'react'
import { CalendarCheck, ClipboardList, FileSignature, Inbox, Receipt } from 'lucide-react'
import { useI18n } from '../../i18n'
import { fmtDate, fmtMoney } from '../../i18n/format'
import { useDemo } from '../../store/demoStore'
import { deriveAlerts } from '../../data/scenarios'
import { STATUS_TONE, byId, cityName, customerOf, movesOn } from '../../data/selectors'
import type { Alert, Move } from '../../data/types'
import { Card } from '../../ui/Card'
import { SimpleTable } from '../../ui/SimpleTable'
import { StatusBadge } from '../../ui/StatusBadge'
import { ActionAlert } from '../../ui/ActionAlert'
import { Avatar } from '../../ui/Avatar'
import { PageHeader } from '../shared/Page'
import { useViewUser } from '../../app/shellState'
import { alertContent } from './alertContent'
import { AlertDialog } from './AlertDialog'

export function GerantHome() {
  const { t, lang } = useI18n()
  const data = useDemo((s) => s.data)
  const today = useDemo((s) => s.seedDay)
  const user = useViewUser('gerant')
  const [openAlert, setOpenAlert] = useState<Alert | null>(null)

  // L'alerte « marge faible » apparaîtra avec l'écran Rentabilité (lot 6).
  const alerts = useMemo(() => deriveAlerts(data, today).filter((a) => a.kind !== 'lowMargin'), [data, today])
  const todayMoves = movesOn(data, today)

  const month = today.slice(0, 7)
  // Chiffre d'affaires du mois = réalisé (terminé, facturé, payé) + planifié (planifié, en cours)
  const ofMonth = data.moves.filter((m) => m.date.startsWith(month) && ['planifie', 'enCours', 'termine', 'facture', 'paye'].includes(m.status))
  const revenue = ofMonth.reduce((sum, m) => sum + m.priceCents, 0)
  const realised = ofMonth.filter((m) => ['termine', 'facture', 'paye'].includes(m.status)).reduce((sum, m) => sum + m.priceCents, 0)
  const count = (s: Move['status']) => data.moves.filter((m) => m.status === s).length

  const todos = [
    { icon: Inbox, label: t('gerant.todoRequests', { n: count('demande') }) },
    { icon: ClipboardList, label: t('gerant.todoVisits', { n: count('visite') }) },
    { icon: FileSignature, label: t('gerant.todoToPlan', { n: count('devisSigne') }) },
    { icon: Receipt, label: t('gerant.todoToInvoice', { n: count('termine') }) },
  ]

  return (
    <>
      <PageHeader title={t('gerant.hello', { name: user.firstName })} subtitle={fmtDate(today, lang, 'long')} />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_400px]">
        <Card
          title={t('gerant.todayTitle')}
          aside={<span className="tabular text-sm text-muted">{todayMoves.length}</span>}
          padded={false}
        >
          <SimpleTable
            rows={todayMoves}
            rowKey={(m) => m.id}
            empty={t('gerant.noMovesToday')}
            columns={[
              { key: 'time', label: t('gerant.colTime'), render: (m) => <span className="font-semibold">{m.startTime}</span> },
              {
                key: 'client',
                label: t('gerant.colClient'),
                render: (m) => (
                  <div>
                    <p className="font-medium">{customerOf(data, m)?.name}</p>
                    <p className="text-[13px] text-muted">
                      <span className="text-ink/80">
                        {cityName(m.from.cityId, lang)} → {m.to ? cityName(m.to.cityId, lang) : t(m.type === 'debarras' ? 'common.recycling' : 'common.storage')}
                      </span>
                      {' · '}
                      {t(`moveType.${m.type}`)} · {t('common.volume', { n: m.volumeM3 })}
                    </p>
                  </div>
                ),
              },
              {
                key: 'team',
                label: t('gerant.colTeam'),
                render: (m) => (
                  <div className="space-y-1">
                    <span className="flex -space-x-1.5">
                      {m.teamIds.map((id) => {
                        const s = byId(data.staff, id)
                        return s ? <Avatar key={id} name={`${s.firstName} ${s.lastName}`} size={26} className="ring-2 ring-white" /> : null
                      })}
                    </span>
                    <p className="whitespace-nowrap text-[13px] text-muted">{byId(data.vehicles, m.vehicleIds[0])?.plate}</p>
                  </div>
                ),
              },
              { key: 'status', label: t('gerant.colStatus'), render: (m) => <StatusBadge tone={STATUS_TONE[m.status]}>{t(`status.${m.status}`)}</StatusBadge> },
            ]}
          />
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
                return <ActionAlert key={a.id} tone={a.tone} title={c.title} text={c.text} actionLabel={c.action} onAction={() => setOpenAlert(a)} />
              })}
            </div>
          )}
        </Card>

        <Card title={t('gerant.revenueTitle')}>
          <p className="tabular text-[34px] font-semibold leading-none tracking-[-0.03em] text-ink">{fmtMoney(revenue, lang, false)}</p>
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
            {todos.map(({ icon: Icon, label }) => (
              <li key={label} className="flex items-center gap-3 text-[15px] text-ink">
                <Icon size={18} className="shrink-0 text-muted" aria-hidden="true" />
                <span className="tabular">{label}</span>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      <AlertDialog alert={openAlert} onClose={() => setOpenAlert(null)} />
    </>
  )
}
