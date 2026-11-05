/*
 * Relances de devis et litiges préparés par l'agent (simulé). L'agent rédige ; l'humain valide l'envoi.
 * L'agent ne propose JAMAIS de remise : c'est une décision commerciale.
 */
import { translate, type Lang } from '../i18n'
import { fmtDate, fmtMoney } from '../i18n/format'
import { CITIES } from './lists'
import { addDays, diffDays } from './dates'
import type { Claim, DemoData, ISODate, LeadChannel, Move } from './types'

/** Délai conseillé avant la première relance d'un devis (jours). */
export const FOLLOW_UP_AFTER = 3
/** Au-delà, la relance prend le ton d'un dernier rappel (jours). */
export const LAST_CALL_AFTER = 10

/** Langue du client : celle de sa demande, sinon celle de sa ville. */
export function customerLang(data: DemoData, move: Move): Lang {
  const lead = data.leads.find((l) => l.moveId === move.id)
  if (lead) return lead.lang
  return CITIES.find((c) => c.id === move.from.cityId)?.streets === 'nl' ? 'nl' : 'fr'
}

/** Canal de réponse : celui du client quand c'est possible (un appel ou un vocal → SMS ; site → e-mail). */
export function replyChannel(data: DemoData, move: Move): LeadChannel {
  const ch = data.leads.find((l) => l.moveId === move.id)?.channel
  if (!ch) return 'mail'
  if (ch === 'appel' || ch === 'vocal') return 'sms'
  if (ch === 'site' || ch === 'plateforme') return 'mail'
  return ch
}

export interface FollowUp {
  move: Move
  days: number
  advisedOn: ISODate
  due: boolean
}

/** Devis envoyés sans réponse : à relancer d'abord, puis les plus anciens. */
export function followUps(data: DemoData, today: ISODate): FollowUp[] {
  return data.moves
    .filter((m) => m.status === 'devisEnvoye' && m.quoteSentOn)
    .map((move) => {
      const days = Math.max(0, diffDays(today, move.quoteSentOn!))
      return { move, days, advisedOn: addDays(move.quoteSentOn!, FOLLOW_UP_AFTER), due: days >= FOLLOW_UP_AFTER }
    })
    .sort((a, b) => Number(!!a.move.quoteReminderOn) - Number(!!b.move.quoteReminderOn) || Number(b.due) - Number(a.due) || b.days - a.days)
}

/** Relance rédigée par l'agent, dans la langue du client, ton adapté à l'ancienneté du devis. */
export function reminderText(data: DemoData, move: Move, days: number, sender: string) {
  const l = customerLang(data, move)
  const c = data.customers.find((x) => x.id === move.customerId)
  const first = c?.kind === 'entreprise' ? (c.contact ?? c.name) : (c?.name.split(' ')[0] ?? '')
  const city = (id: string) => {
    const ci = CITIES.find((x) => x.id === id)
    return ci ? ci[l] : ''
  }
  const route = move.to ? `${city(move.from.cityId)} → ${city(move.to.cityId)}` : city(move.from.cityId)
  return translate(l, days >= LAST_CALL_AFTER ? 'followup.draftLast' : 'followup.draft', {
    name: first,
    ref: move.ref,
    date: fmtDate(move.date, l, 'long'),
    route,
    amount: fmtMoney(move.priceCents, l),
    sender,
  })
}

/** Dossier litige rassemblé par l'agent : faits, pièces, proposition de réponse, brouillon assurance. */
export function claimBrief(data: DemoData, claim: Claim, managerLang: Lang, sender: string) {
  const move = data.moves.find((m) => m.id === claim.moveId)
  const day = data.days.find((d) => d.id === claim.dayId)
  const mission = day?.missions.find((m) => m.moveId === claim.moveId)
  const customer = move ? data.customers.find((c) => c.id === move.customerId) : undefined
  const l = move ? customerLang(data, move) : managerLang
  const tm = (k: Parameters<typeof translate>[1], v?: Record<string, string | number>) => translate(managerLang, k, v)
  const tc = (k: Parameters<typeof translate>[1], v?: Record<string, string | number>) => translate(l, k, v)
  const d = claim.damage
  const item = (lang: Lang) => translate(lang, `terrain.items.${d.item}`)
  const type = (lang: Lang) => translate(lang, `terrain.damageTypes.${d.type}`).toLowerCase()
  const first = customer?.kind === 'entreprise' ? (customer.contact ?? customer.name) : (customer?.name.split(' ')[0] ?? '')
  const date = move ? fmtDate(move.date, managerLang, 'long') : ''
  const facts = [
    tm('claimAi.factWhat', { item: item(managerLang), type: type(managerLang), severity: translate(managerLang, `terrain.severity.${d.severity}`).toLowerCase() }),
    tm('claimAi.factWhen', { date, ref: move?.ref ?? '' }),
    tm('claimAi.factBefore', { n: mission?.startPhotos.length ?? 0 }),
    tm('claimAi.factAfter'),
    mission?.signature ? tm('claimAi.factSigned', { name: mission.signature.name }) : tm('claimAi.factNoSign'),
  ]
  return {
    lang: l,
    facts,
    reply: tc('claimAi.reply', { name: first, item: item(l).toLowerCase(), type: type(l), date: move ? fmtDate(move.date, l, 'long') : '', sender }),
    insurance: tm('claimAi.insurance', {
      ref: move?.ref ?? '',
      client: customer?.name ?? '',
      date,
      item: item(managerLang),
      type: type(managerLang),
      severity: translate(managerLang, `terrain.severity.${d.severity}`).toLowerCase(),
      photos: (mission?.startPhotos.length ?? 0) + 1,
      signed: mission?.signature ? tm('claimAi.yes') : tm('claimAi.no'),
    }),
  }
}
