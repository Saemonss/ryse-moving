/*
 * Accueil provisoire du planificateur : chiffres de la semaine, absences, aperçu de l'étape « Planning ».
 */
import { useI18n } from '../../i18n'
import { fmtDate } from '../../i18n/format'
import { useDemo } from '../../store/demoStore'
import { addDays, startOfWeek } from '../../data/dates'
import { byId, fullName, isAbsent, vehicleBusy } from '../../data/selectors'
import type { Absence } from '../../data/types'
import { Card } from '../../ui/Card'
import { SimpleTable } from '../../ui/SimpleTable'
import { StatusBadge, type Tone } from '../../ui/StatusBadge'
import { Avatar } from '../../ui/Avatar'
import { FactStrip, PageHeader, UpcomingPreview } from '../shared/Page'

const FIELD_ROLES = ['chefEquipe', 'chauffeur', 'demenageur']
const ABSENCE_TONE: Record<Absence['kind'], Tone> = { conge: 'info', maladie: 'warning', formation: 'accent' }

export function PlanificateurHome() {
  const { t, lang } = useI18n()
  const data = useDemo((s) => s.data)
  const today = useDemo((s) => s.seedDay)

  const monday = startOfWeek(today)
  const week = Array.from({ length: 7 }, (_, i) => addDays(monday, i))
  const weekMoves = data.moves.filter((m) => week.includes(m.date) && ['planifie', 'enCours', 'termine', 'facture', 'paye'].includes(m.status)).length
  const field = data.staff.filter((s) => FIELD_ROLES.includes(s.role))
  const available = field.filter((s) => !isAbsent(data, s.id, today)).length
  const trucks = data.vehicles.filter((v) => v.kind !== 'monteMeubles')
  const busy = trucks.filter((v) => vehicleBusy(data, v, today)).length

  return (
    <>
      <PageHeader title={t('planificateur.title')} subtitle={t('planificateur.subtitle')} />
      <FactStrip
        facts={[
          { label: t('planificateur.weekMoves'), value: weekMoves },
          { label: t('planificateur.staffAvailable'), value: `${available} / ${field.length}` },
          { label: t('planificateur.vehiclesBusy'), value: `${busy} / ${trucks.length}` },
        ]}
      />
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <Card title={t('planificateur.absencesTitle')} padded={false}>
          <SimpleTable
            rows={data.absences}
            rowKey={(a) => a.id}
            empty={t('planificateur.noAbsence')}
            columns={[
              {
                key: 'p',
                label: t('planificateur.colPerson'),
                render: (a) => {
                  const s = byId(data.staff, a.staffId)
                  return s ? (
                    <span className="flex items-center gap-2.5">
                      <Avatar name={fullName(s)} size={28} />
                      {fullName(s)}
                    </span>
                  ) : null
                },
              },
              { key: 'r', label: t('planificateur.colReason'), render: (a) => <StatusBadge tone={ABSENCE_TONE[a.kind]}>{t(`absence.${a.kind}`)}</StatusBadge> },
              {
                key: 'd',
                label: t('planificateur.colPeriod'),
                render: (a) =>
                  a.from === a.to
                    ? fmtDate(a.from, lang, 'weekday')
                    : t('planificateur.period', { from: fmtDate(a.from, lang, 'dayMonth'), to: fmtDate(a.to, lang, 'dayMonth') }),
              },
            ]}
          />
        </Card>
        <UpcomingPreview items={['planificateur.previewItems.a', 'planificateur.previewItems.b', 'planificateur.previewItems.c']} />
      </div>
    </>
  )
}
