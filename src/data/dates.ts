/*
 * Petites fonctions de dates. Tout est calculé à partir d'« aujourd'hui » : la démo est toujours à jour.
 */
import type { ISODate } from './types'

export function toISO(d: Date): ISODate {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function todayISO(): ISODate {
  return toISO(new Date())
}

/** 'AAAA-MM-JJ' → Date à midi (heure locale), pour éviter les décalages d'heure d'été. */
export function fromISO(iso: ISODate): Date {
  const [y = 2000, m = 1, d = 1] = iso.split('-').map(Number)
  return new Date(y, m - 1, d, 12)
}

export function addDays(iso: ISODate, n: number): ISODate {
  const d = fromISO(iso)
  d.setDate(d.getDate() + n)
  return toISO(d)
}

export function diffDays(a: ISODate, b: ISODate): number {
  return Math.round((fromISO(a).getTime() - fromISO(b).getTime()) / 86_400_000)
}

/** Date + heure 'HH:MM' → Date. */
export function at(iso: ISODate, time: string): Date {
  const d = fromISO(iso)
  const [h = 8, min = 0] = time.split(':').map(Number)
  d.setHours(h, min, 0, 0)
  return d
}

/** Lundi de la semaine qui contient la date. */
export function startOfWeek(iso: ISODate): ISODate {
  const day = fromISO(iso).getDay() // 0 = dimanche
  return addDays(iso, day === 0 ? -6 : 1 - day)
}
