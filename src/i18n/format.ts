/*
 * Formats selon la langue : dates, heures, montants en euros, nombres, téléphones.
 * FR → fr-BE, NL → nl-BE. Les montants sont stockés en centimes (entiers) pour éviter les erreurs d'arrondi.
 */
import { LOCALES, type Lang } from './index'

const loc = (lang: Lang) => LOCALES[lang]

export type DateStyle = 'short' | 'medium' | 'long' | 'weekday' | 'dayMonth'

export function fmtDate(date: Date | string, lang: Lang, style: DateStyle = 'medium'): string {
  const d = typeof date === 'string' ? new Date(date) : date
  const options: Record<DateStyle, Intl.DateTimeFormatOptions> = {
    short: { day: '2-digit', month: '2-digit', year: 'numeric' },
    medium: { day: 'numeric', month: 'short', year: 'numeric' },
    long: { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' },
    weekday: { weekday: 'long', day: 'numeric', month: 'long' },
    dayMonth: { day: 'numeric', month: 'short' },
  }
  return new Intl.DateTimeFormat(loc(lang), options[style]).format(d)
}

export function fmtTime(date: Date | string, lang: Lang): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return new Intl.DateTimeFormat(loc(lang), { hour: '2-digit', minute: '2-digit' }).format(d)
}

/** Montant en centimes → « 1 250,00 € » (fr-BE) / « € 1.250,00 » (nl-BE). */
export function fmtMoney(cents: number, lang: Lang, withDecimals = true): string {
  return new Intl.NumberFormat(loc(lang), {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: withDecimals ? 2 : 0,
    maximumFractionDigits: withDecimals ? 2 : 0,
  }).format(cents / 100)
}

export function fmtNumber(value: number, lang: Lang, digits = 0): string {
  return new Intl.NumberFormat(loc(lang), { maximumFractionDigits: digits }).format(value)
}

/** Téléphone stocké en format international (+32470123456) → lisible (+32 470 12 34 56). */
export function fmtPhone(phone: string): string {
  const m = /^\+(32|33)(\d)(\d+)$/.exec(phone.replace(/\s/g, ''))
  if (!m) return phone
  const [, cc = '', first = '', rest = ''] = m
  if (cc === '32') {
    // Belgique : mobile +32 4xx xx xx xx
    const all = first + rest
    return `+32 ${all.slice(0, 3)} ${all.slice(3, 5)} ${all.slice(5, 7)} ${all.slice(7)}`.trim()
  }
  const pairs = rest.match(/.{1,2}/g) ?? []
  return `+33 ${first} ${pairs.join(' ')}`
}
