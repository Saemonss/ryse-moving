/*
 * Déroulé guidé d'une mission, « Étape 3 sur 7 » : départ → arrivée chez le client → état des lieux de départ
 * → chargement → trajet → état des lieux d'arrivée (+ signaler un dégât) → signature du client → « Mission terminée ».
 * Chaque saisie est enregistrée tout de suite sur le téléphone (et envoyée, ou mise en file hors ligne).
 */
import { useState } from 'react'
import { Camera, CircleCheck, Minus, Navigation, PenLine, Phone, Plus, TriangleAlert } from 'lucide-react'
import { useI18n } from '../../i18n'
import { fmtPhone, fmtTime } from '../../i18n/format'
import { byId, cityName, customerOf, fmtAddress } from '../../data/selectors'
import { MISSION_DONE, MISSION_STEPS, putMission } from '../../data/field'
import type { Damage, FragileKey, MissionLog, ReserveKey, RoomKey, SpecialKey } from '../../data/types'
import { BigChoice, PhoneScreen, PhoneSecondary, Sheet } from '../../ui/phone/PhoneKit'
import { PhotoPicker } from '../../ui/phone/PhotoPicker'
import { SignaturePad } from '../../ui/phone/SignaturePad'
import { PhotoView, type DemoPhotoKey } from '../../ui/Photo'
import { Button } from '../../ui/Button'
import { toast } from '../../ui/Toast'
import { nowIso, useDriver } from './useDriver'

const ROOMS: RoomKey[] = ['salon', 'chambre', 'cuisine', 'bureau', 'cave']
const FRAGILE: FragileKey[] = ['miroir', 'vaisselle', 'tableau', 'ecran', 'piano']
const RESERVES: ReserveKey[] = ['rayuresExistantes', 'meubleDemonte', 'cartonsClient', 'accesDifficile']
const SPECIAL: SpecialKey[] = ['piano', 'frigo', 'armoire', 'coffre', 'aquarium']
const ROOM_PHOTO: Record<RoomKey, DemoPhotoKey> = { salon: 'salon', chambre: 'chambre', cuisine: 'cuisine', bureau: 'armoire', cave: 'cartons' }

const toggle = <T,>(list: T[], v: T) => (list.includes(v) ? list.filter((x) => x !== v) : [...list, v])

export function MissionFlow({ moveId, onBack, banner }: { moveId: string; onBack: () => void; banner?: React.ReactNode }) {
  const { t, lang } = useI18n()
  const { day, data, update } = useDriver()
  const [picking, setPicking] = useState<RoomKey | null>(null)
  const [calling, setCalling] = useState(false)
  const [damaging, setDamaging] = useState(false)
  const [signature, setSignature] = useState<string | null>(null)
  const move = byId(data.moves, moveId)
  const log = day?.missions.find((m) => m.moveId === moveId)
  if (!day || !move || !log) return null
  const client = customerOf(data, move)
  const place = move.to ? fmtAddress(move.to, lang) : t(move.type === 'debarras' ? 'common.recycling' : 'common.storage')

  const save = (label: 'photos' | 'damage' | 'step' | 'signature', patch: Partial<MissionLog>) => update(label, (d) => putMission(d, { ...log, ...patch }))

  if (log.step >= MISSION_DONE)
    return (
      <PhoneScreen banner={banner} now={t('terrain.now.missions')} action={{ label: t('terrain.mission.backToMissions'), onClick: onBack }}>
        <div className="flex flex-col items-center gap-3 py-6 text-center">
          <span className="grid size-20 place-items-center rounded-full bg-success-soft text-success animate-[rm-scale-in_240ms_var(--ease-out)]">
            <CircleCheck size={44} aria-hidden="true" />
          </span>
          <p className="text-[26px] font-bold">{t('terrain.mission.finished')}</p>
          <p className="text-muted">{client?.name}</p>
          {log.signature && <img src={log.signature.image} alt={t('terrain.mission.signedBy', { name: log.signature.name })} className="h-20 rounded-xl bg-white p-2 ring-1 ring-line" />}
        </div>
      </PhoneScreen>
    )

  const key = MISSION_STEPS[log.step]!
  const photos = key === 'edlDepart' ? log.startPhotos : log.endPhotos
  const reserves = key === 'edlDepart' ? log.reservesStart : log.reservesEnd

  const advance = (extra: Partial<MissionLog> = {}) => {
    save(key === 'signature' ? 'signature' : 'step', { ...extra, step: log.step + 1, times: [...log.times, nowIso()] })
    toast(t(`terrain.mission.confirm.${key}`))
    setSignature(null)
  }

  const needs: { disabled: boolean; hint?: string } =
    key === 'edlDepart' || key === 'edlArrivee'
      ? { disabled: photos.length === 0, hint: t('terrain.mission.needPhoto') }
      : key === 'signature'
        ? { disabled: !signature, hint: t('terrain.mission.needSign') }
        : { disabled: false }

  return (
    <PhoneScreen
      banner={banner}
      now={t(`terrain.now.step.${key}`, { client: client?.name ?? '', place })}
      progress={{ n: log.step + 1, total: MISSION_DONE, label: t(`terrain.mission.steps.${key}`) }}
      onBack={onBack}
      secondary={
        key === 'edlArrivee' ? (
          <PhoneSecondary icon={TriangleAlert} onClick={() => setDamaging(true)}>
            {t('terrain.mission.reportDamage')}
          </PhoneSecondary>
        ) : key === 'depart' || key === 'trajet' ? (
          <PhoneSecondary icon={Phone} onClick={() => setCalling(true)}>
            {t('terrain.missions.call')}
          </PhoneSecondary>
        ) : undefined
      }
      action={{
        label: t(`terrain.mission.actions.${key}`),
        icon: key === 'signature' ? PenLine : CircleCheck,
        disabled: needs.disabled,
        hint: needs.hint,
        onClick: () => advance(key === 'signature' && signature ? { signature: { name: client?.name ?? '', image: signature, at: nowIso() } } : {}),
      }}
    >
      {(key === 'depart' || key === 'arriveeClient' || key === 'trajet') && (
        <div className="rounded-2xl bg-white p-4 shadow-card ring-1 ring-line">
          <p className="text-[21px] font-bold leading-tight">{key === 'trajet' ? place : client?.name}</p>
          <p className="mt-1 flex gap-2 leading-snug">
            <Navigation size={20} className="mt-0.5 shrink-0 text-accent" aria-hidden="true" />
            {key === 'trajet' ? (move.to ? cityName(move.to.cityId, lang) : place) : fmtAddress(move.from, lang)}
          </p>
          {log.times.length > 0 && <p className="mt-2 text-[15px] text-muted">{fmtTime(log.times.at(-1)!, lang)}</p>}
        </div>
      )}

      {(key === 'edlDepart' || key === 'edlArrivee') && (
        <>
          <p className="font-semibold">{t('terrain.mission.rooms')}</p>
          <div className="grid grid-cols-2 gap-2">
            {ROOMS.slice(0, key === 'edlArrivee' ? 3 : 5).map((room) => {
              const p = photos.find((x) => x.room === room)
              return (
                <button
                  key={room}
                  type="button"
                  data-room={room}
                  onClick={() => setPicking(room)}
                  className="overflow-hidden rounded-2xl bg-white text-left shadow-card ring-1 ring-line active:scale-[0.97]"
                >
                  {p ? (
                    <PhotoView photo={p.photo} className="rounded-none" />
                  ) : (
                    <span className="grid aspect-[4/3] place-items-center bg-surface text-muted">
                      <Camera size={28} aria-hidden="true" />
                    </span>
                  )}
                  <span className="flex items-center justify-between px-3 py-2 text-[16px] font-semibold">
                    {t(`terrain.rooms.${room}`)}
                    {p && <CircleCheck size={18} className="text-success" aria-hidden="true" />}
                  </span>
                </button>
              )
            })}
          </div>
          <p className="text-[15px] text-muted">{t('terrain.mission.photosCount', { n: photos.length })}</p>
          {key === 'edlDepart' && (
            <>
              <p className="font-semibold">{t('terrain.mission.fragile')}</p>
              <BigChoice
                label={t('terrain.mission.fragile')}
                value={log.fragile}
                onChange={(v) => save('photos', { fragile: toggle(log.fragile, v) })}
                options={FRAGILE.map((f) => ({ value: f, label: t(`terrain.items.${f}`) }))}
              />
            </>
          )}
          <p className="font-semibold">{t('terrain.mission.reserves')}</p>
          <BigChoice
            label={t('terrain.mission.reserves')}
            columns={1}
            value={reserves}
            onChange={(v) => save('photos', key === 'edlDepart' ? { reservesStart: toggle(log.reservesStart, v) } : { reservesEnd: toggle(log.reservesEnd, v) })}
            options={RESERVES.map((r) => ({ value: r, label: t(`terrain.reserves.${r}`) }))}
          />
          {key === 'edlArrivee' && log.damage && (
            <p className="flex items-center gap-2 rounded-2xl bg-warning-soft px-4 py-3 font-semibold text-warning">
              <TriangleAlert size={20} aria-hidden="true" />
              {t('terrain.mission.damageDone', { item: t(`terrain.items.${log.damage.item}`) })}
            </p>
          )}
        </>
      )}

      {key === 'chargement' && (
        <>
          <p className="font-semibold">{t('terrain.mission.parcels')}</p>
          <div className="flex items-center justify-between gap-3 rounded-2xl bg-white p-3 shadow-card ring-1 ring-line">
            <button type="button" aria-label={t('terrain.mission.less')} onClick={() => save('photos', { parcels: Math.max(0, log.parcels - 1) })} className="grid size-14 place-items-center rounded-2xl bg-surface active:scale-95">
              <Minus size={26} aria-hidden="true" />
            </button>
            <span className="tabular text-[40px] font-bold" aria-live="polite">{log.parcels}</span>
            <button type="button" aria-label={t('terrain.mission.more')} onClick={() => save('photos', { parcels: log.parcels + 1 })} className="grid size-14 place-items-center rounded-2xl bg-accent text-white active:scale-95">
              <Plus size={26} aria-hidden="true" />
            </button>
          </div>
          <div className="flex gap-2">
            {[10, 20, 30].map((n) => (
              <button key={n} type="button" onClick={() => save('photos', { parcels: n })} className="min-h-12 flex-1 rounded-2xl bg-white text-[17px] font-semibold shadow-card ring-1 ring-line">
                {n}
              </button>
            ))}
          </div>
          <p className="font-semibold">{t('terrain.mission.special')}</p>
          <BigChoice
            label={t('terrain.mission.special')}
            value={log.specialItems}
            onChange={(v) => save('photos', { specialItems: toggle(log.specialItems, v) })}
            options={SPECIAL.map((s) => ({ value: s, label: t(`terrain.items.${s}`) }))}
          />
        </>
      )}

      {key === 'signature' && (
        <>
          <p className="text-[19px] font-bold">{t('terrain.mission.signedBy', { name: client?.name ?? '' })}</p>
          <SignaturePad onChange={setSignature} />
        </>
      )}

      <PhotoPicker
        open={!!picking}
        onClose={() => setPicking(null)}
        suggested={picking ? [ROOM_PHOTO[picking]] : undefined}
        onPick={(photo) => {
          if (!picking) return
          const list = [...photos.filter((x) => x.room !== picking), { room: picking, photo }]
          save('photos', key === 'edlDepart' ? { startPhotos: list } : { endPhotos: list })
          toast(t('terrain.picker.saved'))
        }}
      />
      <Sheet open={calling} onClose={() => setCalling(false)} title={t('terrain.missions.call')}>
        <p className="mb-4 text-[18px]">{t('terrain.missions.calling', { name: client?.contact ?? client?.name ?? '', phone: fmtPhone(client?.phone ?? '') })}</p>
        <Button size="xl" variant="danger" onClick={() => setCalling(false)}>
          {t('common.close')}
        </Button>
      </Sheet>
      <DamageSheet
        open={damaging}
        onClose={() => setDamaging(false)}
        onSave={(damage) => {
          save('damage', { damage })
          toast(t('terrain.damage.saved'))
        }}
      />
    </PhoneScreen>
  )
}

/** Signaler un dégât en 4 gestes : photo, objet, type, gravité. */
function DamageSheet({ open, onClose, onSave }: { open: boolean; onClose: () => void; onSave: (d: Damage) => void }) {
  const { t } = useI18n()
  const [photo, setPhoto] = useState<string | null>(null)
  const [item, setItem] = useState<Damage['item'] | null>(null)
  const [type, setType] = useState<Damage['type'] | null>(null)
  const [severity, setSeverity] = useState<Damage['severity'] | null>(null)
  const [picking, setPicking] = useState(false)
  const close = () => {
    setPhoto(null)
    setItem(null)
    setType(null)
    setSeverity(null)
    onClose()
  }
  return (
    <>
      <Sheet open={open} onClose={close} title={t('terrain.damage.title')}>
        <div className="space-y-4">
          <p className="font-semibold">1 · {t('terrain.damage.photo')}</p>
          {photo ? (
            <PhotoView photo={photo} className="max-h-40 object-contain" />
          ) : (
            <Button size="lg" variant="secondary" icon={Camera} className="w-full" onClick={() => setPicking(true)}>
              {t('terrain.picker.title')}
            </Button>
          )}
          <p className="font-semibold">2 · {t('terrain.damage.item')}</p>
          <BigChoice
            label={t('terrain.damage.item')}
            value={item}
            onChange={setItem}
            options={(['miroir', 'tableau', 'ecran', 'armoire', 'meuble', 'vaisselle'] as const).map((v) => ({ value: v, label: t(`terrain.items.${v}`) }))}
          />
          <p className="font-semibold">3 · {t('terrain.damage.type')}</p>
          <BigChoice
            label={t('terrain.damage.type')}
            value={type}
            onChange={setType}
            options={(['rayure', 'casse', 'tache', 'bosse'] as const).map((v) => ({ value: v, label: t(`terrain.damageTypes.${v}`) }))}
          />
          <p className="font-semibold">4 · {t('terrain.damage.severity')}</p>
          <BigChoice
            label={t('terrain.damage.severity')}
            value={severity}
            onChange={setSeverity}
            columns={1}
            options={(['leger', 'moyen', 'grave'] as const).map((v) => ({ value: v, label: t(`terrain.severity.${v}`) }))}
          />
          {(!photo || !item || !type || !severity) && (
            <p id="damage-hint" className="text-center text-[15px] font-medium text-muted">
              {t('terrain.damage.hint')}
            </p>
          )}
          <Button
            size="xl"
            icon={CircleCheck}
            aria-describedby={!photo || !item || !type || !severity ? 'damage-hint' : undefined}
            disabled={!photo || !item || !type || !severity}
            onClick={() => {
              if (!photo || !item || !type || !severity) return
              onSave({ photo, item, type, severity })
              close()
            }}
          >
            {t('terrain.damage.save')}
          </Button>
        </div>
      </Sheet>
      <PhotoPicker open={picking} onClose={() => setPicking(false)} onPick={setPhoto} suggested={['rayure']} />
    </>
  )
}
