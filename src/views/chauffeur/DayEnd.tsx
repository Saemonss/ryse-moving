/*
 * Fin de journée : photo du compteur de fin et position de fin (simulée) → récapitulatif simple
 * (heures, kilomètres, missions, frais, incidents) → « Envoyer ma journée au bureau ».
 */
import { useState } from 'react'
import { Camera, CircleCheck, Send } from 'lucide-react'
import { useI18n } from '../../i18n'
import { fmtMoney, fmtNumber } from '../../i18n/format'
import { useDemo } from '../../store/demoStore'
import { cityName } from '../../data/selectors'
import { MISSION_DONE, dayKm, workedHours } from '../../data/field'
import { PhoneScreen } from '../../ui/phone/PhoneKit'
import { PhotoPicker } from '../../ui/phone/PhotoPicker'
import { toast } from '../../ui/Toast'
import { nowIso, useDriver } from './useDriver'

export function DayEnd({ banner, onBack }: { banner?: React.ReactNode; onBack?: () => void }) {
  const { t, lang } = useI18n()
  const { day, moves, update } = useDriver()
  const logout = useDemo((s) => s.logout)
  const [picking, setPicking] = useState(false)
  if (!day) return null

  // 1. Compteur de fin
  if (day.status === 'started')
    return (
      <PhoneScreen
        banner={banner}
        now={t('terrain.now.allDone')}
        title={t('terrain.end.button')}
        onBack={onBack}
        action={{ label: t('terrain.end.endKm'), icon: Camera, onClick: () => setPicking(true) }}
      >
        <p className="rounded-2xl bg-white p-4 font-semibold shadow-card ring-1 ring-line">{t('terrain.end.place', { city: cityName(day.startPlace, lang) })}</p>
        <PhotoPicker
          open={picking}
          onClose={() => setPicking(false)}
          suggested={['compteur']}
          onPick={() => {
            const km = moves.reduce((s, m) => s + m.distanceKm, 0)
            update('dayEnd', (d) => ({ ...d, status: 'ended', endedAt: nowIso(), endKm: (d.check?.km ?? 0) + km, endPlace: d.startPlace }))
            toast(t('terrain.end.ended'))
          }}
        />
      </PhoneScreen>
    )

  const done = day.missions.filter((m) => m.step >= MISSION_DONE).length
  const expenses = day.expenses.reduce((s, e) => s + e.cents, 0)
  const incidents = day.missions.filter((m) => m.damage).length + (day.check && !day.check.ok ? 1 : 0)
  const rows: [string, string][] = [
    [t('terrain.end.hours'), workedHours(day) < 1 ? t('terrain.end.minutesValue', { n: Math.round(workedHours(day) * 60) }) : t('terrain.end.hoursValue', { n: fmtNumber(workedHours(day), lang, 1) })],
    [t('terrain.end.km'), `${fmtNumber(dayKm(day), lang)} km`],
    [t('terrain.end.missions'), `${done} / ${moves.length}`],
    [t('terrain.end.expenses'), fmtMoney(expenses, lang)],
    [t('terrain.end.incidents'), incidents ? String(incidents) : t('terrain.end.none')],
  ]
  const sent = day.status === 'sent' || day.status === 'validated'

  return (
    <PhoneScreen
      banner={banner}
      now={sent ? t('terrain.now.sent') : t('terrain.now.ended')}
      title={t('terrain.end.title')}
      action={
        sent
          ? { label: t('terrain.login.logout'), onClick: logout }
          : {
              label: t('terrain.end.send'),
              icon: Send,
              onClick: () => {
                update('daySent', (d) => ({ ...d, status: 'sent', sentAt: nowIso() }))
                toast(t('terrain.end.sent'))
              },
            }
      }
    >
      {sent && (
        <p className="flex items-center gap-2 rounded-2xl bg-success-soft px-4 py-3 font-semibold text-success">
          <CircleCheck size={22} aria-hidden="true" />
          {t('terrain.end.sent')}
        </p>
      )}
      <dl className="divide-y divide-line rounded-2xl bg-white shadow-card ring-1 ring-line">
        {rows.map(([label, value]) => (
          <div key={label} className="flex items-center justify-between gap-3 px-4 py-3">
            <dt className="text-muted">{label}</dt>
            <dd className="tabular text-[19px] font-bold">{value}</dd>
          </div>
        ))}
      </dl>
      <p className="text-[15px] text-muted">{t('terrain.end.place', { city: cityName(day.endPlace ?? day.startPlace, lang) })}</p>
    </PhoneScreen>
  )
}
