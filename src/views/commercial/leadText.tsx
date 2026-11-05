/*
 * Textes d'une demande : le message du client et la réponse de l'agent, TOUJOURS dans la langue du client
 * (pas celle de l'écran). Le message est découpé en morceaux : ceux qui portent une information sont surlignés
 * quand l'agent les « extrait ».
 */
import { CircleHelp, Globe, Handshake, Mail, MessageCircle, MessageSquareText, PhoneIncoming, Voicemail, type LucideIcon } from 'lucide-react'
import { translate, type Lang, type TKey } from '../../i18n'
import { fmtDate } from '../../i18n/format'
import { cityLabel, leadFacts, missingFields } from '../../data/leads'
import type { Lead, LeadChannel, LeadField } from '../../data/types'

export const CHANNEL_ICON: Record<LeadChannel, LucideIcon> = {
  site: Globe, appel: PhoneIncoming, vocal: Voicemail, mail: Mail, whatsapp: MessageCircle, sms: MessageSquareText, plateforme: Handshake,
}
export const FieldIcon = CircleHelp

export interface Segment {
  text: string
  field?: LeadField | 'special'
}

const floorText = (n: number, l: Lang) => (n === 0 ? translate(l, 'clientMsg.ground') : translate(l, 'clientMsg.floor', { n }))

/** Le message d'origine du client, morceau par morceau. */
export function messageSegments(lead: Lead): Segment[] {
  const l = lead.lang
  const t = (k: TKey, v?: Record<string, string | number>) => translate(l, k, v)
  const f = lead.facts
  const s: Segment[] = [{ text: `${t(`clientMsg.greet.${lead.channel}`)} ${t('clientMsg.move')} ` }]
  if (f.fromCity) s.push({ text: cityLabel(f.fromCity, l), field: 'fromCity' })
  if (f.fromFloor !== undefined) s.push({ text: ' (' }, { text: floorText(f.fromFloor, l), field: 'fromFloor' })
  if (f.fromElevator !== undefined) s.push({ text: ', ' }, { text: t(f.fromElevator ? 'clientMsg.lift' : 'clientMsg.noLift'), field: 'fromElevator' })
  if (f.fromFloor !== undefined) s.push({ text: ')' })
  if (f.toCity) s.push({ text: ` ${t('clientMsg.to')} ` }, { text: cityLabel(f.toCity, l), field: 'toCity' })
  if (f.toFloor !== undefined) s.push({ text: ' (' }, { text: floorText(f.toFloor, l), field: 'toFloor' })
  if (f.toElevator !== undefined) s.push({ text: ', ' }, { text: t(f.toElevator ? 'clientMsg.lift' : 'clientMsg.noLift'), field: 'toElevator' })
  if (f.toFloor !== undefined) s.push({ text: ')' })
  const dateText = f.date ? t('clientMsg.date', { date: fmtDate(f.date, l, 'dayMonth') }) : ''
  if (f.date) s.push({ text: ', ' }, { text: dateText, field: 'date' })
  // Pas de double point quand la date finit déjà par « . » (« 19 nov. »)
  s.push({ text: dateText.endsWith('.') ? ' ' : '. ' })
  if (f.volume) s.push({ text: t('clientMsg.volume', { n: f.volume }), field: 'volume' }, { text: '. ' })
  if (f.special) s.push({ text: t(f.special === 'piano' ? 'clientMsg.piano' : 'clientMsg.coffre'), field: 'special' }, { text: ' ' })
  s.push({ text: `${t('clientMsg.ask')} ${lead.name}` })
  if (lead.channel === 'appel' || lead.channel === 'vocal') s.push({ text: t('clientMsg.close') })
  return s
}

/** La réponse de l'agent au client (questions sur ce qui manque, ou accusé de réception complet). */
export function agentReply(lead: Lead): string {
  const l = lead.lang
  const t = (k: TKey, v?: Record<string, string | number>) => translate(l, k, v)
  const f = leadFacts({ ...lead, added: {} })
  const missing = missingFields(f)
  const first = lead.name.split(' ')[0] ?? lead.name
  const head = f.fromCity && f.toCity ? t('agentMsg.thanks', { from: cityLabel(f.fromCity, l), to: cityLabel(f.toCity, l) }) : t('agentMsg.thanksShort')
  const body = missing.length
    ? [t('agentMsg.askIntro'), ...missing.map((m) => `• ${t(`agentMsg.q.${m}`)}`), '', t('agentMsg.photos')]
    : [t('agentMsg.complete'), t('agentMsg.photos')]
  return [`${t('agentMsg.hello', { name: first })} ${head}`, '', ...body, '', t('agentMsg.sign')].join('\n')
}

/** Valeur lisible d'un champ (dans la langue de l'écran). */
export function fieldValue(lead: Lead, field: LeadField | 'special', lang: Lang): string | undefined {
  const f = leadFacts(lead)
  const t = (k: TKey, v?: Record<string, string | number>) => translate(lang, k, v)
  switch (field) {
    case 'fromCity':
    case 'toCity':
      return f[field] ? cityLabel(f[field], lang) : undefined
    case 'fromFloor':
    case 'toFloor':
      return f[field] === undefined ? undefined : f[field] === 0 ? t('common.groundFloor') : t('common.floor', { n: f[field]! })
    case 'fromElevator':
    case 'toElevator':
      return f[field] === undefined ? undefined : t(f[field] ? 'fields.yes' : 'fields.no')
    case 'date':
      return f.date ? fmtDate(f.date, lang, 'medium') : undefined
    case 'volume':
      return f.volume ? t('common.volume', { n: f.volume }) : undefined
    case 'special':
      return f.special ? t(f.special === 'piano' ? 'items.piano' : 'terrain.items.coffre') : undefined
  }
}

/** « il y a 3 h » */
export function agoText(iso: string, lang: Lang, now = Date.now()): string {
  const min = Math.max(0, Math.round((now - new Date(iso).getTime()) / 60_000))
  if (min < 1) return translate(lang, 'inbox.now')
  if (min < 60) return translate(lang, 'inbox.agoMin', { n: min })
  if (min < 48 * 60) return translate(lang, 'inbox.agoH', { n: Math.round(min / 60) })
  return translate(lang, 'inbox.agoD', { n: Math.round(min / 1440) })
}
