/*
 * Gérant › Flotte : véhicules, capacité, disponibilité du jour, prochains entretiens et contrôles techniques.
 * Une échéance à 30 jours ou moins est signalée (orange) ; une échéance dépassée en rouge.
 */
import { CalendarCheck, TriangleAlert } from 'lucide-react'
import { useI18n } from '../../i18n'
import { fmtDate } from '../../i18n/format'
import { useDemo } from '../../store/demoStore'
import { diffDays } from '../../data/dates'
import { VEHICLE_WARNING_DAYS } from '../../data/scenarios'
import { customerOf, movesOn } from '../../data/selectors'
import type { ISODate, Vehicle } from '../../data/types'
import { Card } from '../../ui/Card'
import { SimpleTable } from '../../ui/SimpleTable'
import { StatusBadge } from '../../ui/StatusBadge'
import { FactStrip, PageHeader } from '../shared/Page'

export function FleetScreen() {
  const { t, lang } = useI18n()
  const data = useDemo((s) => s.data)
  const today = useDemo((s) => s.seedDay)
  const todayMoves = movesOn(data, today)
  const missionOf = (v: Vehicle) => todayMoves.find((m) => m.vehicleIds.includes(v.id))

  const due = (date: ISODate, booked?: ISODate) => {
    if (booked) return <span className="flex items-center gap-1.5 whitespace-nowrap text-success"><CalendarCheck size={15} aria-hidden="true" />{t('fleet.booked', { date: fmtDate(booked, lang, 'dayMonth') })}</span>
    const days = diffDays(date, today)
    const tone = days < 0 ? 'text-danger font-semibold' : days <= VEHICLE_WARNING_DAYS ? 'text-warning font-semibold' : 'text-ink'
    return (
      <span className={`whitespace-nowrap ${tone}`}>
        {fmtDate(date, lang, 'medium')}
        <span className="ml-1.5 text-[13px] font-normal text-muted">{days < 0 ? t('fleet.overdue') : t('common.inDays', { n: days })}</span>
      </span>
    )
  }

  const soon = data.vehicles.flatMap((v) => [
    ...(diffDays(v.nextService, today) <= VEHICLE_WARNING_DAYS ? [{ v, kind: 'service' as const, date: v.nextService }] : []),
    ...(!v.inspectionBookedOn && diffDays(v.nextInspection, today) <= VEHICLE_WARNING_DAYS ? [{ v, kind: 'inspection' as const, date: v.nextInspection }] : []),
  ]).sort((a, b) => a.date.localeCompare(b.date))

  return (
    <>
      <PageHeader title={t('fleet.title')} subtitle={t('fleet.subtitle')} />
      <FactStrip
        facts={[
          { label: t('fleet.vehicles'), value: data.vehicles.length },
          { label: t('fleet.outToday'), value: `${data.vehicles.filter((v) => missionOf(v)).length} / ${data.vehicles.length}` },
          { label: t('fleet.dueSoon'), value: soon.length },
        ]}
      />
      {soon.length > 0 && (
        <section className="mb-6 rounded-2xl border border-warning/25 bg-warning-soft/70 px-5 py-4">
          <h2 className="flex items-center gap-2 text-[15px] font-semibold text-warning">
            <TriangleAlert size={18} aria-hidden="true" />
            {t('fleet.soonTitle', { n: VEHICLE_WARNING_DAYS })}
          </h2>
          <ul className="mt-2 space-y-1 text-[15px] text-ink">
            {soon.map(({ v, kind, date }) => (
              <li key={`${v.id}-${kind}`}>
                <span className="font-semibold">{v.plate}</span> · {t(`vehicleKind.${v.kind}`)} — {t(`fleet.${kind}`)} {fmtDate(date, lang, 'dayMonth')} ({t('common.inDays', { n: diffDays(date, today) })})
              </li>
            ))}
          </ul>
        </section>
      )}
      <Card padded={false}>
        <SimpleTable
          rows={data.vehicles}
          rowKey={(v) => v.id}
          empty={t('fleet.empty')}
          columns={[
            {
              key: 'v',
              label: t('fleet.colVehicle'),
              render: (v) => (
                <span className="whitespace-nowrap">
                  <span className="block font-semibold">{v.plate}</span>
                  <span className="block text-[13px] text-muted">{t(`vehicleKind.${v.kind}`)}</span>
                </span>
              ),
            },
            { key: 'c', label: t('fleet.colCapacity'), render: (v) => (v.volumeM3 ? t('common.volume', { n: v.volumeM3 }) : <span className="text-subtle">–</span>) },
            { key: 'a', label: t('team.colAgency'), className: 'hidden min-[1400px]:table-cell', render: (v) => <span className="whitespace-nowrap">{t(`team.agency.${v.agencyId === 'a-lille' ? 'lille' : 'nivelles'}`)}</span> },
            {
              key: 't',
              label: t('team.colToday'),
              render: (v) => {
                const m = missionOf(v)
                return m ? <StatusBadge tone="info">{t('team.onMission', { client: customerOf(data, m)?.name ?? '' })}</StatusBadge> : <StatusBadge tone="success">{t('fleet.free')}</StatusBadge>
              },
            },
            { key: 's', label: t('fleet.colService'), render: (v) => due(v.nextService) },
            { key: 'i', label: t('fleet.colInspection'), render: (v) => due(v.nextInspection, v.inspectionBookedOn) },
          ]}
        />
      </Card>
    </>
  )
}
