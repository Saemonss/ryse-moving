/*
 * Petites fonctions de lecture des données : retrouver un client, un camion, formater une adresse,
 * choisir la couleur d'un statut. À utiliser dans les vues plutôt que de refaire les recherches partout.
 */
import type { Lang } from '../i18n'
import type { Tone } from '../ui/StatusBadge'
import { CITIES } from './lists'
import type { Address, DemoData, ISODate, Move, MoveStatus, Staff, Vehicle } from './types'

/** Couleur officielle de chaque statut (une couleur = un sens). */
export const STATUS_TONE: Record<MoveStatus, Tone> = {
  demande: 'neutral',
  visite: 'accent',
  devisEnvoye: 'accent',
  devisSigne: 'info',
  planifie: 'info',
  enCours: 'warning',
  termine: 'success',
  facture: 'neutral',
  paye: 'success',
}

export const ACTIVE_ON_DAY: MoveStatus[] = ['planifie', 'enCours']

export function cityName(cityId: string, lang: Lang): string {
  const c = CITIES.find((x) => x.id === cityId)
  return c ? c[lang] : cityId
}

export function fmtAddress(a: Address, lang: Lang): string {
  return `${a.street} ${a.number}, ${a.postcode} ${cityName(a.cityId, lang)}`
}

export const byId = <T extends { id: string }>(list: T[], id: string | undefined): T | undefined =>
  id ? list.find((x) => x.id === id) : undefined

export const fullName = (s: Pick<Staff, 'firstName' | 'lastName'>) => `${s.firstName} ${s.lastName}`

export function customerOf(data: DemoData, move: Move) {
  return byId(data.customers, move.customerId)
}

export function movesOn(data: DemoData, day: ISODate): Move[] {
  return data.moves
    .filter((m) => m.date === day && ACTIVE_ON_DAY.includes(m.status))
    .sort((a, b) => a.startTime.localeCompare(b.startTime))
}

export function isAbsent(data: DemoData, staffId: string, day: ISODate): boolean {
  return data.absences.some((a) => a.staffId === staffId && a.from <= day && day <= a.to)
}

export function vehicleBusy(data: DemoData, vehicle: Vehicle, day: ISODate): boolean {
  return movesOn(data, day).some((m) => m.vehicleIds.includes(vehicle.id))
}
