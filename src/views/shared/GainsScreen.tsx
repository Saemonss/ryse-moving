/*
 * Calculateur de gain (closing) : le prospect saisit SES chiffres, les hypothèses sont visibles et modifiables,
 * le calcul est affiché en clair. Seuls les agents actifs (page Agents IA) comptent.
 */
import { useEffect, useId, useState } from 'react'
import { RotateCcw } from 'lucide-react'
import { useI18n } from '../../i18n'
import { fmtMoney, fmtNumber } from '../../i18n/format'
import { useDemo } from '../../store/demoStore'
import { AGENT_IDS, type AgentId } from '../../data/agents'
import { DEFAULT_INPUTS, computeGains, useGains, type GainInputs } from '../../data/gains'
import { useRoute } from '../../app/router'
import type { ViewId } from '../../app/views'
import { Card } from '../../ui/Card'
import { Button } from '../../ui/Button'
import { toast } from '../../ui/Toast'
import { PageHeader } from './Page'
import { ScreenLink } from './ScreenLink'

const INPUT_KEYS = Object.keys(DEFAULT_INPUTS) as (keyof GainInputs)[]
const UNIT: Record<keyof GainInputs, 'count' | 'hours' | 'euro'> = {
  leadsPerWeek: 'count',
  quotesPerWeek: 'count',
  movesPerMonth: 'count',
  officeHoursPerWeek: 'hours',
  hourlyCost: 'euro',
}

/** Champ numérique : on peut vider le champ pendant la saisie, la valeur retenue reste bornée. */
function NumInput({ label, value, unit, onCommit, compact = false }: { label: string; value: number; unit: string; onCommit: (v: number) => void; compact?: boolean }) {
  const { lang } = useI18n()
  const id = useId()
  const [text, setText] = useState(String(value))
  const [focused, setFocused] = useState(false)
  useEffect(() => {
    if (!focused) setText(String(value).replace('.', ','))
  }, [value, focused, lang])
  return (
    <div className={compact ? 'flex items-center justify-end gap-2' : ''}>
      <label htmlFor={id} className={compact ? 'sr-only' : 'mb-1.5 block text-sm font-medium text-ink'}>
        {label}
      </label>
      <div className="flex items-center gap-2">
        <input
          id={id}
          inputMode="decimal"
          value={text}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          onChange={(e) => {
            setText(e.target.value)
            const n = Number(e.target.value.replace(',', '.').trim())
            if (e.target.value.trim() !== '' && Number.isFinite(n)) onCommit(n)
          }}
          className={`tabular rounded-xl border border-line bg-white px-3 text-right text-[16px] shadow-card focus:border-accent focus:outline-none focus:ring-4 focus:ring-accent-pale/60 ${compact ? 'h-10 w-20' : 'h-11 w-28'}`}
        />
        {unit && <span className="text-[15px] text-muted">{unit}</span>}
      </div>
    </div>
  )
}

export function GainsScreen() {
  const { t, lang } = useI18n()
  const view = useRoute().view as ViewId
  const agents = useDemo((s) => s.data.settings.agents)
  const { inputs, minutes, setInput, setMinutes, reset } = useGains()
  const g = computeGains(inputs, minutes, agents, AGENT_IDS)
  const euros = (v: number) => fmtMoney(Math.round(v) * 100, lang, false)
  const hours = (v: number) => fmtNumber(v, lang, 1)

  return (
    <>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <PageHeader title={t('gains.title')} subtitle={t('gains.subtitle')} />
        <Button
          variant="ghost"
          icon={RotateCcw}
          onClick={() => {
            reset()
            toast(t('gains.resetDone'), 'info')
          }}
        >
          {t('gains.reset')}
        </Button>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <div className="space-y-6">
          <Card title={t('gains.yours')}>
            <div className="grid gap-4 sm:grid-cols-2">
              {INPUT_KEYS.map((k) => (
                <NumInput key={k} label={t(`gains.inputs.${k}`)} value={inputs[k]} unit={t(`gains.units.${UNIT[k]}`)} onCommit={(v) => setInput(k, v)} />
              ))}
            </div>
          </Card>

          <Card title={t('gains.hypotheses')}>
            <p className="mb-3 text-[15px] text-muted">{t('gains.hypothesesHelp')}</p>
            <ul className="divide-y divide-line">
              {AGENT_IDS.map((id: AgentId) => (
                <li key={id} className={`flex items-center justify-between gap-4 py-2.5 ${agents[id] ? '' : 'opacity-60'}`}>
                  <span className="text-[15px]">
                    <span className="font-medium text-ink">{t(`agents.names.${id}`)}</span>{' '}
                    <span className="text-muted">· {t(`gains.per.${id}`)}</span>
                    {!agents[id] && <span className="ml-2 text-[13px] text-muted">({t('agents.off').toLowerCase()})</span>}
                  </span>
                  <NumInput compact label={`${t(`agents.names.${id}`)} · ${t(`gains.per.${id}`)}`} value={minutes[id]} unit={t('gains.units.minutes')} onCommit={(v) => setMinutes(id, v)} />
                </li>
              ))}
            </ul>
          </Card>
        </div>

        <Card title={t('gains.result')}>
          <p className="mb-5 rounded-xl bg-surface px-4 py-3 text-[15px] font-medium text-ink">{t('gains.disclaimer')}</p>
          {g.lines.length === 0 ? (
            <p className="text-[15px] text-muted">
              {t('gains.noAgent')}{' '}
              <ScreenLink view={view} screen="agents">
                {t('gains.seeAgents')}
              </ScreenLink>
            </p>
          ) : (
            <>
              <p className="tabular text-[34px] font-semibold leading-none tracking-[-0.03em] text-ink" aria-live="polite">
                {t('gains.hoursWeek', { h: hours(g.hoursWeek) })}
              </p>
              <p className="mt-2 text-[15px] text-muted">
                {t('gains.share', { pct: Math.round(g.shareOfOffice * 100) })}
                {g.capped && <> · {t('gains.capped')}</>}
              </p>
              <dl className="tabular mt-5 grid grid-cols-3 gap-3">
                {[
                  ['perWeek', g.valueWeek],
                  ['perMonth', g.valueMonth],
                  ['perYear', g.valueYear],
                ].map(([k, v]) => (
                  <div key={k as string} className="rounded-xl border border-line px-3 py-3">
                    <dt className="text-[13px] text-muted">{t(`gains.${k as 'perWeek'}`)}</dt>
                    <dd className={`mt-1 font-semibold text-ink ${k === 'perYear' ? 'text-[22px]' : 'text-[18px]'}`}>{euros(v as number)}</dd>
                  </div>
                ))}
              </dl>

              <h3 className="mb-2 mt-6 text-sm font-semibold text-muted">{t('gains.detail')}</h3>
              <div className="overflow-x-auto">
                <table className="tabular w-full min-w-[420px] text-[15px]">
                  <thead>
                    <tr className="border-b border-line text-left text-[13px] text-muted">
                      <th className="py-2 font-medium">{t('gains.colAgent')}</th>
                      <th className="py-2 text-right font-medium">{t('gains.colTasks')}</th>
                      <th className="py-2 text-right font-medium">{t('gains.colMinutes')}</th>
                      <th className="py-2 text-right font-medium">{t('gains.colHours')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {g.lines.map((l) => (
                      <tr key={l.id} className="border-b border-line/60">
                        <td className="py-2 pr-3">{t(`agents.names.${l.id}`)}</td>
                        <td className="py-2 text-right">{fmtNumber(l.tasks, lang, 1)}</td>
                        <td className="py-2 text-right">{fmtNumber(l.minutes, lang)}</td>
                        <td className="py-2 text-right font-medium">{hours(l.hours)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="mt-4 text-[13px] leading-relaxed text-muted">{t('gains.formula')}</p>
            </>
          )}
        </Card>
      </div>
    </>
  )
}
