/*
 * Distances et durées estimées, à partir des positions approximatives des villes (données fictives).
 * Distance routière ≈ distance à vol d'oiseau × 1,25. Trajet = dépôt → départ → arrivée → dépôt.
 */
import { CITIES } from './lists'

const ROAD_FACTOR = 1.25

function straightKm(a: string, b: string): number {
  const p = CITIES.find((c) => c.id === a)
  const q = CITIES.find((c) => c.id === b)
  if (!p || !q) return 0
  const rad = Math.PI / 180
  const dLat = (q.lat - p.lat) * rad
  const dLon = (q.lon - p.lon) * rad
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(p.lat * rad) * Math.cos(q.lat * rad) * Math.sin(dLon / 2) ** 2
  return 6371 * 2 * Math.asin(Math.sqrt(h))
}

/** Kilomètres d'une ville à l'autre (au moins 4 km pour un déménagement dans la même ville). */
export function legKm(a: string, b: string): number {
  return Math.max(4, Math.round(straightKm(a, b) * ROAD_FACTOR))
}

/** Kilomètres d'un déménagement complet : dépôt → départ → arrivée (si elle existe) → dépôt. */
export function distanceKm(depot: string, from: string, to?: string): number {
  return to ? legKm(depot, from) + legKm(from, to) + legKm(to, depot) : legKm(depot, from) * 2
}

/** Durée prévue : environ 4,5 m³ chargés et livrés par heure + la route à 60 km/h, arrondie à la demi-heure. */
export function plannedHoursFor(volumeM3: number, km: number): number {
  return Math.max(2, Math.round((volumeM3 / 4.5 + km / 60) * 2) / 2)
}

/** Durée de route d'une ville à l'autre, en minutes (60 km/h en moyenne). */
export function legMinutes(a: string, b: string): number {
  return legKm(a, b)
}
