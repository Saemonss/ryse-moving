/*
 * Mes missions du jour : une carte par déménagement, dans l'ordre (adresse, heure, étage, ascenseur, stationnement,
 * contact avec « Appeler », consignes du bureau, « Itinéraire »). Une seule action principale : la mission suivante.
 * En bas : Pause et Frais. Quand tout est fait : « Terminer ma journée ».
 */
import { useState } from 'react'
import { CircleCheck, Coffee, Flag, MapPin, Navigation, Phone, Play, Receipt } from 'lucide-react'
import { useI18n } from '../../i18n'
import { fmtMoney, fmtNumber, fmtPhone, fmtTime } from '../../i18n/format'
import { cityName, customerOf, fmtAddress } from '../../data/selectors'
import { MISSION_DONE, MISSION_STEPS, emptyMission, isPaused, putMission } from '../../data/field'
import { legKm } from '../../data/geo'
import type { ExpenseKind, Move, Site } from '../../data/types'
import { BigChoice, Keypad, PhoneScreen, PhoneSecondary, Sheet } from '../../ui/phone/PhoneKit'
import { PhotoPicker } from '../../ui/phone/PhotoPicker'
import { PhotoView } from '../../ui/Photo'
import { Button } from '../../ui/Button'
import { StatusBadge } from '../../ui/StatusBadge'
import { toast } from '../../ui/Toast'
import { nowIso, useDriver } from './useDriver'
import { useDemo } from '../../store/demoStore'

export function MissionsScreen({ banner, onOpen, onEnd }: { banner?: React.ReactNode; onOpen: (moveId: string) => void; onEnd: () => void }) {
  const { t, lang } = useI18n()
  const { day, moves, data, update, staff } = useDriver()
  const logout = useDemo((s) => s.logout)
  const [calling, setCalling] = useState<Move | null>(null)
  const [routing, setRouting] = useState<Move | null>(null)
  const [expense, setExpense] = useState(false)
  if (!day) return null

  const stepOf = (m: Move) => day.missions.find((x) => x.moveId === m.id)?.step ?? 0
  const next = moves.find((m) => stepOf(m) < MISSION_DONE)
  const paused = isPaused(day)
  const floorText = (s: Site) =>
    `${s.floor === 0 ? t('common.groundFloor') : s.floor === 1 ? t('common.firstFloor') : t('common.floor', { n: s.floor })} · ${s.elevator ? t('common.elevator') : t('common.noElevator')}`

  const togglePause = () => {
    update('pause', (d) =>
      paused ? { ...d, pauses: d.pauses.map((p) => (p.end ? p : { ...p, end: nowIso() })) } : { ...d, pauses: [...d.pauses, { start: nowIso() }] },
    )
    toast(t(paused ? 'terrain.pause.resumed' : 'terrain.pause.started'))
  }
  const openMission = (m: Move) => {
    if (!day.missions.some((x) => x.moveId === m.id)) update('step', (d) => putMission(d, emptyMission(m.id)))
    onOpen(m.id)
  }
  const pauseSince = day.pauses.find((p) => !p.end)?.start

  return (
    <PhoneScreen
      banner={banner}
      now={paused ? t('terrain.now.paused') : next ? t('terrain.now.missions') : t('terrain.now.allDone')}
      title={t('terrain.missions.title')}
      secondary={
        !paused && (
          <>
            <PhoneSecondary icon={Coffee} onClick={togglePause}>
              {t('terrain.pause.start')}
            </PhoneSecondary>
            <PhoneSecondary icon={Receipt} onClick={() => setExpense(true)}>
              {t('terrain.expense.button')}
            </PhoneSecondary>
          </>
        )
      }
      action={
        paused
          ? { label: t('terrain.pause.resume'), icon: Play, onClick: togglePause }
          : next
            ? { label: stepOf(next) > 0 ? t('terrain.missions.resume') : t('terrain.missions.open'), icon: Play, onClick: () => openMission(next) }
            : { label: t('terrain.end.button'), icon: Flag, onClick: onEnd }
      }
    >
      {paused && pauseSince && <p className="rounded-2xl bg-warning-soft px-4 py-3 font-semibold text-warning">{t('terrain.pause.banner', { time: fmtTime(pauseSince, lang) })}</p>}
      {moves.length === 0 && <p className="text-muted">{t('terrain.missions.none')}</p>}
      <button type="button" onClick={logout} className="-mt-2 min-h-12 text-[16px] font-semibold text-accent">
        {t('terrain.login.logout')} ({staff?.firstName})
      </button>
      <ol className="space-y-3">
        {moves.map((m, i) => {
          const step = stepOf(m)
          const client = customerOf(data, m)
          return (
            <li key={m.id} className={`rounded-2xl bg-white p-4 shadow-card ring-1 ${m.id === next?.id ? 'ring-2 ring-accent' : 'ring-line'}`}>
              <div className="flex items-center justify-between gap-2">
                <span className="text-[15px] font-semibold text-muted">{t('terrain.missions.order', { n: i + 1 })}</span>
                {step >= MISSION_DONE ? (
                  <StatusBadge tone="success" size="lg">{t('terrain.missions.done')}</StatusBadge>
                ) : step > 0 ? (
                  <StatusBadge tone="warning" size="lg">{t('live.step', { n: step, label: t(`terrain.mission.steps.${MISSION_STEPS[step - 1]!}`) })}</StatusBadge>
                ) : (
                  <span className="tabular text-[20px] font-bold">{m.startTime}</span>
                )}
              </div>
              <p className="mt-1 text-[21px] font-bold leading-tight">{client?.name}</p>
              <p className="mt-2 flex gap-2 leading-snug">
                <MapPin size={20} className="mt-0.5 shrink-0 text-accent" aria-hidden="true" />
                <span>
                  {fmtAddress(m.from, lang)}
                  <span className="block text-muted">{floorText(m.from)}</span>
                  <span className="block text-muted">
                    {t('terrain.missions.parking')} {t(`parking.${m.from.parking}`)}
                  </span>
                </span>
              </p>
              {m.note && (
                <p className="mt-2 rounded-xl bg-warning-soft px-3 py-2 leading-snug">
                  <strong className="font-semibold text-warning">{t('terrain.missions.officeNote')}</strong> {t(`notes.${m.note}`, { n: m.from.number })}
                </p>
              )}
              {step < MISSION_DONE && (
                <div className="mt-3 flex gap-2">
                  <PhoneSecondary icon={Phone} onClick={() => setCalling(m)}>
                    {t('terrain.missions.call')}
                  </PhoneSecondary>
                  <PhoneSecondary icon={Navigation} onClick={() => setRouting(m)}>
                    {t('terrain.missions.route')}
                  </PhoneSecondary>
                </div>
              )}
            </li>
          )
        })}
      </ol>

      <Sheet open={!!calling} onClose={() => setCalling(null)} title={t('terrain.missions.call')}>
        {calling && (
          <div className="space-y-4">
            <p className="flex items-center gap-3 text-[18px]">
              <span className="grid size-14 place-items-center rounded-full bg-success-soft text-success">
                <Phone size={26} aria-hidden="true" />
              </span>
              {t('terrain.missions.calling', { name: customerOf(data, calling)?.contact ?? customerOf(data, calling)?.name ?? '', phone: fmtPhone(customerOf(data, calling)?.phone ?? '') })}
            </p>
            <Button size="xl" variant="danger" onClick={() => setCalling(null)}>
              {t('common.close')}
            </Button>
          </div>
        )}
      </Sheet>

      <Sheet open={!!routing} onClose={() => setRouting(null)} title={t('terrain.route.title')}>
        {routing && <RoutePreview move={routing} depot={day.startPlace} />}
      </Sheet>

      <ExpenseSheet open={expense} onClose={() => setExpense(false)} moveId={next?.id} />
    </PhoneScreen>
  )
}

/** Aperçu de trajet simulé (aucune carte en ligne). */
function RoutePreview({ move, depot }: { move: Move; depot: string }) {
  const { t, lang } = useI18n()
  const stops = [depot, move.from.cityId, ...(move.to ? [move.to.cityId] : [])]
  return (
    <div className="space-y-3">
      <svg viewBox="0 0 300 120" className="w-full rounded-2xl bg-[#e9eef0]" aria-hidden="true">
        <path d="M0 80 Q 80 40 160 70 T 300 50" stroke="#ffffff" strokeWidth="14" fill="none" />
        <path d="M30 90 C 90 30, 170 100, 270 40" stroke="#5b3bea" strokeWidth="5" fill="none" strokeLinecap="round" strokeDasharray="1 0" />
        <circle cx="30" cy="90" r="8" fill="#0b1026" />
        <circle cx="270" cy="40" r="9" fill="#5b3bea" stroke="#fff" strokeWidth="3" />
      </svg>
      <ol className="space-y-2">
        {stops.map((c, i) => (
          <li key={`${c}-${i}`} className="flex items-center gap-2 text-[17px]">
            <MapPin size={18} className={i === 0 ? 'text-muted' : 'text-accent'} aria-hidden="true" />
            <span className="font-semibold">{i === 0 ? t('planning.depot', { city: cityName(c, lang) }) : cityName(c, lang)}</span>
            {i > 0 && (
              <span className="tabular ml-auto text-[15px] text-muted">
                {t('terrain.route.leg', { km: fmtNumber(legKm(stops[i - 1]!, c), lang), min: legKm(stops[i - 1]!, c) })}
              </span>
            )}
          </li>
        ))}
      </ol>
      <p className="text-[15px] text-muted">{t('terrain.route.note')}</p>
    </div>
  )
}

/** Frais : type en un tap, photo du ticket, montant sur le pavé géant. */
function ExpenseSheet({ open, onClose, moveId }: { open: boolean; onClose: () => void; moveId?: string }) {
  const { t, lang } = useI18n()
  const { update } = useDriver()
  const [kind, setKind] = useState<ExpenseKind | null>(null)
  const [photo, setPhoto] = useState<string | null>(null)
  const [amount, setAmount] = useState('')
  const [picking, setPicking] = useState(false)
  const cents = Math.round(Number(amount.replace(',', '.') || '0') * 100)
  const reset = () => {
    setKind(null)
    setPhoto(null)
    setAmount('')
  }
  return (
    <>
    <Sheet
      open={open}
      onClose={() => {
        reset()
        onClose()
      }}
      title={t('terrain.expense.title')}
    >
      <div className="space-y-4">
        <BigChoice
          label={t('terrain.expense.kind')}
          value={kind}
          onChange={setKind}
          options={(['peage', 'carburant', 'parking'] as const).map((k) => ({ value: k, label: t(`terrain.expense.kinds.${k}`) }))}
        />
        {photo ? (
          <PhotoView photo={photo} className="max-h-40 object-contain" />
        ) : (
          <Button size="lg" variant="secondary" className="w-full" onClick={() => setPicking(true)}>
            {t('terrain.expense.photo')}
          </Button>
        )}
        <p className="tabular text-center text-[30px] font-bold" aria-live="polite">
          {amount ? fmtMoney(cents, lang) : '— €'}
        </p>
        <Keypad value={amount} onChange={setAmount} decimal maxLength={6} />
        {(!kind || !photo || cents <= 0) && (
          <p id="expense-hint" className="text-center text-[15px] font-medium text-muted">
            {t('terrain.expense.hint')}
          </p>
        )}
        <Button
          size="xl"
          icon={CircleCheck}
          aria-describedby={!kind || !photo || cents <= 0 ? 'expense-hint' : undefined}
          disabled={!kind || !photo || cents <= 0}
          onClick={() => {
            if (!kind || !photo) return
            update('expense', (d) => ({ ...d, expenses: [...d.expenses, { id: `exp-${d.expenses.length + 1}-${Date.now()}`, kind, cents, photo, at: nowIso(), moveId }] }))
            toast(t('terrain.expense.saved', { amount: fmtMoney(cents, lang) }))
            reset()
            onClose()
          }}
        >
          {t('terrain.expense.save')}
        </Button>
      </div>
    </Sheet>
    <PhotoPicker open={picking} onClose={() => setPicking(false)} onPick={setPhoto} suggested={['ticket']} />
    </>
  )
}

