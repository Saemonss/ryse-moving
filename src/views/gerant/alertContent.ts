/*
 * Textes d'une alerte (titre, phrase courte, bouton) calculés à partir des données.
 */
import type { Lang, TKey } from '../../i18n'
import { fmtDate, fmtMoney } from '../../i18n/format'
import { byId } from '../../data/selectors'
import type { Alert, DemoData } from '../../data/types'
import { conflictTexts, plateNb } from '../shared/conflictText'

type T = (key: TKey, vars?: Record<string, string | number>) => string

export function alertContent(alert: Alert, data: DemoData, t: T, lang: Lang) {
  const move = byId(data.moves, alert.moveId)
  const client = move ? (byId(data.customers, move.customerId)?.name ?? '') : ''
  const vehicle = byId(data.vehicles, alert.vehicleId)
  switch (alert.kind) {
    case 'conflict': {
      if (!alert.conflict) return { title: '', text: '', action: '' }
      const c = conflictTexts(alert.conflict, data, t, lang)
      return { title: c.titleWithDay, text: c.text, action: t('conflicts.resolve') }
    }
    case 'quote':
      return {
        title: t('alerts.quote.title', { n: alert.days ?? 0 }),
        text: t('alerts.quote.text', { client, amount: fmtMoney(move?.priceCents ?? 0, lang, false) }),
        action: t('alerts.quote.action'),
      }
    case 'damage':
      return {
        title: t('alerts.damage.title'),
        text: t('alerts.damage.text', {
          item: (() => {
            const dmg = data.days.find((d) => d.id === alert.dayId)?.missions.find((m) => m.moveId === alert.moveId)?.damage
            return dmg ? t(`terrain.items.${dmg.item}`) : ''
          })(),
          client,
          date: move ? fmtDate(move.date, lang, 'dayMonth') : '',
        }),
        action: t('alerts.damage.action'),
      }
    case 'invoice':
      return {
        title: t('alerts.invoice.title'),
        text: t('alerts.invoice.text', { client, amount: fmtMoney(move?.priceCents ?? 0, lang, false), n: alert.days ?? 0 }),
        action: t('alerts.invoice.action'),
      }
    case 'inspection':
      return {
        title: t('alerts.inspection.title', { n: alert.days ?? 0 }),
        text: t('alerts.inspection.text', { vehicle: vehicle ? t(`vehicleKind.${vehicle.kind}`) : '', plate: plateNb(vehicle?.plate) }),
        action: t('alerts.inspection.action'),
      }
    case 'lowMargin':
      return {
        title: t('alerts.lowMargin.title'),
        text: t('alerts.lowMargin.text', { pct: data.settings.marginThresholdPct, n: alert.count ?? 0 }),
        action: t('alerts.lowMargin.action'),
      }
  }
}
