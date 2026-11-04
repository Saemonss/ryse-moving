/*
 * Calcul de la marge d'un déménagement, à partir des Paramètres du gérant.
 *   coût = main-d'œuvre (heures × personnes × coût horaire)
 *        + transport (km × (coût au km du véhicule + consommation × prix du carburant))
 *        + monte-meubles (forfait de mise en place) + matériel (couvertures, sangles, cartons si emballage)
 * Les heures réelles remplacent les heures prévues dès que le dossier est terminé.
 */
import type { DemoData, Move, Vehicle, VehicleKind } from './types'

/** Consommation moyenne en litres aux 100 km, par type de véhicule. */
export const CONSUMPTION_L100: Record<VehicleKind, number> = { camion20: 18, camion40: 26, porteurHayon: 22, utilitaire: 10, monteMeubles: 14 }
const LIFT_SETUP_CENTS = 25_000
const MATERIAL_BASE_CENTS = 4_000
const PACKING_PER_M3_CENTS = 300
/** Au-delà : « heures dépassées ». */
export const OVER_HOURS_RATIO = 1.15
/** Au-delà : « longue distance ». */
export const LONG_DISTANCE_KM = 150

export type MarginReason = 'hours' | 'distance' | 'liftUnbilled'

export interface CostBreakdown {
  labour: number
  transport: number
  lift: number
  material: number
  /** Coûts supplémentaires (location de monte-meubles…). */
  extra: number
  total: number
  hours: number
  crewSize: number
}

/** Véhicules du dossier ; s'il n'est pas encore planifié, on estime le camion nécessaire. */
function vehiclesOf(move: Move, data: DemoData): Vehicle[] {
  const assigned = move.vehicleIds.map((id) => data.vehicles.find((v) => v.id === id)).filter((v): v is Vehicle => !!v)
  if (assigned.length) return assigned
  const kind: VehicleKind = move.volumeM3 <= 20 ? 'camion20' : 'camion40'
  const truck = data.vehicles.find((v) => v.kind === kind)
  const lift = move.liftUsed ? data.vehicles.find((v) => v.kind === 'monteMeubles') : undefined
  return [truck, lift].filter((v): v is Vehicle => !!v)
}

export function moveCost(move: Move, data: DemoData): CostBreakdown {
  const s = data.settings
  const crewSize = move.teamIds.length || (move.volumeM3 > 30 ? 3 : 2)
  const hours = move.actualHours ?? move.plannedHours
  const labour = hours * crewSize * s.hourlyCostCents
  const transport = vehiclesOf(move, data).reduce(
    (sum, v) => sum + move.distanceKm * (s.kmCostCents[v.kind] + (CONSUMPTION_L100[v.kind] * s.fuelCentsPerLitre) / 100),
    0,
  )
  const lift = move.liftUsed && !move.liftRented ? LIFT_SETUP_CENTS : 0
  const extra = (move.extraCosts ?? []).reduce((s, c) => s + c.cents, 0)
  const material = MATERIAL_BASE_CENTS + (move.options.includes('emballage') ? move.volumeM3 * PACKING_PER_M3_CENTS : 0)
  const total = Math.round(labour + transport + lift + material + extra)
  return { labour: Math.round(labour), transport: Math.round(transport), lift, material, extra, total, hours, crewSize }
}

export function moveMargin(move: Move, data: DemoData): { cents: number; rate: number } {
  const cents = move.priceCents - moveCost(move, data).total
  return { cents, rate: move.priceCents > 0 ? cents / move.priceCents : 0 }
}

export function isLowMargin(move: Move, data: DemoData): boolean {
  return moveMargin(move, data).rate * 100 < data.settings.marginThresholdPct
}

/** Ce qui explique une marge faible (vide si rien de particulier). */
export function marginReasons(move: Move): MarginReason[] {
  const reasons: MarginReason[] = []
  if (move.actualHours && move.actualHours > move.plannedHours * OVER_HOURS_RATIO) reasons.push('hours')
  if (move.distanceKm > LONG_DISTANCE_KM) reasons.push('distance')
  if (move.liftUsed && !move.options.includes('monteMeubles')) reasons.push('liftUnbilled')
  return reasons
}
