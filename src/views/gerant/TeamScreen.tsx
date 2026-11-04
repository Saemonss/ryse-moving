/*
 * Gérant › Équipe : personnes, rôles, compétences, disponibilité du jour et absences à venir. Recherche par nom.
 */
import { useState } from 'react'
import { Search } from 'lucide-react'
import { useI18n } from '../../i18n'
import { fmtDate } from '../../i18n/format'
import { useDemo } from '../../store/demoStore'
import { customerOf, fullName } from '../../data/selectors'
import type { Staff } from '../../data/types'
import { Card } from '../../ui/Card'
import { SimpleTable } from '../../ui/SimpleTable'
import { StatusBadge } from '../../ui/StatusBadge'
import { Avatar } from '../../ui/Avatar'
import { FactStrip, PageHeader } from '../shared/Page'

const FIELD_ROLES = ['chefEquipe', 'chauffeur', 'demenageur']

export function TeamScreen() {
  const { t, lang } = useI18n()
  const data = useDemo((s) => s.data)
  const today = useDemo((s) => s.seedDay)
  const [query, setQuery] = useState('')

  const absenceToday = (s: Staff) => data.absences.find((a) => a.staffId === s.id && a.from <= today && today <= a.to)
  const missionToday = (s: Staff) => data.moves.find((m) => m.date === today && ['planifie', 'enCours'].includes(m.status) && m.teamIds.includes(s.id))
  const nextAbsence = (s: Staff) => data.absences.filter((a) => a.staffId === s.id && a.from > today).sort((a, b) => a.from.localeCompare(b.from))[0]

  const q = query.trim().toLowerCase()
  const rows = data.staff.filter((s) => !q || fullName(s).toLowerCase().includes(q) || t(`roles.${s.role}.${s.gender}`).toLowerCase().includes(q))
  const field = data.staff.filter((s) => FIELD_ROLES.includes(s.role))

  return (
    <>
      <PageHeader title={t('team.title')} subtitle={t('team.subtitle')} />
      <FactStrip
        facts={[
          { label: t('team.people'), value: data.staff.length },
          { label: t('team.fieldAvailable'), value: `${field.filter((s) => !absenceToday(s)).length} / ${field.length}` },
          { label: t('team.absentToday'), value: data.staff.filter((s) => absenceToday(s)).length },
        ]}
      />
      <Card padded={false}>
        <div className="border-b border-line px-5 py-4">
          <label htmlFor="team-search" className="mb-1.5 block text-sm font-medium text-ink">
            {t('moves.search')}
          </label>
          <div className="relative max-w-sm">
            <Search size={17} aria-hidden="true" className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
            <input
              id="team-search"
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t('team.searchPlaceholder')}
              className="h-11 w-full rounded-xl border border-line bg-white pl-10 pr-3.5 text-[15px] shadow-card placeholder:text-muted/80 focus:border-accent focus:outline-none focus:ring-4 focus:ring-accent-pale/60"
            />
          </div>
        </div>
        <SimpleTable
          rows={rows}
          rowKey={(s) => s.id}
          empty={t('team.empty')}
          columns={[
            {
              key: 'n',
              label: t('team.colPerson'),
              render: (s) => (
                <span className="flex items-center gap-2.5 whitespace-nowrap">
                  <Avatar name={fullName(s)} size={30} />
                  <span>
                    <span className="block font-medium">{fullName(s)}</span>
                    <span className="block text-[13px] text-muted">{t(`roles.${s.role}.${s.gender}`)}</span>
                  </span>
                </span>
              ),
            },
            { key: 'a', label: t('team.colAgency'), render: (s) => <span className="whitespace-nowrap">{t(`team.agency.${s.agencyId === 'a-lille' ? 'lille' : 'nivelles'}`)}</span> },
            {
              key: 'k',
              label: t('team.colSkills'),
              render: (s) =>
                s.skills.length ? (
                  <span className="flex flex-wrap gap-1.5">
                    {s.skills.map((k) => (
                      <StatusBadge key={k} tone="neutral">
                        {t(`skill.${k}`)}
                      </StatusBadge>
                    ))}
                  </span>
                ) : (
                  <span className="text-subtle">–</span>
                ),
            },
            {
              key: 't',
              label: t('team.colToday'),
              render: (s) => {
                const abs = absenceToday(s)
                if (abs) return <StatusBadge tone="warning">{t('team.absent', { reason: t(`absence.${abs.kind}`) })}</StatusBadge>
                const m = missionToday(s)
                if (m) return <StatusBadge tone="info">{t('team.onMission', { client: customerOf(data, m)?.name ?? '' })}</StatusBadge>
                return FIELD_ROLES.includes(s.role) ? <StatusBadge tone="success">{t('team.available')}</StatusBadge> : <span className="text-muted">{t('team.office')}</span>
              },
            },
            {
              key: 'x',
              label: t('team.colNextAbsence'),
              render: (s) => {
                const a = nextAbsence(s)
                return a ? (
                  <span className="whitespace-nowrap">
                    {t(`absence.${a.kind}`)} · {fmtDate(a.from, lang, 'dayMonth')}
                  </span>
                ) : (
                  <span className="text-subtle">–</span>
                )
              },
            },
          ]}
        />
      </Card>
    </>
  )
}
