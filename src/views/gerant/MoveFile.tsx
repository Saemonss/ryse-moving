/*
 * Gérant › Fiche dossier : tout le dossier sur une page (client, adresses, organisation, prix, coûts, marge)
 * et la frise du fil rouge (demande → devis → planifié → en cours → terminé → facturé → payé).
 * Les étapes suivantes de la démo enrichiront cette fiche.
 */
import type { ReactNode } from 'react'
import { ArrowLeft, Building2, CircleAlert, Mail, MapPin, Phone } from 'lucide-react'
import { useI18n } from '../../i18n'
import { fmtDate, fmtMoney, fmtNumber, fmtPhone } from '../../i18n/format'
import { useDemo } from '../../store/demoStore'
import { STATUS_TONE, byId, customerOf, fmtAddress, fullName } from '../../data/selectors'
import { isLowMargin, marginReasons, moveCost, moveMargin } from '../../data/margin'
import type { Site } from '../../data/types'
import { Card } from '../../ui/Card'
import { StatusBadge } from '../../ui/StatusBadge'
import { Avatar } from '../../ui/Avatar'
import { go, hrefOf } from '../../app/router'
import { Timeline } from './Timeline'

export function MoveFile({ param }: { param?: string }) {
  const { t, lang } = useI18n()
  const data = useDemo((s) => s.data)
  const move = byId(data.moves, param)

  const back = (
    <a
      href={hrefOf('gerant', 'demenagements')}
      onClick={(e) => {
        e.preventDefault()
        go('gerant', 'demenagements')
      }}
      className="mb-4 inline-flex items-center gap-1.5 rounded-md text-sm font-medium text-muted hover:text-ink"
    >
      <ArrowLeft size={16} aria-hidden="true" />
      {t('file.back')}
    </a>
  )

  if (!move)
    return (
      <>
        {back}
        <Card title={t('file.notFound')}>
          <p className="text-muted">{t('file.notFoundText')}</p>
        </Card>
      </>
    )

  const customer = customerOf(data, move)
  const cost = moveCost(move, data)
  const margin = moveMargin(move, data)
  const low = isLowMargin(move, data)
  const reasons = low ? marginReasons(move) : []
  const done = ['termine', 'facture', 'paye'].includes(move.status)
  const assigned = move.teamIds.length > 0
  const money = (c: number) => fmtMoney(c, lang)

  const site = (label: string, s: Site) => (
    <div className="flex gap-3">
      <MapPin size={18} className="mt-0.5 shrink-0 text-muted" aria-hidden="true" />
      <div>
        <p className="font-semibold">{label}</p>
        <p>{fmtAddress(s, lang)}</p>
        <p className="text-sm text-muted">
          {s.floor === 0 ? t('common.groundFloor') : s.floor === 1 ? t('common.firstFloor') : t('common.floor', { n: s.floor })} ·{' '}
          {s.elevator ? t('common.elevator') : t('common.noElevator')} · {t(`access.${s.access}`)} · {t(`parking.${s.parking}`)}
        </p>
      </div>
    </div>
  )

  return (
    <>
      {back}
      <header className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-[28px] font-semibold leading-tight tracking-[-0.025em] text-ink">{customer?.name}</h1>
          <p className="mt-1 text-[15px] text-muted">
            {move.ref} · {t(`moveType.${move.type}`)} · {t('common.volume', { n: move.volumeM3 })}
          </p>
        </div>
        <StatusBadge tone={STATUS_TONE[move.status]} size="lg">
          {t(`status.${move.status}`)}
        </StatusBadge>
      </header>

      <Card title={t('file.timeline')} className="mb-6">
        <Timeline move={move} />
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card title={t('file.client')}>
          <div className="space-y-2 text-[15px]">
            <p className="flex items-center gap-2.5 font-semibold">
              {customer?.kind === 'entreprise' ? <Building2 size={18} className="text-muted" aria-hidden="true" /> : <Avatar name={customer?.name ?? ''} size={26} />}
              {customer?.name}
            </p>
            {customer?.contact && <p className="text-muted">{t('file.contact', { name: customer.contact })}</p>}
            <p className="flex items-center gap-2.5">
              <Phone size={16} className="text-muted" aria-hidden="true" />
              <span className="tabular">{fmtPhone(customer?.phone ?? '')}</span>
            </p>
            <p className="flex items-center gap-2.5">
              <Mail size={16} className="text-muted" aria-hidden="true" />
              {customer?.email}
            </p>
          </div>
        </Card>

        <Card title={t('file.addresses')}>
          <div className="space-y-4 text-[15px]">
            {site(t('file.from'), move.from)}
            {move.to ? site(t('file.to'), move.to) : (
              <div className="flex gap-3">
                <MapPin size={18} className="mt-0.5 shrink-0 text-muted" aria-hidden="true" />
                <p className="font-semibold">{t(move.type === 'debarras' ? 'common.recycling' : 'common.storage')}</p>
              </div>
            )}
          </div>
        </Card>

        <Card title={t('file.organisation')}>
          <dl className="grid grid-cols-[minmax(0,140px)_1fr] gap-x-4 gap-y-3 text-[15px]">
            <Row label={t('file.when')}>
              <span className="first-letter:uppercase">{fmtDate(move.date, lang, 'weekday')}</span> · {move.startTime}
            </Row>
            <Row label={t('file.team')}>
              {assigned ? (
                <span className="flex flex-wrap gap-x-3 gap-y-1.5">
                  {move.teamIds.map((id) => {
                    const s = byId(data.staff, id)
                    return s ? (
                      <span key={id} className="inline-flex items-center gap-1.5">
                        <Avatar name={fullName(s)} size={24} />
                        {fullName(s)}
                      </span>
                    ) : null
                  })}
                </span>
              ) : (
                <span className="text-muted">{t('file.notAssigned')}</span>
              )}
            </Row>
            <Row label={t('file.vehicles')}>
              {move.vehicleIds.length ? (
                move.vehicleIds.map((id) => {
                  const v = byId(data.vehicles, id)
                  return v ? <p key={id}>{`${t(`vehicleKind.${v.kind}`)} · ${v.plate}`}</p> : null
                })
              ) : (
                <span className="text-muted">{t('file.notAssigned')}</span>
              )}
            </Row>
            <Row label={t('file.duration')}>
              {move.actualHours ? t('file.hoursActual', { actual: fmtNumber(move.actualHours, lang, 1), planned: fmtNumber(move.plannedHours, lang, 1) }) : t('file.hoursPlanned', { n: fmtNumber(move.plannedHours, lang, 1) })}
            </Row>
            <Row label={t('file.distance')}>{t('file.km', { n: fmtNumber(move.distanceKm, lang) })}</Row>
            {move.cmr && <Row label={t('file.cmr')}>{move.cmr}</Row>}
          </dl>
        </Card>

        <Card title={t('file.finances')} aside={!done && <span className="text-[13px] text-muted">{t('file.estimated')}</span>}>
          <dl className="tabular space-y-2 text-[15px]">
            <Line label={t('file.price')} value={money(move.priceCents)} strong />
            {move.depositCents > 0 && <Line label={t('file.deposit')} value={t('file.depositPaid', { amount: money(move.depositCents) })} muted />}
            <div className="my-3 border-t border-line" />
            <Line label={t('file.labour', { hours: fmtNumber(cost.hours, lang, 1), people: cost.crewSize })} value={`− ${money(cost.labour)}`} />
            <Line label={t('file.transport', { km: fmtNumber(move.distanceKm, lang) })} value={`− ${money(cost.transport)}`} />
            {cost.lift > 0 && <Line label={t('file.lift')} value={`− ${money(cost.lift)}`} />}
            <Line label={t('file.material')} value={`− ${money(cost.material)}`} />
            <Line label={t('file.totalCost')} value={money(cost.total)} muted />
            <div className="my-3 border-t border-line" />
            <div className="flex items-baseline justify-between gap-4">
              <dt className="font-semibold">{t('file.margin')}</dt>
              <dd className={`text-xl font-semibold ${low ? 'text-danger' : 'text-success'}`}>
                {money(margin.cents)} · {Math.round(margin.rate * 100)} %
              </dd>
            </div>
          </dl>
          {low && (
            <div className="mt-4 rounded-xl bg-danger-soft px-4 py-3 text-[15px]">
              <p className="flex items-center gap-2 font-semibold text-danger">
                <CircleAlert size={17} aria-hidden="true" />
                {t('file.lowMargin', { pct: data.settings.marginThresholdPct })}
              </p>
              {reasons.length > 0 && (
                <ul className="mt-1.5 list-disc space-y-1 pl-6 text-ink">
                  {reasons.map((r) => (
                    <li key={r}>
                      {t(`file.reasons.${r}`, {
                        actual: fmtNumber(move.actualHours ?? 0, lang, 1),
                        planned: fmtNumber(move.plannedHours, lang, 1),
                        km: fmtNumber(move.distanceKm, lang),
                      })}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </Card>
      </div>
    </>
  )
}

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <>
      <dt className="text-muted">{label}</dt>
      <dd className="min-w-0">{children}</dd>
    </>
  )
}

function Line({ label, value, strong = false, muted = false }: { label: string; value: string; strong?: boolean; muted?: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <dt className={muted ? 'text-muted' : ''}>{label}</dt>
      <dd className={`whitespace-nowrap ${strong ? 'font-semibold' : ''} ${muted ? 'text-muted' : ''}`}>{value}</dd>
    </div>
  )
}
