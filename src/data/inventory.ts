/*
 * Estimation du volume par photos (IA SIMULÉE) : chaque photo de démonstration correspond à une pièce et à une liste
 * de meubles typiques avec leur volume. Le commercial corrige les quantités ; le volume final est validé par l'humain.
 */
import type { InventoryLine, RoomKey } from './types'

/** Volume unitaire (m³) des objets reconnus. */
export const ITEM_M3: Record<string, number> = {
  canape: 2.5, fauteuil: 0.8, meubleTv: 0.8, tableBasse: 0.3, lit: 2, armoire: 2, commode: 0.8, chevet: 0.2,
  frigo: 1, tableChaises: 1.5, cartonsVaisselle: 0.1, cartons: 0.1,
}

const PHOTO_ROOM: Record<string, { room: RoomKey; items: [string, number][] }> = {
  'demo:salon': { room: 'salon', items: [['canape', 1], ['fauteuil', 2], ['meubleTv', 1], ['tableBasse', 1]] },
  'demo:chambre': { room: 'chambre', items: [['lit', 1], ['armoire', 1], ['commode', 1], ['chevet', 2]] },
  'demo:cuisine': { room: 'cuisine', items: [['frigo', 1], ['tableChaises', 1], ['cartonsVaisselle', 6]] },
  'demo:cartons': { room: 'cave', items: [['cartons', 25]] },
}

/** Les photos « envoyées » par le client : complètes (4 pièces) ou incomplètes (1 photo seulement). */
export const DEMO_CLIENT_PHOTOS = { full: ['demo:salon', 'demo:chambre', 'demo:cuisine', 'demo:cartons'], partial: ['demo:salon'] }

export function inventoryFromPhotos(photos: string[]): InventoryLine[] {
  return photos.flatMap((p) => {
    const r = PHOTO_ROOM[p]
    if (!r) return []
    return r.items.map(([item, qty]) => ({ id: `${r.room}-${item}`, room: r.room, item, qty, m3: ITEM_M3[item] ?? 0.5 }))
  })
}

/** Confiance de l'estimation : peu de pièces photographiées = confiance faible (l'agent propose une visite). */
export const confidenceFor = (photos: string[]): 'haute' | 'moyenne' | 'faible' => (photos.length >= 4 ? 'moyenne' : photos.length >= 2 ? 'moyenne' : 'faible')

/** Volume total (m³), quantités bornées (0 à 99) : jamais de NaN. */
export const inventoryTotal = (lines: InventoryLine[]) =>
  Math.round(lines.reduce((s, l) => s + Math.min(99, Math.max(0, Number.isFinite(l.qty) ? l.qty : 0)) * l.m3, 0) * 10) / 10
