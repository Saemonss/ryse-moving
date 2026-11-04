/*
 * Gérant › Rentabilité : marge par type de déménagement et par mois (2 graphiques simples),
 * puis les dossiers à marge faible mis en avant avec leur explication.
 * Toutes les marges suivent les Paramètres : les modifier recalcule tout immédiatement.
 */
import { Bar, BarChart, CartesianGrid, LabelList, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { CircleAlert } from 'lucide-react'
import { useI18n } from '../../i18n'
import { fmtMoney, fmtNumber } from '../../i18n/format'
import { useDemo } from '../../store/demoStore'
import { fromISO } from '../../data/dates'
import { isLowMargin, marginReasons, moveMargin } from '../../data/margin'
import { customerOf } from '../../data/selectors'
import type { MoveType } from '../../data/types'
import { Card } from '../../ui/Card'
import { FactStrip, PageHeader } from '../shared/Page'
import { ScreenLink } from '../shared/ScreenLink'

const DONE = ['termine', 'facture', 'paye']
const PLANNED = ['planifie', 'enCours']
const TYPES: MoveType[] = ['appartement', 'maison', 'bureaux', 'international', 'gardeMeuble', 'debarras']
/** Palette validée (contraste et daltonisme) : réalisé = violet de la marque, planifié = violet plus clair. */
const DONE_COLOR = '#5b3bea'
const PLANNED_COLOR = '#8f78f5'
const INK = '#5d6286'

export function ProfitScreen() {
  const { t, lang } = useI18n()
  const data = useDemo((s) => s.data)
  const threshold = data.settings.marginThresholdPct

  const done = data.moves.filter((m) => DONE.includes(m.status))
  const revenue = done.reduce((s, m) => s + m.priceCents, 0)
  const margin = done.reduce((s, m) => s + moveMargin(m, data).cents, 0)
  const low = done.filter((m) => isLowMargin(m, data)).sort((a, b) => moveMargin(a, data).rate - moveMargin(b, data).rate)

  // 1. Marge moyenne par type (dossiers réalisés)
  const byType = TYPES.map((type) => {
    const list = done.filter((m) => m.type === type)
    const rev = list.reduce((s, m) => s + m.priceCents, 0)
    const mar = list.reduce((s, m) => s + moveMargin(m, data).cents, 0)
    return { type: t(`moveType.${type}`), pct: rev ? Math.round((mar / rev) * 100) : 0, n: list.length }
  }).filter((r) => r.n > 0)

  // 2. Marge par mois : réalisé + planifié
  const months = [...new Set(data.moves.filter((m) => [...DONE, ...PLANNED].includes(m.status)).map((m) => m.date.slice(0, 7)))].sort()
  const byMonth = months.map((mo) => {
    const sum = (statuses: string[]) =>
      data.moves.filter((m) => m.date.startsWith(mo) && statuses.includes(m.status)).reduce((s, m) => s + moveMargin(m, data).cents, 0) / 100
    return {
      month: new Intl.DateTimeFormat(lang === 'nl' ? 'nl-BE' : 'fr-BE', { month: 'long' }).format(fromISO(`${mo}-15`)),
      done: Math.round(sum(DONE)),
      planned: Math.round(sum(PLANNED)),
    }
  })
  const euros = (v: number) => fmtMoney(v * 100, lang, false)
  // Axe en paliers de 15 %, assez large pour toutes les barres et le seuil (même si les Paramètres changent)
  const axisMax = Math.max(60, Math.ceil(Math.max(threshold, ...byType.map((r) => r.pct)) / 15) * 15)

  return (
    <>
      <PageHeader title={t('profit.title')} subtitle={t('profit.subtitle', { pct: threshold })} />
      <FactStrip
        facts={[
          { label: t('profit.revenue'), value: fmtMoney(revenue, lang, false) },
          { label: t('profit.margin'), value: `${fmtMoney(margin, lang, false)} · ${revenue ? Math.round((margin / revenue) * 100) : 0} %` },
          { label: t('profit.lowCount', { pct: threshold }), value: low.length, tone: low.length ? 'danger' : undefined },
        ]}
      />

      <div className="grid gap-6 xl:grid-cols-2">
        <Card title={t('profit.byType')}>
          <div className="h-[280px]" role="img" aria-label={byType.map((r) => `${r.type} ${r.pct} %`).join(', ')}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={byType} layout="vertical" margin={{ left: 8, right: 48, top: 4, bottom: 4 }} barCategoryGap={10}>
                <CartesianGrid horizontal={false} stroke="#e4e5ee" />
                <XAxis type="number" domain={[0, axisMax]} ticks={Array.from({ length: axisMax / 15 + 1 }, (_, i) => i * 15)} tickFormatter={(v: number) => `${v} %`} tick={{ fill: INK, fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="type" width={112} tick={{ fill: '#0b1026', fontSize: 13 }} axisLine={false} tickLine={false} />
                <Tooltip cursor={{ fill: '#f4f3fb' }} content={<ChartTip format={(v) => `${v} %`} />} />
                <ReferenceLine x={threshold} stroke="#b4232c" strokeDasharray="4 4" label={{ value: t('profit.threshold', { pct: threshold }), position: 'top', fill: '#b4232c', fontSize: 12 }} />
                <Bar dataKey="pct" name={t('profit.margin')} fill={DONE_COLOR} radius={[0, 4, 4, 0]} isAnimationActive={false}>
                  <LabelList dataKey="pct" position="right" formatter={(v) => `${v} %`} style={{ fill: '#0b1026', fontSize: 12, fontWeight: 600 }} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card title={t('profit.byMonth')}>
          <ul className="mb-2 flex gap-4 text-[13px] text-muted">
            <li className="flex items-center gap-1.5"><span className="size-2.5 rounded-sm" style={{ background: DONE_COLOR }} aria-hidden="true" />{t('profit.done')}</li>
            <li className="flex items-center gap-1.5"><span className="size-2.5 rounded-sm" style={{ background: PLANNED_COLOR }} aria-hidden="true" />{t('profit.planned')}</li>
          </ul>
          <div className="h-[252px]" role="img" aria-label={byMonth.map((r) => `${r.month} ${euros(r.done + r.planned)}`).join(', ')}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={byMonth} margin={{ left: 8, right: 8, top: 8, bottom: 4 }} barCategoryGap="30%">
                <CartesianGrid vertical={false} stroke="#e4e5ee" />
                <XAxis dataKey="month" tick={{ fill: '#0b1026', fontSize: 13 }} axisLine={false} tickLine={false} />
                <YAxis tickFormatter={(v: number) => fmtNumber(v, lang)} tick={{ fill: INK, fontSize: 12 }} axisLine={false} tickLine={false} width={56} />
                <Tooltip cursor={{ fill: '#f4f3fb' }} content={<ChartTip format={euros} />} />
                <Bar dataKey="done" stackId="m" name={t('profit.done')} fill={DONE_COLOR} stroke="#fff" strokeWidth={2} isAnimationActive={false} />
                <Bar dataKey="planned" stackId="m" name={t('profit.planned')} fill={PLANNED_COLOR} stroke="#fff" strokeWidth={2} radius={[4, 4, 0, 0]} isAnimationActive={false} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      <Card title={t('profit.lowTitle', { pct: threshold })} className="mt-6" padded={false}>
        {low.length === 0 ? (
          <p className="px-5 py-8 text-center text-[15px] text-success">{t('profit.noLow')}</p>
        ) : (
          <ul className="divide-y divide-line">
            {low.map((m) => {
              const mm = moveMargin(m, data)
              const reasons = marginReasons(m)
              return (
                <li key={m.id} className="flex flex-wrap items-start gap-x-6 gap-y-2 px-5 py-4">
                  <CircleAlert size={18} className="mt-0.5 shrink-0 text-danger" aria-hidden="true" />
                  <div className="min-w-0 flex-1">
                    <span data-crawl-sample>
                      <ScreenLink view="gerant" screen="dossier" param={m.id} fallback className="text-[15px]">
                        {customerOf(data, m)?.name} · {m.ref}
                      </ScreenLink>
                    </span>
                    <p className="text-sm text-muted">
                      {t(`moveType.${m.type}`)} · {t('common.volume', { n: m.volumeM3 })} · {fmtMoney(m.priceCents, lang, false)}
                    </p>
                    <ul className="mt-1 space-y-0.5 text-sm text-ink">
                      {reasons.map((r) => (
                        <li key={r}>
                          {t(`file.reasons.${r}`, {
                            actual: fmtNumber(m.actualHours ?? 0, lang, 1),
                            planned: fmtNumber(m.plannedHours, lang, 1),
                            km: fmtNumber(m.distanceKm, lang),
                          })}
                        </li>
                      ))}
                      {reasons.length === 0 && <li>{t('profit.noReason')}</li>}
                    </ul>
                  </div>
                  <p className="tabular whitespace-nowrap text-right text-[15px] font-semibold text-danger">
                    {fmtMoney(mm.cents, lang, false)} · {Math.round(mm.rate * 100)} %
                  </p>
                </li>
              )
            })}
          </ul>
        )}
      </Card>
    </>
  )
}

/** Infobulle des graphiques, aux couleurs de la charte. */
function ChartTip({ active, payload, label, format }: { active?: boolean; payload?: { name?: string; value?: number; color?: string }[]; label?: string; format: (v: number) => string }) {
  const { t } = useI18n()
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-xl border border-line bg-white px-3 py-2 text-[13px] shadow-pop">
      <p className="mb-1 font-semibold capitalize text-ink">{label}</p>
      {payload.map((p) => (
        <p key={p.name} className="flex items-center gap-2 text-ink">
          <span className="size-2 rounded-sm" style={{ background: p.color }} aria-hidden="true" />
          {t('profit.tipLine', { name: p.name ?? '', value: format(p.value ?? 0) })}
        </p>
      ))}
    </div>
  )
}
