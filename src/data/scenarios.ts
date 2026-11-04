/*
 * Situations de démo : les alertes sont DÉDUITES des données (jamais stockées).
 * Régler une alerte = modifier la donnée concernée (fixAlert) ; l'alerte disparaît alors d'elle-même.
 */
import { addDays, diffDays, fromISO } from './dates'
import { byId, movesOn, vehicleBusy } from './selectors'
import type { Alert, DemoData, ISODate } from './types'

const QUOTE_SILENCE_DAYS = 5
const INSPECTION_WARNING_DAYS = 21
const TRUCKS = ['camion20', 'camion40', 'porteurHayon']

export function deriveAlerts(data: DemoData, today: ISODate): Alert[] {
  const alerts: Alert[] = []

  // 1. Même camion pour 2 équipes le même jour (aujourd'hui et 14 jours à venir)
  for (let d = 0; d <= 14; d++) {
    const day = addDays(today, d)
    const seen = new Map<string, string>()
    for (const move of movesOn(data, day)) {
      const truck = move.vehicleIds.find((v) => TRUCKS.includes(byId(data.vehicles, v)?.kind ?? ''))
      if (!truck) continue
      const first = seen.get(truck)
      if (first) {
        const free = data.vehicles
          .filter((v) => TRUCKS.includes(v.kind) && v.volumeM3 >= move.volumeM3 && !vehicleBusy(data, v, day))
          .sort((a, b) => a.volumeM3 - b.volumeM3)[0]
        alerts.push({ id: `conflict-${move.id}`, kind: 'conflict', tone: 'danger', moveId: first, otherMoveId: move.id, vehicleId: truck, suggestedVehicleId: free?.id })
      } else seen.set(truck, move.id)
    }
  }

  // 2. Facture échue non payée
  for (const m of data.moves) {
    if (m.status === 'facture' && m.invoiceDueOn && m.invoiceDueOn < today && !m.paymentReminderOn)
      alerts.push({ id: `invoice-${m.id}`, kind: 'invoice', tone: 'danger', moveId: m.id, days: diffDays(today, m.invoiceDueOn) })
  }

  // 3. Devis sans réponse
  for (const m of data.moves) {
    if (m.status === 'devisEnvoye' && m.quoteSentOn && !m.quoteReminderOn) {
      const days = diffDays(today, m.quoteSentOn)
      if (days >= QUOTE_SILENCE_DAYS) alerts.push({ id: `quote-${m.id}`, kind: 'quote', tone: 'warning', moveId: m.id, days })
    }
  }

  // 4. Objet signalé abîmé
  for (const m of data.moves) {
    if (m.damage && !m.damage.claimOpened) alerts.push({ id: `damage-${m.id}`, kind: 'damage', tone: 'warning', moveId: m.id })
  }

  // 5. Contrôle technique proche
  for (const v of data.vehicles) {
    const days = diffDays(v.nextInspection, today)
    if (!v.inspectionBookedOn && days >= 0 && days <= INSPECTION_WARNING_DAYS) {
      let suggestedDate: ISODate | undefined
      for (let d = 1; d < days; d++) {
        const day = addDays(today, d)
        if (fromISO(day).getDay() !== 0 && fromISO(day).getDay() !== 6 && !vehicleBusy(data, v, day)) {
          suggestedDate = day
          break
        }
      }
      alerts.push({ id: `inspection-${v.id}`, kind: 'inspection', tone: 'info', vehicleId: v.id, days, suggestedDate: suggestedDate ?? addDays(today, 1) })
    }
  }

  return alerts
}

/** Applique la solution proposée pour une alerte et renvoie les nouvelles données. */
export function fixAlert(data: DemoData, alert: Alert, today: ISODate): DemoData {
  const patchMove = (id: string | undefined, patch: (m: DemoData['moves'][number]) => DemoData['moves'][number]) => ({
    ...data,
    moves: data.moves.map((m) => (m.id === id ? patch(m) : m)),
  })
  switch (alert.kind) {
    case 'conflict':
      return patchMove(alert.otherMoveId, (m) => ({
        ...m,
        vehicleIds: m.vehicleIds.map((v) => (v === alert.vehicleId && alert.suggestedVehicleId ? alert.suggestedVehicleId : v)),
      }))
    case 'quote':
      return patchMove(alert.moveId, (m) => ({ ...m, quoteReminderOn: today }))
    case 'invoice':
      return patchMove(alert.moveId, (m) => ({ ...m, paymentReminderOn: today }))
    case 'damage':
      return patchMove(alert.moveId, (m) => (m.damage ? { ...m, damage: { ...m.damage, claimOpened: true } } : m))
    case 'inspection':
      return {
        ...data,
        vehicles: data.vehicles.map((v) => (v.id === alert.vehicleId ? { ...v, inspectionBookedOn: alert.suggestedDate } : v)),
      }
  }
}
