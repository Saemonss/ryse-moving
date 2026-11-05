/*
 * Début de journée : « Commencer ma journée » → position de départ (simulée, expliquée) →
 * contrôle du camion en 4 étapes maximum (photo du compteur, carburant, état oui/non, photo si problème).
 */
import { useRef, useState } from 'react'
import { Camera, CircleCheck, Fuel, MapPin, Play, ThumbsDown, ThumbsUp } from 'lucide-react'
import { useI18n } from '../../i18n'
import { fmtDate, fmtNumber } from '../../i18n/format'
import { useDemo } from '../../store/demoStore'
import { byId, cityName } from '../../data/selectors'
import { dayId } from '../../data/field'
import type { FuelLevel } from '../../data/types'
import { BigChoice, PhoneScreen } from '../../ui/phone/PhoneKit'
import { PhotoPicker } from '../../ui/phone/PhotoPicker'
import { PhotoView } from '../../ui/Photo'
import { toast } from '../../ui/Toast'
import { demoOdometer, nowIso, useDriver } from './useDriver'

/** Aucun jour commencé : accueil + position de départ. */
export function StartDay({ banner }: { banner?: React.ReactNode }) {
  const { t, lang } = useI18n()
  const { staff, moves, today, data, create } = useDriver()
  const logout = useDemo((s) => s.logout)
  const [phase, setPhase] = useState<'hello' | 'location'>('hello')
  if (!staff) return null
  const depot = staff.agencyId === 'a-lille' ? 'lille' : 'nivelles'
  const truck = moves[0]?.vehicleIds.find((v) => byId(data.vehicles, v)?.kind !== 'monteMeubles') ?? data.teams.find((tm) => tm.memberIds.includes(staff.id))?.defaultVehicleId ?? 'v-1'

  if (phase === 'hello')
    return (
      <PhoneScreen
        banner={banner}
        now={t('terrain.now.notStarted')}
        title={t('chauffeur.hello', { name: staff.firstName })}
        action={{ label: t('terrain.start.button'), icon: Play, onClick: () => setPhase('location') }}
      >
        <p className="-mt-2 text-muted first-letter:uppercase">{fmtDate(today, lang, 'weekday')}</p>
        <p className="rounded-2xl bg-white p-4 shadow-card ring-1 ring-line">
          <span className="block text-[15px] text-muted">{t('terrain.missions.title')}</span>
          <span className="tabular text-[34px] font-bold leading-tight">{moves.length}</span>
        </p>
        <button type="button" onClick={logout} className="min-h-12 text-[16px] font-semibold text-accent">
          {t('terrain.login.logout')}
        </button>
      </PhoneScreen>
    )

  return (
    <PhoneScreen
      banner={banner}
      now={t('terrain.now.location')}
      title={t('terrain.start.locTitle')}
      onBack={() => setPhase('hello')}
      action={{
        label: t('terrain.start.locButton'),
        icon: MapPin,
        onClick: () => {
          create({
            id: dayId(staff.id, today), staffId: staff.id, date: today, status: 'started', startedAt: nowIso(), startPlace: depot,
            vehicleId: truck, pauses: [], expenses: [], missions: [], corrections: [],
          })
          toast(t('terrain.start.locSaved'))
        },
      }}
    >
      <p className="leading-relaxed">{t('terrain.start.locText')}</p>
      <p className="flex items-center gap-2 rounded-2xl bg-white p-4 font-semibold shadow-card ring-1 ring-line">
        <MapPin size={22} className="shrink-0 text-accent" aria-hidden="true" />
        {t('terrain.start.locPlace', { city: cityName(depot, lang) })}
      </p>
    </PhoneScreen>
  )
}

/** Contrôle du camion : 4 étapes au plus, avance automatique après chaque choix. */
export function VehicleCheck({ banner }: { banner?: React.ReactNode }) {
  const { t, lang } = useI18n()
  const { day, data, update } = useDriver()
  const [stepIdx, setStepIdx] = useState(0)
  const [odo, setOdo] = useState<string | null>(null)
  const [fuel, setFuel] = useState<FuelLevel | null>(null)
  const [picking, setPicking] = useState(false)
  const lastTap = useRef(0)
  /** Anti double tap : un choix qui fait avancer ne compte qu'une fois en 0,4 s. */
  const once = (fn: () => void) => {
    if (Date.now() - lastTap.current < 400) return
    lastTap.current = Date.now()
    fn()
  }
  if (!day) return null
  const km = demoOdometer(day.vehicleId)
  const vehicle = byId(data.vehicles, day.vehicleId)

  const save = (ok: boolean, problemPhoto?: string) => {
    update('vehicleCheck', (d) => ({ ...d, check: { km, odometerPhoto: odo ?? 'demo:compteur', fuel: fuel ?? 'demi', ok, problemPhoto } }))
    toast(t('terrain.check.done'))
  }

  const titles = [t('terrain.check.odoTitle'), t('terrain.check.fuelTitle'), t('terrain.check.stateTitle'), t('terrain.check.problemTitle')]
  return (
    <PhoneScreen
      banner={banner}
      now={t('terrain.now.check')}
      title={t('terrain.check.title')}
      onBack={stepIdx > 0 ? () => setStepIdx((s) => s - 1) : undefined}
      action={
        stepIdx === 0
          ? odo
            ? { label: t('terrain.keypad.ok'), icon: CircleCheck, onClick: () => setStepIdx(1) }
            : { label: t('terrain.check.odoTitle'), icon: Camera, onClick: () => setPicking(true) }
          : stepIdx === 3
            ? { label: t('terrain.check.problemTitle'), icon: Camera, onClick: () => setPicking(true) }
            : undefined
      }
    >
      <p className="font-semibold text-accent">{t('terrain.check.step', { n: stepIdx + 1 })}</p>
      <p className="text-[19px] font-bold">{titles[stepIdx]}</p>
      {vehicle && <p className="-mt-2 text-muted">{`${t(`vehicleKind.${vehicle.kind}`)} · ${vehicle.plate}`}</p>}

      {stepIdx === 0 && (
        <>
          <p className="text-muted">{t('terrain.check.odoText')}</p>
          {odo && (
            <div className="space-y-2">
              <PhotoView photo={odo} />
              <p className="tabular text-[20px] font-bold text-success">{t('terrain.check.odoRead', { km: fmtNumber(km, lang) })}</p>
            </div>
          )}
        </>
      )}
      {stepIdx === 1 && (
        <BigChoice
          label={t('terrain.check.fuelTitle')}
          value={fuel}
          onChange={(v) =>
            once(() => {
              setFuel(v)
              setStepIdx(2)
            })
          }
          options={(['quart', 'demi', 'troisQuarts', 'plein'] as const).map((v) => ({ value: v, label: t(`terrain.check.fuel.${v}`), icon: Fuel }))}
        />
      )}
      {stepIdx === 2 && (
        <BigChoice
          label={t('terrain.check.stateTitle')}
          columns={1}
          value={null}
          onChange={(v) => once(() => (v === 'yes' ? save(true) : setStepIdx(3)))}
          options={[
            { value: 'yes', label: t('terrain.check.yes'), icon: ThumbsUp },
            { value: 'no', label: t('terrain.check.no'), icon: ThumbsDown },
          ]}
        />
      )}
      {stepIdx === 3 && <p className="text-muted">{t('terrain.check.problemText')}</p>}

      <PhotoPicker
        open={picking}
        onClose={() => setPicking(false)}
        suggested={stepIdx === 0 ? ['compteur'] : ['rayure']}
        onPick={(p) => {
          if (stepIdx === 0) setOdo(p)
          else save(false, p)
        }}
      />
    </PhoneScreen>
  )
}
