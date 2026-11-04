/*
 * Gérant › Déménagements : tous les dossiers, filtrables (statut, type, pays, période) avec une recherche.
 * Un paramètre d'adresse peut pré-filtrer le statut (ex. #/gerant/demenagements/devisSigne depuis l'accueil).
 * Clic sur un dossier → sa fiche.
 */
import { useState } from 'react'
import { Search } from 'lucide-react'
import { useI18n } from '../../i18n'
import { fmtDate, fmtMoney } from '../../i18n/format'
import { useDemo } from '../../store/demoStore'
import { addDays, startOfWeek } from '../../data/dates'
import { STATUS_TONE, cityName, customerOf } from '../../data/selectors'
import { isLowMargin, moveMargin } from '../../data/margin'
import type { Move, MoveStatus, MoveType } from '../../data/types'
import { Card } from '../../ui/Card'
import { SimpleTable } from '../../ui/SimpleTable'
import { StatusBadge } from '../../ui/StatusBadge'
import { Select } from '../../ui/Select'
import { Button } from '../../ui/Button'
import { PageHeader } from '../shared/Page'
import { ScreenLink } from '../shared/ScreenLink'

const STATUSES: MoveStatus[] = ['demande', 'visite', 'devisEnvoye', 'devisSigne', 'planifie', 'enCours', 'termine', 'facture', 'paye']
const TYPES: MoveType[] = ['appartement', 'maison', 'bureaux', 'international', 'gardeMeuble', 'debarras']
const PERIODS = ['all', 'week', 'month', 'upcoming', 'past'] as const
type Period = (typeof PERIODS)[number]

export function MovesList({ param }: { param?: string }) {
  const { t, lang } = useI18n()
  const data = useDemo((s) => s.data)
  const today = useDemo((s) => s.seedDay)
  const [status, setStatus] = useState<string>(STATUSES.includes(param as MoveStatus) ? param! : 'all')
  const [type, setType] = useState('all')
  const [country, setCountry] = useState('all')
  const [period, setPeriod] = useState<Period>('all')
  const [query, setQuery] = useState('')

  const monday = startOfWeek(today)
  const inPeriod = (m: Move) => {
    if (period === 'week') return m.date >= monday && m.date <= addDays(monday, 6)
    if (period === 'month') return m.date.startsWith(today.slice(0, 7))
    if (period === 'upcoming') return m.date >= today
    if (period === 'past') return m.date < today
    return true
  }
  const q = query.trim().toLowerCase()
  const matches = (m: Move) => {
    if (!q) return true
    const hay = [customerOf(data, m)?.name, m.ref, cityName(m.from.cityId, lang), m.to ? cityName(m.to.cityId, lang) : ''].join(' ').toLowerCase()
    return hay.includes(q)
  }
  const rows = data.moves
    .filter((m) => (status === 'all' || m.status === status) && (type === 'all' || m.type === type))
    .filter((m) => country === 'all' || m.from.country === country || m.to?.country === country)
    .filter((m) => inPeriod(m) && matches(m))
    .sort((a, b) => b.date.localeCompare(a.date))
  const filtered = status !== 'all' || type !== 'all' || country !== 'all' || period !== 'all' || q !== ''

  const all = { value: 'all', label: t('moves.all') }
  return (
    <>
      <PageHeader title={t('moves.title')} subtitle={t('moves.subtitle')} />
      <Card padded={false}>
        <div className="grid gap-3 border-b border-line px-5 py-4 md:grid-cols-2 xl:grid-cols-[minmax(220px,1.4fr)_repeat(4,minmax(0,1fr))]">
          <div>
            <label htmlFor="moves-search" className="mb-1.5 block text-sm font-medium text-ink">
              {t('moves.search')}
            </label>
            <div className="relative">
              <Search size={17} aria-hidden="true" className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
              <input
                id="moves-search"
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t('moves.searchPlaceholder')}
                className="h-11 w-full rounded-xl border border-line bg-white pl-10 pr-3.5 text-[15px] text-ink shadow-card placeholder:text-muted/80 focus:border-accent focus:outline-none focus:ring-4 focus:ring-accent-pale/60"
              />
            </div>
          </div>
          <Select label={t('moves.status')} value={status} onChange={setStatus} options={[all, ...STATUSES.map((s) => ({ value: s, label: t(`status.${s}`) }))]} />
          <Select label={t('moves.type')} value={type} onChange={setType} options={[all, ...TYPES.map((s) => ({ value: s, label: t(`moveType.${s}`) }))]} />
          <Select
            label={t('moves.country')}
            value={country}
            onChange={setCountry}
            options={[all, { value: 'BE', label: t('moves.countries.BE') }, { value: 'FR', label: t('moves.countries.FR') }]}
          />
          <Select label={t('moves.period')} value={period} onChange={(v) => setPeriod(v as Period)} options={PERIODS.map((p) => ({ value: p, label: t(`moves.periods.${p}`) }))} />
        </div>
        <div className="flex min-h-12 items-center justify-between gap-3 border-b border-line px-5 py-2">
          <p className="tabular text-sm text-muted" aria-live="polite">
            {t('moves.results', { n: rows.length })}
          </p>
          {filtered && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                setStatus('all')
                setType('all')
                setCountry('all')
                setPeriod('all')
                setQuery('')
              }}
            >
              {t('moves.reset')}
            </Button>
          )}
        </div>
        <SimpleTable
          rows={rows}
          rowKey={(m) => m.id}
          empty={t('moves.empty')}
          columns={[
            {
              key: 'ref',
              label: t('moves.colRef'),
              render: (m) => (
                <span data-crawl-sample>
                  <ScreenLink view="gerant" screen="dossier" param={m.id} className="whitespace-nowrap">
                    {m.ref}
                  </ScreenLink>
                </span>
              ),
            },
            {
              key: 'client',
              label: t('moves.colClient'),
              render: (m) => (
                <div className="whitespace-nowrap">
                  <p className="font-medium">{customerOf(data, m)?.name}</p>
                  <p className="text-[13px] text-muted">
                    {cityName(m.from.cityId, lang)} → {m.to ? cityName(m.to.cityId, lang) : t(m.type === 'debarras' ? 'common.recycling' : 'common.storage')}
                    <span className="min-[1400px]:hidden"> · {t(`moveType.${m.type}`)}</span>
                  </p>
                </div>
              ),
            },
            // Type : colonne masquée sur les écrans étroits (il reste lisible sous le nom du client)
            { key: 'type', label: t('moves.colType'), className: 'hidden min-[1400px]:table-cell', render: (m) => <span className="whitespace-nowrap">{t(`moveType.${m.type}`)}</span> },
            { key: 'date', label: t('moves.colDate'), render: (m) => <span className="whitespace-nowrap">{fmtDate(m.date, lang, 'medium')}</span> },
            { key: 'status', label: t('moves.colStatus'), render: (m) => <StatusBadge tone={STATUS_TONE[m.status]}>{t(`status.${m.status}`)}</StatusBadge> },
            { key: 'amount', label: t('moves.colAmount'), className: 'text-right', render: (m) => <span className="whitespace-nowrap">{fmtMoney(m.priceCents, lang, false)}</span> },
            {
              key: 'margin',
              label: t('moves.colMargin'),
              className: 'text-right',
              render: (m) => (
                <span className={`font-medium ${isLowMargin(m, data) ? 'text-danger' : 'text-success'}`}>{Math.round(moveMargin(m, data).rate * 100)} %</span>
              ),
            },
          ]}
        />
      </Card>
    </>
  )
}
