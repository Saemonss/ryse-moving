/*
 * Gérant › Paramètres : coût horaire chargé, coût au km par véhicule, prix du carburant, seuil d'alerte de marge.
 * Chaque modification recalcule immédiatement les marges partout (accueil, fiches, rentabilité, alertes).
 * Les valeurs sont bornées : une saisie vide ou aberrante ne peut pas casser les calculs.
 */
import { useEffect, useState } from 'react'
import { RotateCcw } from 'lucide-react'
import { useI18n } from '../../i18n'
import { fmtMoney } from '../../i18n/format'
import { useDemo, SETTINGS_BOUNDS } from '../../store/demoStore'
import { DEFAULT_SETTINGS } from '../../data/seed'
import { CONSUMPTION_L100, moveMargin } from '../../data/margin'
import type { Settings, VehicleKind } from '../../data/types'
import { Card } from '../../ui/Card'
import { Button } from '../../ui/Button'
import { toast } from '../../ui/Toast'
import { PageHeader } from '../shared/Page'

const KINDS: VehicleKind[] = ['camion20', 'camion40', 'porteurHayon', 'utilitaire', 'monteMeubles']

export function SettingsScreen() {
  const { t, lang } = useI18n()
  const data = useDemo((s) => s.data)
  const today = useDemo((s) => s.seedDay)
  const updateSettings = useDemo((s) => s.updateSettings)
  const s = data.settings

  const month = data.moves.filter((m) => m.date.startsWith(today.slice(0, 7)) && ['planifie', 'enCours', 'termine', 'facture', 'paye'].includes(m.status))
  const rev = month.reduce((a, m) => a + m.priceCents, 0)
  const mar = month.reduce((a, m) => a + moveMargin(m, data).cents, 0)

  const B = SETTINGS_BOUNDS
  return (
    <>
      <PageHeader title={t('settings.title')} subtitle={t('settings.subtitle')} />
      <div className="mb-6 flex flex-wrap items-center gap-x-6 gap-y-2 rounded-2xl border border-line/80 bg-white px-5 py-4 shadow-card" aria-live="polite">
        <p className="text-[15px] text-muted">{t('settings.preview')}</p>
        <p className="tabular text-xl font-semibold text-ink" data-testid="settings-preview">
          {rev ? Math.round((mar / rev) * 100) : 0} % · {fmtMoney(mar, lang, false)}
        </p>
        <Button
          size="sm"
          variant="ghost"
          icon={RotateCcw}
          className="ml-auto"
          onClick={() => {
            updateSettings(DEFAULT_SETTINGS)
            toast(t('settings.restored'))
          }}
        >
          {t('settings.restore')}
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card title={t('settings.labourTitle')}>
          <div className="space-y-4">
            <NumberField
              label={t('settings.hourly')}
              unit={t('settings.perHour')}
              cents={s.hourlyCostCents}
              bounds={B.hourlyCostCents}
              onCommit={(v) => updateSettings({ hourlyCostCents: v })}
            />
            <NumberField
              label={t('settings.threshold')}
              unit="%"
              cents={s.marginThresholdPct}
              bounds={B.marginThresholdPct}
              integer
              onCommit={(v) => updateSettings({ marginThresholdPct: v })}
            />
          </div>
        </Card>
        <Card title={t('settings.transportTitle')}>
          <div className="space-y-4">
            <NumberField
              label={t('settings.fuel')}
              unit={t('settings.perLitre')}
              cents={s.fuelCentsPerLitre}
              bounds={B.fuelCentsPerLitre}
              onCommit={(v) => updateSettings({ fuelCentsPerLitre: v })}
            />
            {KINDS.map((k) => (
              <NumberField
                key={k}
                label={t('settings.kmCost', { vehicle: t(`vehicleKind.${k}`) })}
                unit={t('settings.perKm')}
                hint={t('settings.consumption', { n: CONSUMPTION_L100[k] })}
                cents={s.kmCostCents[k]}
                bounds={B.kmCostCents}
                onCommit={(v) => updateSettings({ kmCostCents: { ...s.kmCostCents, [k]: v } as Settings['kmCostCents'] })}
              />
            ))}
          </div>
        </Card>
      </div>
    </>
  )
}

interface NumberFieldProps {
  label: string
  unit: string
  hint?: string
  /** Valeur stockée : centimes (ou pourcentage entier si integer). */
  cents: number
  bounds: readonly [number, number]
  integer?: boolean
  onCommit: (value: number) => void
}

/** Champ nombre : la saisie est appliquée dès qu'elle est valide ; à la sortie du champ, la valeur retenue s'affiche. */
function NumberField({ label, unit, hint, cents, bounds, integer = false, onCommit }: NumberFieldProps) {
  const { t, lang } = useI18n()
  // FR et NL (Belgique) écrivent les décimales avec une virgule
  const show = (v: number) => (integer ? String(v) : (v / 100).toFixed(2).replace('.', ','))
  const [text, setText] = useState(show(cents))
  const [focused, setFocused] = useState(false)
  useEffect(() => {
    if (!focused) setText(show(cents))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cents, focused, lang])

  const id = `nf-${label.replace(/\W+/g, '-')}`
  const [min, max] = bounds
  const range = integer ? `${min} – ${max}` : `${show(min)} – ${show(max)}`
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-ink">
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
            if (e.target.value.trim() !== '' && Number.isFinite(n)) onCommit(integer ? Math.round(n) : Math.round(n * 100))
          }}
          aria-describedby={`${id}-hint`}
          className="tabular h-11 w-32 rounded-xl border border-line bg-white px-3.5 text-right text-[15px] shadow-card focus:border-accent focus:outline-none focus:ring-4 focus:ring-accent-pale/60"
        />
        <span className="text-[15px] text-muted">{unit}</span>
      </div>
      <p id={`${id}-hint`} className="mt-1 text-[13px] text-muted">
        {hint ? `${hint} · ` : ''}
        {t('settings.range', { range: (range as string) + (integer ? ' %' : '') })}
      </p>
    </div>
  )
}

