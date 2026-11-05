/*
 * Devis préparé par l'agent (IA SIMULÉE) à partir de la grille tarifaire du gérant.
 * L'agent calcule et PROPOSE (options avec leur raison) ; le commercial modifie chaque ligne ; l'envoi est humain.
 */
import type { DemoData, Lead, Move, Pricing, Quote, QuoteLine } from './types'
import { moveMargin } from './margin'

/** Grille tarifaire de départ (fictive mais crédible), modifiable dans Paramètres. Montants en centimes. */
export const DEFAULT_PRICING: Pricing = {
  perM3Cents: 3800,
  travelFlatCents: 15000,
  perKmCents: 120,
  stairsPerFloorCents: 4500,
  packingPerM3Cents: 700,
  liftCents: 29000,
  storagePerMonthCents: 9000,
  clearanceCents: 25000,
  pianoCents: 18000,
  depositPct: 30,
}

const clampInt = (v: number, min: number, max: number) => (Number.isFinite(v) ? Math.min(max, Math.max(min, Math.round(v))) : min)

/** Lignes proposées par l'agent pour ce dossier, avec la raison de chaque option. */
export function prepareQuote(lead: Lead, move: Move, p: Pricing): Quote {
  const lines: QuoteLine[] = [
    { id: 'volume', kind: 'volume', qty: move.volumeM3, unitCents: p.perM3Cents },
    { id: 'deplacement', kind: 'deplacement', qty: 1, unitCents: p.travelFlatCents },
    { id: 'km', kind: 'km', qty: move.distanceKm, unitCents: p.perKmCents },
  ]
  const stairs = (move.from.elevator ? 0 : move.from.floor) + (move.to && !move.to.elevator ? move.to.floor : 0)
  if (stairs > 0) lines.push({ id: 'etages', kind: 'etages', qty: stairs, unitCents: p.stairsPerFloorCents })
  const high = Math.max(move.from.elevator ? 0 : move.from.floor, move.to && !move.to.elevator ? move.to.floor : 0)
  if (high >= 2) lines.push({ id: 'monteMeubles', kind: 'monteMeubles', qty: 1, unitCents: p.liftCents, reason: 'stairs' })
  if (move.volumeM3 >= 30) lines.push({ id: 'emballage', kind: 'emballage', qty: move.volumeM3, unitCents: p.packingPerM3Cents, reason: 'fragile' })
  if (lead.facts.special === 'piano') lines.push({ id: 'special', kind: 'special', qty: 1, unitCents: p.pianoCents, reason: 'special' })
  return { lines, depositPct: p.depositPct, preparedAt: new Date().toISOString() }
}

/** Total du devis (centimes). Quantités et prix bornés : jamais de NaN ni de montant aberrant. */
export const quoteTotal = (q: Quote) => q.lines.reduce((s, l) => s + clampInt(l.qty, 0, 9999) * clampInt(l.unitCents, 0, 10_000_000), 0)
export const quoteDeposit = (q: Quote) => Math.round((quoteTotal(q) * clampInt(q.depositPct, 0, 100)) / 100 / 100) * 100

/** Corrige une ligne (valeurs bornées). */
export const patchLine = (q: Quote, id: string, patch: Partial<Pick<QuoteLine, 'qty' | 'unitCents'>>): Quote => ({
  ...q,
  lines: q.lines.map((l) =>
    l.id !== id ? l : { ...l, qty: clampInt(patch.qty ?? l.qty, 0, 9999), unitCents: clampInt(patch.unitCents ?? l.unitCents, 0, 10_000_000) },
  ),
})

/** Marge prévue si le dossier est vendu à ce prix (avec les coûts du dossier). */
export function quoteMargin(q: Quote, move: Move, data: DemoData) {
  return moveMargin({ ...move, priceCents: quoteTotal(q), options: optionsOf(q) }, data)
}

export function optionsOf(q: Quote): Move['options'] {
  const o: Move['options'] = []
  if (q.lines.some((l) => l.kind === 'emballage' && l.qty > 0)) o.push('emballage')
  if (q.lines.some((l) => l.kind === 'monteMeubles' && l.qty > 0)) o.push('monteMeubles')
  return o
}
