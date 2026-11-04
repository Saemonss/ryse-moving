/*
 * Accès simple à la journée du chauffeur connecté, côté TÉLÉPHONE.
 * update(label, fn) : modifie la journée ; l'envoi au bureau (ou la mise en file hors ligne) est automatique.
 */
import { useDemo, type QueueLabel } from '../../store/demoStore'
import { dayId, driverMoves, putDay } from '../../data/field'
import type { DriverDay } from '../../data/types'

export function useDriver() {
  const data = useDemo((s) => s.data)
  const today = useDemo((s) => s.seedDay)
  const session = useDemo((s) => s.session)
  const phoneDays = useDemo((s) => s.phoneDays)
  const field = useDemo((s) => s.field)
  const staff = data.staff.find((s) => s.id === session)
  const day = session ? phoneDays.find((d) => d.id === dayId(session, today)) : undefined
  const moves = session ? driverMoves(data, session, today) : []

  const update = (label: QueueLabel, fn: (d: DriverDay) => DriverDay) => {
    if (!day) return
    field(label, (days) => putDay(days, fn(day)))
  }
  const create = (d: DriverDay) => field('dayStart', (days) => putDay(days, d))
  return { data, today, session, staff, day, moves, update, create }
}

/** Kilométrage « lu » sur la photo du compteur (démo : valeur réaliste et stable par véhicule). */
export function demoOdometer(_vehicleId: string): number {
  return 48_210 // la photo de démonstration du compteur affiche 048 210
}

export const nowIso = () => new Date().toISOString()
