/*
 * Gérant › Journée à contrôler : tout ce que le chauffeur a envoyé (heures, kilomètres, contrôle du camion,
 * états des lieux avec photos, dégâts, signature, frais). « Corriger » modifie une valeur en gardant la trace ;
 * « Valider la journée » reporte heures réelles et frais sur les dossiers → la marge est recalculée.
 */
import { useState, type ReactNode } from 'react'
import { ArrowLeft, CircleCheck, Pencil, TriangleAlert } from 'lucide-react'
import { useI18n } from '../../i18n'
import { fmtDate, fmtMoney, fmtNumber, fmtTime } from '../../i18n/format'
import { useDemo } from '../../store/demoStore'
import { byId, customerOf, fullName } from '../../data/selectors'
import { MISSION_STEPS, dayKm, workedHours } from '../../data/field'
import { moveMargin } from '../../data/margin'
import type { DriverDay } from '../../data/types'
import { Card } from '../../ui/Card'
import { Button } from '../../ui/Button'
import { Modal } from '../../ui/Modal'
import { Select } from '../../ui/Select'
import { StatusBadge } from '../../ui/StatusBadge'
import { PhotoView } from '../../ui/Photo'
import { toast } from '../../ui/Toast'
import { go, hrefOf } from '../../app/router'
import { FactStrip } from '../shared/Page'

type Field = 'hours' | 'km' | 'expenses'

/** Valeurs de la journée, corrections du gérant comprises. */
export function dayFigures(day: DriverDay) {
  const last = (f: Field) => day.corrections.filter((c) => c.field === f).at(-1)?.to
  return {
    hours: last('hours') ?? Math.round(workedHours(day) * 10) / 10,
    km: last('km') ?? dayKm(day),
    expenses: last('expenses') ?? day.expenses.reduce((s, e) => s + e.cents, 0) / 100,
  }
}

export function DayReview({ param }: { param?: string }) {
  const { t, lang } = useI18n()
  const data = useDemo((s) => s.data)
  const validateDay = useDemo((s) => s.validateDay)
  const openClaim = useDemo((s) => s.openClaim)
  const [correcting, setCorrecting] = useState(false)
  const day = data.days.find((d) => d.id === param)
  const back = (
    <a
      href={hrefOf('gerant')}
      onClick={(e) => {
        e.preventDefault()
        go('gerant')
      }}
      className="mb-4 inline-flex items-center gap-1.5 rounded-md text-sm font-medium text-muted hover:text-ink"
    >
      <ArrowLeft size={16} aria-hidden="true" />
      {t('review.back')}
    </a>
  )
  if (!day)
    return (
      <>
        {back}
        <Card title={t('review.notFound')}>
          <p className="text-muted">{t('file.notFoundText')}</p>
        </Card>
      </>
    )

  const staff = byId(data.staff, day.staffId)
  const f = dayFigures(day)
  const validated = day.status === 'validated'
  const time = (iso?: string) => (iso ? fmtTime(iso, lang) : '')

  return (
    <>
      {back}
      <header className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-[28px] font-semibold leading-tight tracking-[-0.025em]">{t('review.title', { name: staff ? fullName(staff) : '' })}</h1>
          <p className="mt-1 text-[15px] text-muted first-letter:uppercase">
            {fmtDate(day.date, lang, 'long')}
            {day.sentAt && ` · ${t('review.sentAt', { date: fmtDate(day.sentAt.slice(0, 10), lang, 'dayMonth'), time: time(day.sentAt) })}`}
          </p>
        </div>
        {validated ? (
          <StatusBadge tone="success" size="lg">
            {t('review.validatedOn', { date: fmtDate((day.validatedAt ?? '').slice(0, 10) || day.date, lang, 'dayMonth'), time: time(day.validatedAt) })}
          </StatusBadge>
        ) : (
          <div className="flex gap-2">
            <Button variant="secondary" icon={Pencil} onClick={() => setCorrecting(true)}>
              {t('review.correct')}
            </Button>
            <Button
              icon={CircleCheck}
              onClick={() => {
                validateDay(day.id)
                toast(t('review.validated'))
              }}
            >
              {t('review.validate')}
            </Button>
          </div>
        )}
      </header>

      <FactStrip
        facts={[
          { label: t('review.hours'), value: `${fmtNumber(f.hours, lang, 1)} h` },
          { label: t('review.km'), value: `${fmtNumber(f.km, lang)} km` },
          { label: t('review.expenses'), value: fmtMoney(Math.round(f.expenses * 100), lang) },
        ]}
      />

      {day.corrections.length > 0 && (
        <Card title={t('review.corrections')} className="mb-6">
          <ul className="space-y-1 text-[15px]">
            {day.corrections.map((c, i) => (
              <li key={i}>
                {t('review.correctionLine', {
                  field: t(`review.fields.${c.field}`),
                  from: fmtNumber(c.from, lang, 2),
                  to: fmtNumber(c.to, lang, 2),
                  date: fmtDate(c.at.slice(0, 10), lang, 'dayMonth'),
                  time: time(c.at),
                })}
              </li>
            ))}
          </ul>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-6">
          {day.missions.map((m) => {
            const move = byId(data.moves, m.moveId)
            const claim = data.claims.find((c) => c.moveId === m.moveId)
            const margin = move ? moveMargin(move, data) : null
            return (
              <Card
                key={m.moveId}
                title={`${move ? customerOf(data, move)?.name : ''} · ${move?.ref ?? ''}`}
                aside={margin && validated && <span className="text-sm font-medium text-success">{t('review.marginOf', { ref: move?.ref ?? '', pct: Math.round(margin.rate * 100) })}</span>}
              >
                <ol className="mb-4 flex flex-wrap gap-x-4 gap-y-1 text-[13px] text-muted">
                  {m.times.map((tm, i) => (
                    <li key={i}>
                      <span className="tabular font-semibold text-ink">{time(tm)}</span> {t(`terrain.mission.steps.${MISSION_STEPS[i]!}`)}
                    </li>
                  ))}
                </ol>
                <Section title={t('review.startEdl')}>
                  <Photos list={m.startPhotos.map((p) => ({ photo: p.photo, label: t(`terrain.rooms.${p.room}`) }))} />
                  <Chips items={[...m.fragile.map((x) => t(`terrain.items.${x}`)), ...m.reservesStart.map((x) => t(`terrain.reserves.${x}`))]} />
                </Section>
                <p className="mb-4 text-[15px]">
                  {t('review.parcels', { n: m.parcels })}
                  {m.specialItems.length > 0 && ` · ${m.specialItems.map((x) => t(`terrain.items.${x}`)).join(', ')}`}
                </p>
                <Section title={t('review.endEdl')}>
                  <Photos list={m.endPhotos.map((p) => ({ photo: p.photo, label: t(`terrain.rooms.${p.room}`) }))} />
                  <Chips items={m.reservesEnd.map((x) => t(`terrain.reserves.${x}`))} />
                </Section>
                {m.damage && (
                  <div className="mb-4 grid grid-cols-[140px_1fr] items-start gap-4 rounded-xl bg-warning-soft/70 p-3">
                    <PhotoView photo={m.damage.photo} />
                    <div>
                      <p className="flex items-center gap-1.5 font-semibold text-warning">
                        <TriangleAlert size={16} aria-hidden="true" />
                        {t('review.damage')}
                      </p>
                      <p className="mt-1">
                        {t('claims.descriptionText', {
                          item: t(`terrain.items.${m.damage.item}`),
                          type: t(`terrain.damageTypes.${m.damage.type}`),
                          severity: t(`terrain.severity.${m.damage.severity}`).toLowerCase(),
                        })}
                      </p>
                      <Button
                        size="sm"
                        variant="secondary"
                        className="mt-2"
                        onClick={() => {
                          const id = claim?.id ?? openClaim(day.id, m.moveId)
                          if (!claim) toast(t('alerts.damage.done', { client: move ? (customerOf(data, move)?.name ?? '') : '' }))
                          go('gerant', 'litige', id)
                        }}
                      >
                        {claim ? t('review.seeClaim') : t('review.openClaim')}
                      </Button>
                    </div>
                  </div>
                )}
                {m.signature && (
                  <Section title={t('review.signature')}>
                    <img src={m.signature.image} alt={t('review.signedBy', { name: m.signature.name, time: time(m.signature.at) })} className="h-20 rounded-xl bg-white p-2 ring-1 ring-line" />
                    <p className="mt-1 text-sm text-muted">{t('review.signedBy', { name: m.signature.name, time: time(m.signature.at) })}</p>
                  </Section>
                )}
              </Card>
            )
          })}
        </div>

        <div className="space-y-6">
          <Card title={t('review.check')}>
            {day.check ? (
              <div className="space-y-2 text-[15px]">
                <PhotoView photo={day.check.odometerPhoto} />
                <p className="tabular">{`${fmtNumber(day.check.km, lang)} km`}</p>
                <p>{t('review.fuel', { level: t(`terrain.check.fuel.${day.check.fuel}`) })}</p>
                <StatusBadge tone={day.check.ok ? 'success' : 'warning'}>{t(day.check.ok ? 'review.ok' : 'review.problem')}</StatusBadge>
                {day.check.problemPhoto && <PhotoView photo={day.check.problemPhoto} />}
              </div>
            ) : null}
          </Card>
          <Card title={t('review.expenses')}>
            {day.expenses.length === 0 ? (
              <p className="text-muted">{t('review.noExpense')}</p>
            ) : (
              <ul className="space-y-3">
                {day.expenses.map((e) => (
                  <li key={e.id} className="grid grid-cols-[72px_1fr] items-center gap-3">
                    <PhotoView photo={e.photo} />
                    <span>
                      <span className="block font-medium">{t(`terrain.expense.kinds.${e.kind}`)}</span>
                      <span className="tabular block text-muted">{fmtMoney(e.cents, lang)}</span>
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      </div>

      <CorrectDialog day={day} open={correcting} onClose={() => setCorrecting(false)} />
    </>
  )
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mb-4">
      <h3 className="mb-2 text-sm font-semibold text-muted">{title}</h3>
      {children}
    </section>
  )
}

function Photos({ list }: { list: { photo: string; label: string }[] }) {
  if (!list.length) return null
  return (
    <ul className="grid grid-cols-3 gap-2 sm:grid-cols-4">
      {list.map((p, i) => (
        <li key={i}>
          <PhotoView photo={p.photo} />
          <p className="mt-0.5 text-[13px] text-muted">{p.label}</p>
        </li>
      ))}
    </ul>
  )
}

function Chips({ items }: { items: string[] }) {
  if (!items.length) return null
  return (
    <p className="mt-2 flex flex-wrap gap-1.5">
      {items.map((x) => (
        <StatusBadge key={x} tone="neutral">
          {x}
        </StatusBadge>
      ))}
    </p>
  )
}

/** Corriger une valeur (heures, km, frais) : l'ancienne valeur reste visible dans la trace. */
function CorrectDialog({ day, open, onClose }: { day: DriverDay; open: boolean; onClose: () => void }) {
  const { t, lang } = useI18n()
  const correctDay = useDemo((s) => s.correctDay)
  const [field, setField] = useState<Field>('hours')
  const [value, setValue] = useState('')
  const current = dayFigures(day)[field]
  const n = Number(value.replace(',', '.'))
  const valid = value.trim() !== '' && Number.isFinite(n) && n >= 0 && n < 100_000
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={t('review.correctTitle')}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            {t('common.cancel')}
          </Button>
          <Button
            disabled={!valid}
            aria-describedby={valid ? undefined : 'correct-hint'}
            onClick={() => {
              correctDay(day.id, field, current, n)
              toast(t('review.saved'))
              setValue('')
              onClose()
            }}
          >
            {t('review.save')}
          </Button>
        </>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Select
          label={t('review.correctField')}
          value={field}
          onChange={(v) => setField(v as Field)}
          options={(['hours', 'km', 'expenses'] as const).map((k) => ({ value: k, label: `${t(`review.fields.${k}`)} (${fmtNumber(dayFigures(day)[k], lang, 2)})` }))}
        />
        <div>
          <label htmlFor="correct-value" className="mb-1.5 block text-sm font-medium text-ink">
            {t('review.newValue')}
          </label>
          <input
            id="correct-value"
            inputMode="decimal"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder={fmtNumber(current, lang, 2)}
            className="tabular h-11 w-full rounded-xl border border-line bg-white px-3.5 text-[15px] shadow-card focus:border-accent focus:outline-none focus:ring-4 focus:ring-accent-pale/60"
          />
          {!valid && (
            <p id="correct-hint" className="mt-1.5 text-[13px] text-muted">
              {t('review.hint')}
            </p>
          )}
        </div>
      </div>
    </Modal>
  )
}
