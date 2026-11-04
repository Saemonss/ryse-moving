/*
 * Textes d'une alerte (titre, phrase courte, bouton) calculés à partir des données.
 */
import type { Lang, TKey } from '../../i18n'
import { fmtDate, fmtMoney } from '../../i18n/format'
import { byId } from '../../data/selectors'
import type { Alert, DemoData } from '../../data/types'

type T = (key: TKey, vars?: Record<string, string | number>) => string

export function alertContent(alert: Alert, data: DemoData, t: T, lang: Lang) {
  const move = byId(data.moves, alert.moveId)
  const client = move ? (byId(data.customers, move.customerId)?.name ?? '') : ''
  const vehicle = byId(data.vehicles, alert.vehicleId)
  switch (alert.kind) {
    case 'conflict': {
      const other = byId(data.moves, alert.otherMoveId)
      const otherClient = other ? (byId(data.customers, other.customerId)?.name ?? '') : ''
      return {
        title: t('alerts.conflict.title', { day: move ? fmtDate(move.date, lang, 'weekday') : '' }),
        text: t('alerts.conflict.text', { vehicle: vehicle?.plate ?? '', a: client, b: otherClient }),
        action: t('alerts.conflict.action'),
      }
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
        text: t('alerts.damage.text', { item: t('items.commode'), client, date: move ? fmtDate(move.date, lang, 'dayMonth') : '' }),
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
        text: t('alerts.inspection.text', { vehicle: vehicle ? t(`vehicleKind.${vehicle.kind}`) : '', plate: vehicle?.plate ?? '' }),
        action: t('alerts.inspection.action'),
      }
  }
}
