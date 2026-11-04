/*
 * Phrases d'un conflit de planning (titre, explication, solution), partagées par le gérant et le planificateur.
 */
import type { Lang, TKey } from '../../i18n'
import { fmtDate, fmtMoney } from '../../i18n/format'
import { LIFT_RENTAL_CENTS } from '../../data/conflicts'
import { byId, fullName } from '../../data/selectors'
import type { DemoData, PlanConflict } from '../../data/types'

type T = (key: TKey, vars?: Record<string, string | number>) => string

/** Plaque avec tirets insécables : elle ne se coupe jamais en fin de ligne. */
export const plateNb = (plate = '') => plate.replace(/-/g, '‑')

export function conflictTexts(c: PlanConflict, data: DemoData, t: T, lang: Lang) {
  const client = (moveId?: string) => {
    const m = byId(data.moves, moveId)
    return m ? (byId(data.customers, m.customerId)?.name ?? '') : ''
  }
  const vehicleLabel = (id?: string) => {
    const v = byId(data.vehicles, id)
    return v ? `${plateNb(v.plate)} (${t(`vehicleKind.${v.kind}`)})` : ''
  }
  const person = (id?: string) => {
    const s = byId(data.staff, id)
    return s ? fullName(s) : ''
  }
  const move = byId(data.moves, c.moveId)
  const absence = data.absences.find((a) => a.staffId === c.staffId && a.from <= c.date && c.date <= a.to)
  const trucks = (move?.vehicleIds ?? []).map((id) => byId(data.vehicles, id)).filter((v) => v && v.kind !== 'monteMeubles')

  const vars: Record<string, string | number> = {
    a: client(c.moveId),
    b: client(c.otherMoveId),
    vehicle: vehicleLabel(c.vehicleId),
    person: person(c.staffId),
    reason: absence ? t(`absence.${absence.kind}`) : '',
    skill: c.skill ? t(`skill.${c.skill}`) : '',
    volume: move?.volumeM3 ?? 0,
    capacity: trucks.reduce((s, v) => s + (v?.volumeM3 ?? 0), 0),
    due: (() => {
      const v = byId(data.vehicles, c.vehicleId)
      return v ? fmtDate(v.nextInspection, lang, 'dayMonth') : ''
    })(),
  }

  const fix = c.fix
  const fixText = !fix
    ? t('conflicts.fix.none')
    : fix.type === 'postpone'
      ? t('conflicts.fix.postpone', { date: fmtDate(fix.to, lang, 'weekday') })
      : fix.type === 'rentLift'
        ? t('conflicts.fix.rentLift', { amount: fmtMoney(LIFT_RENTAL_CENTS, lang, false) })
        : fix.type === 'vehicle'
      ? t('conflicts.fix.vehicle', { vehicle: vehicleLabel(fix.to) })
      : fix.from
        ? t('conflicts.fix.replace', { from: person(fix.from), to: person(fix.to) })
        : t('conflicts.fix.add', { to: person(fix.to) })

  const title = t(`conflicts.title.${c.kind}`)
  return {
    title,
    titleWithDay: t('conflicts.dayTitle', { title, day: fmtDate(c.date, lang, 'weekday') }),
    text: t(`conflicts.text.${c.kind}`, vars),
    fix: fixText,
  }
}
