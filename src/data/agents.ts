/*
 * Agents IA de la démo (simulés) et résumé du soir du gérant.
 * Chaque agent a un interrupteur qui change réellement le comportement de la démo.
 */
import { addDays } from './dates'
import { movesOn } from './selectors'
import { deriveAlerts, recentLowMargin } from './scenarios'
import type { DemoData, ISODate } from './types'

export const AGENT_IDS = ['accueil', 'volume', 'devis', 'relances', 'litiges', 'resume'] as const
export type AgentId = (typeof AGENT_IDS)[number]

export const ALL_AGENTS_ON: Record<AgentId, boolean> = { accueil: true, volume: true, devis: true, relances: true, litiges: true, resume: true }

/** Une ligne du résumé : un texte (clé + variables) et où elle mène. */
export interface SummaryItem {
  key: string
  vars?: Record<string, string | number>
  to: { view: 'gerant' | 'commercial' | 'planificateur'; screen?: string; param?: string }
  tone: 'success' | 'warning' | 'danger' | 'neutral'
}

const DONE = ['termine', 'facture', 'paye']

/** Résumé du soir : aujourd'hui, ce qui coince demain, marges faibles, demandes en attente. */
export function eveningSummary(data: DemoData, today: ISODate) {
  const tomorrow = addDays(today, 1)
  const todayMoves = movesOn(data, today)
  const done = todayMoves.filter((m) => DONE.includes(m.status) || data.days.some((d) => d.date === today && d.missions.some((x) => x.moveId === m.id && x.step >= 7)))
  // Demandes reçues depuis hier, devis des 7 derniers jours
  const yesterday = addDays(today, -1)
  const leadsToday = data.leads.filter((l) => l.receivedAt.slice(0, 10) >= yesterday)
  const weekAgo = addDays(today, -7)
  const sentToday = data.moves.filter((m) => m.quoteSentOn && m.quoteSentOn >= weekAgo).length
  const signedToday = data.moves.filter((m) => m.signedOn && m.signedOn >= weekAgo).length

  const tomorrowMoves = movesOn(data, tomorrow)
  const conflicts = deriveAlerts(data, today).filter((a) => a.kind === 'conflict' && a.conflict?.date === tomorrow).length
  const absent = data.absences.filter((a) => a.from <= tomorrow && a.to >= tomorrow).length

  const lowMargin = recentLowMargin(data, today).length

  const waitingClient = data.leads.filter((l) => l.status === 'attenteClient').length
  const callbacks = data.leads.filter((l) => l.status === 'rappel' || l.status === 'atypique').length
  const toValidate = data.leads.filter((l) => l.quote && !l.quote.sentAt).length

  const todayItems: SummaryItem[] = [
    { key: 'evening.todayMoves', vars: { n: todayMoves.length, done: done.length }, to: { view: 'gerant', screen: 'planning' }, tone: 'neutral' },
    {
      key: leadsToday.length > 0 && leadsToday.every((l) => l.status !== 'nouvelle') ? 'evening.todayLeads' : 'evening.todayLeadsPlain',
      vars: { n: leadsToday.length },
      to: { view: 'commercial', screen: 'demandes' },
      tone: leadsToday.some((l) => l.status === 'nouvelle') ? 'warning' : 'success',
    },
    { key: 'evening.todayQuotes', vars: { sent: sentToday, signed: signedToday }, to: { view: 'commercial', screen: 'devis' }, tone: 'neutral' },
  ]
  const tomorrowItems: SummaryItem[] = [
    { key: 'evening.tomorrowMoves', vars: { n: tomorrowMoves.length }, to: { view: 'planificateur' }, tone: 'neutral' },
    conflicts
      ? { key: 'evening.tomorrowConflicts', vars: { n: conflicts }, to: { view: 'planificateur' }, tone: 'danger' }
      : { key: 'evening.tomorrowOk', to: { view: 'planificateur' }, tone: 'success' },
    ...(absent ? [{ key: 'evening.tomorrowAbsent', vars: { n: absent }, to: { view: 'planificateur' as const, screen: 'absences' }, tone: 'warning' as const }] : []),
  ]
  const marginItems: SummaryItem[] = [
    lowMargin
      ? { key: 'evening.lowMargin', vars: { n: lowMargin, pct: data.settings.marginThresholdPct }, to: { view: 'gerant', screen: 'rentabilite' }, tone: 'warning' }
      : { key: 'evening.marginOk', to: { view: 'gerant', screen: 'rentabilite' }, tone: 'success' },
  ]
  const waitingItems: SummaryItem[] = [
    ...(toValidate ? [{ key: 'evening.toValidate', vars: { n: toValidate }, to: { view: 'commercial' as const, screen: 'devis' }, tone: 'warning' as const }] : []),
    ...(callbacks ? [{ key: 'evening.callbacks', vars: { n: callbacks }, to: { view: 'commercial' as const, screen: 'demandes' }, tone: 'warning' as const }] : []),
    { key: 'evening.waitingClient', vars: { n: waitingClient }, to: { view: 'commercial', screen: 'demandes' }, tone: 'neutral' },
  ]
  return [
    { title: 'evening.sectionToday', items: todayItems },
    { title: 'evening.sectionTomorrow', items: tomorrowItems },
    { title: 'evening.sectionMargin', items: marginItems },
    { title: 'evening.sectionWaiting', items: waitingItems },
  ]
}
