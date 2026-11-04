/*
 * Alertes du gérant : elles sont DÉDUITES des données (jamais stockées).
 * Régler une alerte = modifier la donnée concernée (fixAlert) ; l'alerte disparaît alors d'elle-même.
 */
import { addDays, diffDays, fromISO } from './dates'
import { applyFix, detectConflicts } from './conflicts'
import { isLowMargin } from './margin'
import { vehicleBusy } from './selectors'
import type { Alert, DemoData, ISODate } from './types'

const QUOTE_SILENCE_DAYS = 5
/** Alerte entretien / contrôle technique : 30 jours avant l'échéance. */
export const VEHICLE_WARNING_DAYS = 30
const CONFLICT_HORIZON_DAYS = 14
const LOW_MARGIN_LOOKBACK_DAYS = 30

/** Dossiers terminés récemment dont la marge est sous le seuil. */
export function recentLowMargin(data: DemoData, today: ISODate) {
  return data.moves.filter(
    (m) => ['termine', 'facture', 'paye'].includes(m.status) && diffDays(today, m.date) <= LOW_MARGIN_LOOKBACK_DAYS && isLowMargin(m, data),
  )
}

export function deriveAlerts(data: DemoData, today: ISODate): Alert[] {
  const alerts: Alert[] = []
  const horizon = addDays(today, CONFLICT_HORIZON_DAYS)

  // 1. Conflits de planning (aujourd'hui → 14 jours)
  for (const c of detectConflicts(data)) {
    if (c.date >= today && c.date <= horizon) alerts.push({ id: `conflict-${c.id}`, kind: 'conflict', tone: 'danger', moveId: c.moveId, conflict: c })
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

  // 5. Contrôle technique dans les 30 jours
  for (const v of data.vehicles) {
    const days = diffDays(v.nextInspection, today)
    if (!v.inspectionBookedOn && days >= 0 && days <= VEHICLE_WARNING_DAYS) {
      let suggestedDate: ISODate | undefined
      for (let d = 0; d < Math.max(days, 1); d++) {
        const day = addDays(today, d)
        const weekday = fromISO(day).getDay()
        if (weekday !== 0 && weekday !== 6 && !vehicleBusy(data, v, day)) {
          suggestedDate = day
          break
        }
      }
      alerts.push({ id: `inspection-${v.id}`, kind: 'inspection', tone: 'info', vehicleId: v.id, days, suggestedDate: suggestedDate ?? today })
    }
  }

  // 6. Marges faibles du dernier mois (action « Voir » → Rentabilité)
  const low = recentLowMargin(data, today)
  if (low.length) alerts.push({ id: 'low-margin', kind: 'lowMargin', tone: 'warning', count: low.length })

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
      return alert.conflict ? applyFix(data, alert.conflict) : data
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
    case 'lowMargin':
      return data
  }
}
