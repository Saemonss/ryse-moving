/*
 * Demandes entrantes et agent d'accueil (IA SIMULÉE : aucune API, des règles simples et des modèles de texte).
 * - Les messages des clients sont écrits à partir des faits (villes, étages, date…) dans la langue du client :
 *   ce que l'agent « surligne » correspond donc toujours au message.
 * - Les notes du gérant (appel, SMS collé) sont lues par un petit analyseur : villes connues, étages, ascenseur,
 *   date, volume, piano / coffre-fort.
 * - Règle d'or : l'agent prépare, l'humain valide ce qui engage l'entreprise.
 */
import { CITIES } from './lists'
import { addDays, fromISO } from './dates'
import { distanceKm, plannedHoursFor } from './geo'
import type { Customer, DemoData, ISODate, Lead, LeadChannel, LeadFacts, LeadField, Move, MoveType, Site } from './types'

export const LEAD_CHANNELS: LeadChannel[] = ['site', 'appel', 'vocal', 'mail', 'whatsapp', 'sms', 'plateforme']
const REQUIRED: LeadField[] = ['fromCity', 'fromFloor', 'toCity', 'toFloor', 'date']

/** Ce que l'on sait de la demande (message d'origine + compléments). */
export const leadFacts = (lead: Lead): LeadFacts => ({ ...lead.facts, ...lead.added })

/** Ce qui manque encore pour préparer un devis (l'ascenseur n'est utile qu'en étage). */
export function missingFields(f: LeadFacts): LeadField[] {
  const out = REQUIRED.filter((k) => f[k] === undefined)
  if (f.fromFloor && f.fromFloor > 0 && f.fromElevator === undefined) out.push('fromElevator')
  if (f.toFloor && f.toFloor > 0 && f.toElevator === undefined) out.push('toElevator')
  return out
}

export const cityLabel = (id: string | undefined, lang: 'fr' | 'nl') => CITIES.find((c) => c.id === id)?.[lang] ?? id ?? ''

// ─── Lecture des notes du gérant (SMS collé, notes d'appel) ───────────────────────────────────

const norm = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
const MONTHS: Record<string, number> = {
  janvier: 1, fevrier: 2, mars: 3, avril: 4, mai: 5, juin: 6, juillet: 7, aout: 8, septembre: 9, octobre: 10, novembre: 11, decembre: 12,
  januari: 1, februari: 2, maart: 3, april: 4, juni: 6, juli: 7, augustus: 8, oktober: 10, december: 12,
}

/** Extrait les faits d'un texte libre (FR ou NL). Ce qui n'est pas trouvé reste inconnu : l'agent ne devine pas. */
export function parseNotes(text: string, today: ISODate): LeadFacts {
  const t = norm(text)
  const f: LeadFacts = {}
  // Villes, dans l'ordre où elles apparaissent : la première = départ, la deuxième = arrivée
  const found = CITIES.flatMap((c) =>
    [c.fr, c.nl].map((n) => ({ id: c.id, at: t.indexOf(norm(n)) })),
  ).filter((x) => x.at >= 0)
  const cities = [...new Map(found.sort((a, b) => a.at - b.at).map((x) => [x.id, x])).values()]
  if (cities[0]) f.fromCity = cities[0].id
  if (cities[1]) f.toCity = cities[1].id
  // Étages
  const floors = [...t.matchAll(/(rez-de-chaussee|gelijkvloers|(\d{1,2})\s*(?:e|eme|er|re|de|ste)?\s*(?:etage|verdieping))/g)].map((m) => (m[2] ? Number(m[2]) : 0))
  if (floors[0] !== undefined) f.fromFloor = floors[0]
  // « une maison » au départ, sans étage précisé : rez-de-chaussée
  else if (/(maison|huis|woning)/.test(t)) f.fromFloor = 0
  if (floors[1] !== undefined) f.toFloor = floors[1]
  // Ascenseur
  const lifts = [...t.matchAll(/(sans ascenseur|pas d'ascenseur|geen lift|zonder lift|avec ascenseur|ascenseur|met lift|lift)/g)].map((m) => !/sans|pas d|geen|zonder/.test(m[1]!))
  if (lifts[0] !== undefined && f.fromFloor !== undefined) f.fromElevator = lifts[0]
  if (lifts[1] !== undefined && f.toFloor !== undefined) f.toElevator = lifts[1]
  // Date : « 12/03 », ou « fin mars » / « début avril » / « mi-mai »
  const d = /(\d{1,2})\s*[/.-]\s*(\d{1,2})/.exec(t)
  const year = fromISO(today).getFullYear()
  const pick = (m: number, day: number) => {
    const iso = `${year}-${String(m).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    return iso < today ? `${year + 1}${iso.slice(4)}` : iso
  }
  if (d) f.date = pick(Number(d[2]), Number(d[1]))
  else {
    const mm = Object.keys(MONTHS).find((m) => new RegExp(`\\b${m}\\b`).test(t))
    if (mm) f.date = pick(MONTHS[mm]!, /fin|eind/.test(t) ? 28 : /debut|begin/.test(t) ? 3 : 15)
  }
  // Volume
  const v = /(\d{1,3})\s*(?:m3|m³|metres? cubes?|kubieke)/.exec(t)
  if (v) f.volume = Number(v[1])
  if (/coffre|kluis/.test(t)) f.special = 'coffre'
  else if (/piano/.test(t)) f.special = 'piano'
  return f
}

// ─── Jeu de départ ────────────────────────────────────────────────────────────────────────────

const iso = (date: ISODate, hhmm: string) => `${date}T${hhmm}`
const factsOf = (m: Move): LeadFacts => ({
  fromCity: m.from.cityId, fromFloor: m.from.floor, fromElevator: m.from.floor > 0 ? m.from.elevator : undefined,
  toCity: m.to?.cityId, toFloor: m.to?.floor, toElevator: m.to && m.to.floor > 0 ? m.to.elevator : undefined,
  date: m.date, volume: m.volumeM3,
})

/**
 * 10 demandes de départ, sur tous les canaux. La plupart ont déjà été traitées par l'agent ; une est en attente du
 * client ; une est atypique (coffre-fort) et volontairement laissée à l'humain (seule demande « sans réponse > 24 h »).
 */
export function seedLeads(moves: Move[], customers: Customer[], today: ISODate): Lead[] {
  const plan: [string, LeadChannel, 'fr' | 'nl', string][] = [
    ['m-23', 'site', 'fr', '09:12'], ['m-24', 'mail', 'fr', '10:41'], ['m-25', 'plateforme', 'fr', '08:05'],
    ['m-26', 'mail', 'nl', '14:22'], ['m-27', 'whatsapp', 'fr', '19:03'], ['m-28', 'appel', 'fr', '11:30'],
    ['m-29', 'vocal', 'fr', '18:47'], ['m-30', 'site', 'nl', '07:55'], ['m-31', 'sms', 'fr', '12:16'],
  ]
  const leads: Lead[] = plan.flatMap(([moveId, channel, lang, hhmm], i) => {
    const m = moves.find((x) => x.id === moveId)
    const c = customers.find((x) => x.id === m?.customerId)
    if (!m || !c) return []
    const facts = factsOf(m)
    // m-30 : demande d'hier, il manque l'étage d'arrivée → l'agent a posé la question, en attente du client
    const waiting = moveId === 'm-30'
    if (waiting) delete facts.toFloor
    // Une demande « du jour » est datée de la veille : elle est toujours dans le passé, quelle que soit l'heure
    const day = m.requestedOn >= today ? addDays(today, -1) : m.requestedOn
    const received = iso(day, hhmm)
    return [{
      id: `lead-${i + 1}`, channel, lang, name: c.name, phone: c.phone, receivedAt: received, origin: 'client',
      facts, added: {}, status: waiting ? 'attenteClient' : 'complete', moveId,
      replyAt: iso(day, hhmm.slice(0, 3) + String(Math.min(59, Number(hhmm.slice(3)) + 2)).padStart(2, '0')),
      clientReplyAt: waiting ? undefined : iso(day, '21:00'),
    } satisfies Lead]
  })
  leads.push({
    id: 'lead-10', channel: 'appel', lang: 'fr', name: 'Bernard Delvaux', phone: '+32475318842', origin: 'client',
    receivedAt: iso(addDays(today, -2), '08:31'),
    facts: { fromCity: 'uccle', fromFloor: 3, fromElevator: false, toCity: 'waterloo', toFloor: 0, date: addDays(today, 20), special: 'coffre' },
    added: {}, status: 'atypique',
  })
  return leads.sort((a, b) => b.receivedAt.localeCompare(a.receivedAt))
}

// ─── Simulation de nouvelles demandes (menu présentateur) ─────────────────────────────────────

const SIM_NAMES = { fr: ['Isabelle Martin', 'Julien Lefèvre', 'Aurélie Dubois', 'Thierry Masson'], nl: ['Pieter Janssens', 'Els Peeters', 'Koen De Smet', 'Sofie Wouters'] }
const SIM_ROUTES: [string, string, number, boolean][] = [
  ['leuven', 'bruxelles', 3, true], ['namur', 'wavre', 2, false], ['ixelles', 'uccle', 4, false], ['mechelen', 'leuven', 1, false],
]

/** Une nouvelle demande réaliste, volontairement incomplète (étage d'arrivée et volume inconnus). */
export function simulateLead(channel: LeadChannel, lang: 'fr' | 'nl', n: number, today: ISODate): Lead {
  const [from, to, floor, lift] = SIM_ROUTES[n % SIM_ROUTES.length]!
  return {
    id: `lead-sim-${n}-${Date.now()}`, channel, lang, name: SIM_NAMES[lang][n % 4]!, phone: lang === 'nl' ? '+32476120' + String(345 + n) : '+32478220' + String(611 + n),
    receivedAt: new Date().toISOString(), origin: 'client',
    facts: { fromCity: from, fromFloor: floor, fromElevator: lift, toCity: to, date: addDays(today, 25 + n * 3) },
    added: {}, status: 'nouvelle',
  }
}

/** Réponse simulée du client : il donne ce qui manquait (l'arrivée est au 2e sans ascenseur). */
export function clientAnswers(lead: Lead): LeadFacts {
  const f = leadFacts(lead)
  const a: LeadFacts = {}
  if (f.fromCity === undefined) a.fromCity = 'bruxelles'
  if (f.toCity === undefined) a.toCity = 'wavre'
  if (f.fromFloor === undefined) a.fromFloor = 1
  if (f.toFloor === undefined) a.toFloor = 2
  if ((f.fromFloor ?? a.fromFloor ?? 0) > 0 && f.fromElevator === undefined) a.fromElevator = false
  if ((f.toFloor ?? a.toFloor ?? 0) > 0 && f.toElevator === undefined) a.toElevator = false
  return a
}

// ─── Dossier créé par l'agent ─────────────────────────────────────────────────────────────────

const site = (cityId: string, floor: number, elevator: boolean, n: number): Site => {
  const c = CITIES.find((x) => x.id === cityId) ?? CITIES[0]!
  const streets = c.streets === 'nl' ? ['Lindenstraat', 'Kerkstraat', 'Molenstraat'] : ['Rue des Tilleuls', 'Rue du Moulin', 'Avenue des Lilas']
  return { street: streets[n % 3]!, number: String(12 + n * 7), postcode: c.postcode, cityId: c.id, country: c.country, floor, elevator, access: 'facile', parking: 'autorisation' }
}

/** Crée (ou met à jour) le client et le dossier « demande » à partir de ce que l'agent sait. */
export function upsertMoveFromLead(data: DemoData, lead: Lead, today: ISODate): { data: DemoData; moveId: string } {
  const f = leadFacts(lead)
  const n = data.moves.length + 1
  const type: MoveType = (f.fromFloor ?? 0) > 0 ? 'appartement' : 'maison'
  const from = site(f.fromCity ?? 'bruxelles', f.fromFloor ?? 0, f.fromElevator ?? false, n)
  const to = site(f.toCity ?? f.fromCity ?? 'bruxelles', f.toFloor ?? 0, f.toElevator ?? false, n + 1)
  const km = distanceKm('nivelles', from.cityId, to.cityId)
  const volume = f.volume ?? 25
  const patch = (m: Move): Move => ({ ...m, from, to, date: f.date ?? m.date, volumeM3: volume, distanceKm: km, plannedHours: plannedHoursFor(volume, km) })
  if (lead.moveId && data.moves.some((m) => m.id === lead.moveId))
    return { data: { ...data, moves: data.moves.map((m) => (m.id === lead.moveId ? patch(m) : m)) }, moveId: lead.moveId }

  const customerId = `c-lead-${lead.id}`
  const customer: Customer = { id: customerId, kind: 'particulier', name: lead.name, gender: 'f', phone: lead.phone, email: `${norm(lead.name).replace(/[^a-z]+/g, '.')}@exemple.test` }
  const year = String(fromISO(today).getFullYear()).slice(2)
  const moveId = `m-lead-${n}`
  const move: Move = patch({
    id: moveId, ref: `RM-${year}-${400 + n}`, customerId, type, status: 'demande', date: f.date ?? addDays(today, 30), startTime: '08:00',
    from, to, volumeM3: volume, options: [], priceCents: 0, depositCents: 0, teamIds: [], vehicleIds: [],
    plannedHours: 0, distanceKm: 0, requestedOn: today,
  })
  return { data: { ...data, customers: [...data.customers, customer], moves: [...data.moves, move] }, moveId }
}

/** Minutes entre la réception et la réponse (affiché « répondu en 2 min »). */
export const replyMinutes = (lead: Lead) =>
  lead.replyAt ? Math.max(1, Math.round((new Date(lead.replyAt).getTime() - new Date(lead.receivedAt).getTime()) / 60_000)) : null
