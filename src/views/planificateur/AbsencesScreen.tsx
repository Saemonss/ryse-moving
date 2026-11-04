/*
 * Planificateur › Absences : ajout en quelques clics (personne, dates, motif) et liste des absences.
 * Les conflits créés par une absence apparaissent immédiatement, ici et dans le planning.
 */
import { useMemo, useState } from 'react'
import { Plus, Trash2, TriangleAlert } from 'lucide-react'
import { useI18n } from '../../i18n'
import { fmtDate } from '../../i18n/format'
import { useDemo } from '../../store/demoStore'
import { addDays } from '../../data/dates'
import { detectConflicts } from '../../data/conflicts'
import { byId, fullName } from '../../data/selectors'
import type { AbsenceKind } from '../../data/types'
import { Card } from '../../ui/Card'
import { Button } from '../../ui/Button'
import { Select } from '../../ui/Select'
import { SimpleTable } from '../../ui/SimpleTable'
import { StatusBadge, type Tone } from '../../ui/StatusBadge'
import { Avatar } from '../../ui/Avatar'
import { toast } from '../../ui/Toast'
import { PageHeader } from '../shared/Page'
import { ScreenLink } from '../shared/ScreenLink'
import { conflictTexts } from '../shared/conflictText'

const FIELD_ROLES = ['chefEquipe', 'chauffeur', 'demenageur']
const KINDS: AbsenceKind[] = ['conge', 'maladie', 'formation']
export const ABSENCE_TONE: Record<AbsenceKind, Tone> = { conge: 'info', maladie: 'warning', formation: 'accent' }

export function AbsencesScreen() {
  const { t, lang } = useI18n()
  const data = useDemo((s) => s.data)
  const today = useDemo((s) => s.seedDay)
  const addAbsence = useDemo((s) => s.addAbsence)
  const removeAbsence = useDemo((s) => s.removeAbsence)

  const field = data.staff.filter((s) => FIELD_ROLES.includes(s.role))
  const [staffId, setStaffId] = useState(field[0]?.id ?? '')
  const [kind, setKind] = useState<AbsenceKind>('maladie')
  const [from, setFrom] = useState(today)
  const [days, setDays] = useState('1')

  const dates = Array.from({ length: 21 }, (_, i) => addDays(today, i))
  const personConflicts = useMemo(
    () => detectConflicts(data).filter((c) => c.kind === 'personAbsent' && c.date >= today),
    [data, today],
  )

  const add = () => {
    const to = addDays(from, Math.max(1, Number(days)) - 1)
    addAbsence({ staffId, kind, from, to })
    const person = byId(data.staff, staffId)
    toast(t('absences.added', { name: person ? fullName(person) : '' }))
  }

  const rows = [...data.absences].sort((a, b) => a.from.localeCompare(b.from))
  return (
    <>
      <PageHeader title={t('absences.title')} subtitle={t('absences.subtitle')} />
      <Card title={t('absences.addTitle')} className="mb-6">
        <div className="grid items-end gap-3 md:grid-cols-[1.4fr_1fr_1.2fr_0.8fr_auto]">
          <Select label={t('absences.person')} value={staffId} onChange={setStaffId} options={field.map((s) => ({ value: s.id, label: fullName(s) }))} />
          <Select label={t('absences.reason')} value={kind} onChange={(v) => setKind(v as AbsenceKind)} options={KINDS.map((k) => ({ value: k, label: t(`absence.${k}`) }))} />
          <Select label={t('absences.from')} value={from} onChange={setFrom} options={dates.map((d) => ({ value: d, label: fmtDate(d, lang, 'weekday') }))} />
          <Select
            label={t('absences.duration')}
            value={days}
            onChange={setDays}
            options={['1', '2', '3', '5', '10'].map((n) => ({ value: n, label: t('absences.days', { n }) }))}
          />
          <Button icon={Plus} onClick={add}>
            {t('absences.add')}
          </Button>
        </div>
      </Card>

      {personConflicts.length > 0 && (
        <section className="mb-6 rounded-2xl border border-danger/25 bg-danger-soft/60 px-5 py-4" aria-live="polite">
          <h2 className="flex items-center gap-2 text-[15px] font-semibold text-danger">
            <TriangleAlert size={18} aria-hidden="true" />
            {t('absences.conflicts', { n: personConflicts.length })}
          </h2>
          <ul className="mt-2 space-y-1.5 text-sm text-ink">
            {personConflicts.map((c) => (
              <li key={c.id}>
                <span className="font-semibold">{fmtDate(c.date, lang, 'weekday')} :</span> {conflictTexts(c, data, t, lang).text}
              </li>
            ))}
          </ul>
          <ScreenLink view="planificateur" screen="planning" arrow className="mt-3 text-sm">
            {t('absences.resolveInPlanning')}
          </ScreenLink>
        </section>
      )}

      <Card title={t('absences.listTitle')} padded={false}>
        <SimpleTable
          rows={rows}
          rowKey={(a) => a.id}
          empty={t('planificateur.noAbsence')}
          columns={[
            {
              key: 'p',
              label: t('planificateur.colPerson'),
              render: (a) => {
                const s = byId(data.staff, a.staffId)
                return s ? (
                  <span className="flex items-center gap-2.5 whitespace-nowrap">
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
            {
              key: 'x',
              label: '',
              className: 'text-right',
              render: (a) => {
                const s = byId(data.staff, a.staffId)
                return (
                  <span data-crawl-sample>
                    <Button
                      size="sm"
                      variant="ghost"
                      icon={Trash2}
                      aria-label={t('absences.removeFor', { name: s ? fullName(s) : '' })}
                      onClick={() => {
                        removeAbsence(a.id)
                        toast(t('absences.removed'), 'info')
                      }}
                    >
                      {t('absences.remove')}
                    </Button>
                  </span>
                )
              },
            },
          ]}
        />
      </Card>
    </>
  )
}
