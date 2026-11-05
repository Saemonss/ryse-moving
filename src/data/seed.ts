/*
 * Jeu de données de départ, fabriqué à partir de la date du jour.
 * - Personnel, flotte et entreprise : écrits ici (courts, faciles à modifier).
 * - Dossiers : une ligne par dossier dans PLAN (statut, type, jour relatif à aujourd'hui, villes, volume…).
 *   Noms, rues, étages, prix et dates intermédiaires sont générés de façon reproductible.
 * Les 5 situations de démo sont marquées dans PLAN par « special ».
 */
import { ALL_AGENTS_ON } from './agents'
import { CITIES, COMPANY_NAMES, FIRST_NAMES, LAST_NAMES, STREETS } from './lists'
import { createRandom, type Random } from './random'
import { addDays, fromISO } from './dates'
import { distanceKm, plannedHoursFor } from './geo'
import { DEMO_SIGNATURE, dayId } from './field'
import { seedLeads } from './leads'
import { DEFAULT_PRICING } from './quote'
import type {
  Absence, Company, Customer, DemoData, DriverDay, Gender, ISODate, Move, MoveOption, MoveStatus, MoveType, Settings, Site, Staff, Team, Vehicle,
} from './types'

const SEED = 20261104
/** Cliente fictive affichée dans la vue Client. */
export const CLIENT_CUSTOMER_ID = 'c-client'

export const COMPANY: Company = {
  name: 'RySe Moving',
  email: 'contact@ryse-moving.example',
  agencies: [
    { id: 'a-nivelles', kind: 'siege', address: { street: "Rue de l'Industrie", number: '24', postcode: '1400', cityId: 'nivelles', country: 'BE' } },
    { id: 'a-lille', kind: 'agence', address: { street: 'Rue des Entrepôts', number: '8', postcode: '59000', cityId: 'lille', country: 'FR' } },
  ],
}

type S = [id: string, first: string, last: string, gender: Gender, role: Staff['role'], skills: Staff['skills'], agency?: string]
const STAFF: S[] = [
  ['s-nathalie', 'Nathalie', 'Verhaegen', 'f', 'gerant', []],
  ['s-thomas', 'Thomas', 'Lemaire', 'm', 'planificateur', []],
  ['s-julie', 'Julie', 'Desmet', 'f', 'commercial', []],
  ['s-marc', 'Marc', 'Janssens', 'm', 'comptable', []],
  ['s-didier', 'Didier', 'Wauters', 'm', 'chefEquipe', ['permisC', 'monteMeubles', 'international']],
  ['s-karim', 'Karim', 'Benali', 'm', 'chauffeur', ['permisC', 'international']],
  ['s-youssef', 'Youssef', 'El Amrani', 'm', 'chauffeur', ['permisC']],
  ['s-pieter', 'Pieter', 'Claes', 'm', 'chauffeur', ['permisC', 'monteMeubles']],
  ['s-kevin', 'Kevin', 'Dupont', 'm', 'demenageur', ['emballage']],
  ['s-luca', 'Luca', 'Rossi', 'm', 'demenageur', ['monteMeubles']],
  ['s-bram', 'Bram', 'Vermeulen', 'm', 'demenageur', ['emballage']],
  ['s-mehdi', 'Mehdi', 'Haddad', 'm', 'demenageur', []],
  ['s-jerome', 'Jérôme', 'Leclercq', 'm', 'chefEquipe', ['permisC', 'international'], 'a-lille'],
  ['s-antoine', 'Antoine', 'Moreau', 'm', 'demenageur', ['emballage'], 'a-lille'],
]

/** Équipes types et leur camion habituel. */
export const TEAMS: Team[] = [
  { id: 't-a', leaderId: 's-didier', memberIds: ['s-didier', 's-kevin', 's-bram'], defaultVehicleId: 'v-2', agencyId: 'a-nivelles' },
  { id: 't-b', leaderId: 's-karim', memberIds: ['s-karim', 's-pieter', 's-luca'], defaultVehicleId: 'v-1', agencyId: 'a-nivelles' },
  { id: 't-c', leaderId: 's-youssef', memberIds: ['s-youssef', 's-mehdi'], defaultVehicleId: 'v-3', agencyId: 'a-nivelles' },
  { id: 't-l', leaderId: 's-jerome', memberIds: ['s-jerome', 's-antoine'], defaultVehicleId: 'v-8', agencyId: 'a-lille' },
]
const CREWS = { A: 't-a', B: 't-b', C: 't-c', L: 't-l' } as const
type Crew = keyof typeof CREWS

/** Paramètres de départ du calcul de marge (valeurs réalistes pour la Belgique, modifiables dans Paramètres). */
export const DEFAULT_SETTINGS: Settings = {
  pricing: DEFAULT_PRICING,
  agents: ALL_AGENTS_ON,
  hourlyCostCents: 3200,
  kmCostCents: { camion20: 38, camion40: 52, porteurHayon: 45, utilitaire: 25, monteMeubles: 30 },
  fuelCentsPerLitre: 175,
  marginThresholdPct: 25,
}

type Special = 'late' | 'conflictA' | 'conflictB' | 'quote6' | 'karim' | 'client' | 'started' | 'lowDistance' | 'overHours' | 'liftUnbilled'
interface PlanRow {
  status: MoveStatus
  type: MoveType
  day: number
  from: string
  to?: string
  vol: number
  crew?: Crew
  opts?: MoveOption[]
  special?: Special
  time?: string
}

// Jour 0 = aujourd'hui. Négatif = passé, positif = futur.
const PLAN: PlanRow[] = [
  { status: 'paye', type: 'appartement', day: -24, from: 'ixelles', to: 'uccle', vol: 24, crew: 'A' },
  { status: 'facture', type: 'maison', day: -38, from: 'wavre', to: 'namur', vol: 48, crew: 'B', special: 'late' },
  { status: 'paye', type: 'bureaux', day: -20, from: 'bruxelles', to: 'schaerbeek', vol: 36, crew: 'A', opts: ['emballage'] },
  { status: 'paye', type: 'international', day: -15, from: 'uccle', to: 'paris11', vol: 42, crew: 'B', special: 'lowDistance' },
  { status: 'paye', type: 'appartement', day: -12, from: 'liege', to: 'liege', vol: 30, crew: 'C' },
  { status: 'facture', type: 'maison', day: -9, from: 'namur', to: 'wavre', vol: 52, crew: 'A', opts: ['emballage'] },
  { status: 'facture', type: 'appartement', day: -8, from: 'lille', to: 'roubaix', vol: 26, crew: 'L' },
  { status: 'termine', type: 'debarras', day: -6, from: 'schaerbeek', vol: 18, crew: 'C' },
  { status: 'termine', type: 'maison', day: -5, from: 'nivelles', to: 'bruxelles', vol: 50, crew: 'A' },
  { status: 'termine', type: 'appartement', day: -4, from: 'mechelen', to: 'leuven', vol: 32, crew: 'B', special: 'liftUnbilled' },
  { status: 'termine', type: 'gardeMeuble', day: -3, from: 'ixelles', vol: 20, crew: 'C', opts: ['gardeMeuble'] },
  { status: 'facture', type: 'international', day: -2, from: 'lille', to: 'liege', vol: 38, crew: 'L' },
  { status: 'termine', type: 'bureaux', day: -1, from: 'bruxelles', to: 'bruxelles', vol: 40, crew: 'B', opts: ['emballage'], special: 'overHours' },
  { status: 'enCours', type: 'appartement', day: 0, from: 'ixelles', to: 'schaerbeek', vol: 28, crew: 'A', special: 'started', time: '07:00' },
  { status: 'planifie', type: 'maison', day: 0, from: 'waterloo', to: 'nivelles', vol: 38, crew: 'B', special: 'karim', time: '07:30' },
  { status: 'planifie', type: 'appartement', day: 0, from: 'lille', to: 'lille', vol: 18, crew: 'L', time: '08:30' },
  { status: 'planifie', type: 'appartement', day: 1, from: 'uccle', to: 'waterloo', vol: 30, crew: 'A' },
  { status: 'planifie', type: 'maison', day: 2, from: 'namur', to: 'bruxelles', vol: 40, crew: 'B', special: 'conflictA' },
  { status: 'planifie', type: 'bureaux', day: 2, from: 'bruxelles', to: 'ixelles', vol: 34, crew: 'A', special: 'conflictB', time: '08:00' },
  { status: 'planifie', type: 'international', day: 3, from: 'bruxelles', to: 'paris15', vol: 40, crew: 'B' },
  { status: 'planifie', type: 'appartement', day: 4, from: 'wavre', to: 'wavre', vol: 24, crew: 'A', opts: ['monteMeubles'] },
  { status: 'planifie', type: 'appartement', day: 6, from: 'bruxelles', to: 'wavre', vol: 34, crew: 'A' },
  { status: 'devisSigne', type: 'maison', day: 7, from: 'wavre', to: 'namur', vol: 58, special: 'client', opts: ['emballage'] },
  { status: 'devisSigne', type: 'gardeMeuble', day: 8, from: 'uccle', vol: 16, opts: ['gardeMeuble'] },
  { status: 'devisSigne', type: 'international', day: 9, from: 'paris11', to: 'bruxelles', vol: 44 },
  { status: 'devisEnvoye', type: 'maison', day: 14, from: 'leuven', to: 'mechelen', vol: 55, special: 'quote6' },
  { status: 'devisEnvoye', type: 'appartement', day: 18, from: 'roubaix', to: 'lille', vol: 27 },
  { status: 'visite', type: 'bureaux', day: 25, from: 'schaerbeek', to: 'bruxelles', vol: 60 },
  { status: 'visite', type: 'maison', day: 21, from: 'waterloo', to: 'uccle', vol: 50 },
  { status: 'demande', type: 'appartement', day: 30, from: 'ixelles', to: 'leuven', vol: 25 },
  { status: 'demande', type: 'debarras', day: 12, from: 'namur', vol: 15 },
]

const PRICING: Record<MoveType, [perM3: number, base: number]> = {
  appartement: [3800, 35000],
  maison: [3600, 45000],
  bureaux: [4200, 60000],
  international: [7000, 120000],
  gardeMeuble: [2500, 20000],
  debarras: [3000, 15000],
}

const SIGNED_OR_LATER: MoveStatus[] = ['devisSigne', 'planifie', 'enCours', 'termine', 'facture', 'paye']
const TIMES = ['07:30', '08:00', '08:00', '08:30', '13:00']

function makeSite(rnd: Random, cityId: string, type: MoveType, forced?: Partial<Site>): Site {
  const city = CITIES.find((c) => c.id === cityId) ?? CITIES[0]!
  const floor = type === 'maison' ? 0 : type === 'bureaux' ? rnd.int(1, 4) : rnd.int(0, 5)
  return {
    street: rnd.pick(STREETS[city.streets]),
    number: String(rnd.int(2, 160)),
    postcode: city.postcode,
    cityId: city.id,
    country: city.country,
    floor,
    elevator: type === 'bureaux' || (floor >= 3 ? rnd.next() < 0.7 : floor > 0 && rnd.next() < 0.3),
    access: rnd.pick(['facile', 'facile', 'rueEtroite', 'escalierEtroit', 'cour'] as const),
    parking: rnd.pick(['libre', 'autorisation', 'autorisation', 'difficile'] as const),
    ...forced,
  }
}

function phone(rnd: Random, country: 'BE' | 'FR') {
  return country === 'BE' ? `+3247${rnd.int(0, 9)}${rnd.int(100000, 999999)}` : `+336${rnd.int(10000000, 99999999)}`
}

/**
 * N-ième jour ouvré avant/après aujourd'hui (les dimanches sont sautés).
 * Deux décalages différents donnent toujours deux dates différentes : aucune collision, quel que soit le jour.
 */
function workingDay(today: ISODate, offset: number): ISODate {
  let d = today
  const step = offset < 0 ? -1 : 1
  for (let left = Math.abs(offset); left > 0; ) {
    d = addDays(d, step)
    if (fromISO(d).getDay() !== 0) left--
  }
  return d
}

export function createSeed(today: ISODate): DemoData {
  const rnd = createRandom(SEED)
  const staff: Staff[] = STAFF.map(([id, firstName, lastName, gender, role, skills, agency]) => ({
    id, firstName, lastName, gender, role, skills, agencyId: agency ?? 'a-nivelles', phone: phone(rnd, agency ? 'FR' : 'BE'),
  }))

  const absences: Absence[] = [
    { id: 'ab-1', staffId: 's-mehdi', kind: 'maladie', from: addDays(today, -2), to: addDays(today, 0) },
    { id: 'ab-2', staffId: 's-bram', kind: 'conge', from: addDays(today, 8), to: addDays(today, 12) },
    { id: 'ab-3', staffId: 's-luca', kind: 'formation', from: addDays(today, 5), to: addDays(today, 5) },
  ]

  const vehicles: Vehicle[] = [
    { id: 'v-1', kind: 'camion40', plate: '1-RMV-401', country: 'BE', volumeM3: 40, agencyId: 'a-nivelles', nextService: addDays(today, 34), nextInspection: addDays(today, 142) },
    { id: 'v-2', kind: 'camion40', plate: '1-RMV-402', country: 'BE', volumeM3: 40, agencyId: 'a-nivelles', nextService: addDays(today, 61), nextInspection: addDays(today, 97) },
    { id: 'v-3', kind: 'camion20', plate: '1-RMV-203', country: 'BE', volumeM3: 20, agencyId: 'a-nivelles', nextService: addDays(today, 18), nextInspection: addDays(today, 188) },
    { id: 'v-4', kind: 'camion20', plate: '1-RMV-204', country: 'BE', volumeM3: 20, agencyId: 'a-nivelles', nextService: addDays(today, 75), nextInspection: addDays(today, 64) },
    { id: 'v-5', kind: 'porteurHayon', plate: '1-RMV-305', country: 'BE', volumeM3: 30, agencyId: 'a-nivelles', nextService: addDays(today, 42), nextInspection: addDays(today, 9) },
    { id: 'v-6', kind: 'utilitaire', plate: '1-RMV-506', country: 'BE', volumeM3: 12, agencyId: 'a-nivelles', nextService: addDays(today, 22), nextInspection: addDays(today, 211) },
    { id: 'v-7', kind: 'monteMeubles', plate: '1-RMV-907', country: 'BE', volumeM3: 0, agencyId: 'a-nivelles', nextService: addDays(today, 15), nextInspection: addDays(today, 120) },
    { id: 'v-8', kind: 'camion20', plate: 'GH-482-RM', country: 'FR', volumeM3: 20, agencyId: 'a-lille', nextService: addDays(today, 50), nextInspection: addDays(today, 156) },
  ]

  const customers: Customer[] = []
  const moves: Move[] = []
  const year = fromISO(today).getFullYear()

  PLAN.forEach((row, i) => {
    const id = `m-${String(i + 1).padStart(2, '0')}`
    const date = workingDay(today, row.day)
    const fromCity = CITIES.find((c) => c.id === row.from)!

    // Client
    const gender: Gender = rnd.next() < 0.5 ? 'f' : 'm'
    const isCompany = row.type === 'bureaux'
    let name = isCompany ? COMPANY_NAMES[i % COMPANY_NAMES.length]! : `${rnd.pick(FIRST_NAMES[gender])} ${rnd.pick(LAST_NAMES)}`
    let custGender = gender
    if (row.special === 'client') {
      name = 'Claire Vandamme'
      custGender = 'f'
    }
    const contact = isCompany ? `${rnd.pick(FIRST_NAMES[gender])} ${rnd.pick(LAST_NAMES)}` : undefined
    const slug = name.toLowerCase().normalize('NFD').replace(/[^a-z ]/g, '').trim().replace(/\s+/g, '.')
    const customerId = row.special === 'client' ? CLIENT_CUSTOMER_ID : `c-${i + 1}`
    customers.push({
      id: customerId, kind: isCompany ? 'entreprise' : 'particulier', name, contact, gender: custGender,
      phone: phone(rnd, fromCity.country), email: `${slug}@exemple.test`,
    })

    // Adresses
    const from = makeSite(rnd, row.from, row.type, row.special === 'karim' ? { floor: 2, elevator: false } : undefined)
    const to = row.to ? makeSite(rnd, row.to, row.type) : undefined

    // Prix, coût, acompte
    const [perM3, base] = PRICING[row.type]
    const opts = row.opts ?? []
    let price = base + row.vol * perM3
    if (from.floor >= 2 && !from.elevator) price *= 1.08
    if (opts.includes('emballage')) price *= 1.12
    if (opts.includes('monteMeubles')) price += 29000
    if (row.special === 'lowDistance') price *= 0.7 // prix consenti trop bas pour la distance
    const priceCents = Math.round(price / 1000) * 1000
    const signed = SIGNED_OR_LATER.includes(row.status)

    // Étapes du dossier, toujours cohérentes avec aujourd'hui
    const anchor = row.day < 0 ? date : today
    let requestedOn = addDays(anchor, -rnd.int(20, 30))
    let visitOn: ISODate | undefined = addDays(requestedOn, 3)
    let quoteSentOn: ISODate | undefined = addDays(requestedOn, 5)
    let signedOn: ISODate | undefined = signed ? addDays(requestedOn, 9) : undefined
    if (row.status === 'demande') {
      requestedOn = addDays(today, -(i % 2))
      visitOn = quoteSentOn = undefined
    } else if (row.status === 'visite') {
      requestedOn = addDays(today, -3)
      visitOn = addDays(today, i % 2 ? 1 : 2)
      quoteSentOn = undefined
    } else if (row.status === 'devisEnvoye') {
      const sent = row.special === 'quote6' ? 6 : 2
      quoteSentOn = addDays(today, -sent)
      visitOn = addDays(quoteSentOn, -2)
      requestedOn = addDays(quoteSentOn, -5)
    }

    const crew = row.crew ? TEAMS.find((t) => t.id === CREWS[row.crew!]) : undefined
    const vehicleIds: string[] = crew ? [row.special === 'conflictB' ? 'v-1' : crew.defaultVehicleId] : []
    const liftUsed = opts.includes('monteMeubles') || row.special === 'liftUnbilled'
    if (liftUsed && crew) vehicleIds.push('v-7')
    const agencyId = crew?.agencyId ?? (fromCity.country === 'FR' ? 'a-lille' : 'a-nivelles')
    const km = distanceKm(agencyId === 'a-lille' ? 'lille' : 'nivelles', row.from, row.to)
    const plannedHours = plannedHoursFor(row.vol, km)
    const done = ['termine', 'facture', 'paye'].includes(row.status)

    const move: Move = {
      id,
      ref: `RM-${String(year).slice(2)}-${400 + i + 1}`,
      customerId,
      type: row.type,
      status: row.status,
      date,
      startTime: row.time ?? rnd.pick(TIMES),
      from,
      to,
      volumeM3: row.vol,
      options: opts,
      priceCents,
      depositCents: signed ? Math.round((priceCents * 0.3) / 1000) * 1000 : 0,
      crewId: crew?.id,
      teamIds: crew ? [...crew.memberIds] : [],
      vehicleIds,
      plannedHours,
      actualHours: done ? Math.round(plannedHours * (row.special === 'overHours' ? 1.9 : 0.92 + rnd.next() * 0.16) * 2) / 2 : undefined,
      distanceKm: km,
      liftUsed: liftUsed || undefined,
      requestedOn,
      visitOn,
      quoteSentOn,
      signedOn,
    }

    if (row.type === 'international') move.cmr = `CMR-${year}-${String(311 + i).padStart(4, '0')}`
    if (row.special === 'karim') move.note = 'piano'
    if (row.special === 'conflictB') move.note = 'parking'
    if (row.special === 'started') move.startedAt = `${date}T07:04`

    if (row.status === 'facture' || row.status === 'paye') {
      move.invoicedOn = addDays(date, 1)
      move.invoiceDueOn = addDays(date, 31)
      if (row.status === 'paye') move.paidOn = addDays(date, rnd.int(6, 11))
    }
    moves.push(move)
  })

  // Numéros de facture dans l'ordre chronologique
  moves
    .filter((m) => m.invoicedOn)
    .sort((a, b) => (a.invoicedOn! < b.invoicedOn! ? -1 : 1))
    .forEach((m, k) => (m.invoiceNumber = `F-${year}-${String(87 + k).padStart(4, '0')}`))

  return { company: COMPANY, settings: DEFAULT_SETTINGS, teams: TEAMS, staff, absences, vehicles, customers, moves, days: seedDays(moves, customers), claims: [], leads: seedLeads(moves, customers, today) }
}

/**
 * Journées terrain de départ :
 * - Didier (aujourd'hui) : mission en cours, à l'étape « Chargement » ;
 * - Youssef (il y a quelques jours) : journée envoyée au bureau, à contrôler, avec un miroir rayé signalé.
 * Karim n'a pas encore commencé : c'est la journée qu'on joue en direct.
 */
function seedDays(moves: Move[], customers: Customer[]): DriverDay[] {
  const days: DriverDay[] = []
  const t = (date: string, hhmm: string) => `${date}T${hhmm}`
  const live = moves.find((m) => m.status === 'enCours' && m.teamIds[0] === 's-didier')
  if (live) {
    const d = live.date
    days.push({
      id: dayId('s-didier', d), staffId: 's-didier', date: d, status: 'started', startedAt: t(d, '06:52'), startPlace: 'nivelles',
      vehicleId: live.vehicleIds[0] ?? 'v-2',
      check: { km: 48210, odometerPhoto: 'demo:compteur', fuel: 'troisQuarts', ok: true },
      pauses: [], expenses: [], corrections: [],
      missions: [{
        moveId: live.id, step: 3, times: [t(d, '07:04'), t(d, '07:41'), t(d, '08:12')],
        startPhotos: [{ room: 'salon', photo: 'demo:salon' }, { room: 'chambre', photo: 'demo:chambre' }, { room: 'cuisine', photo: 'demo:cuisine' }],
        fragile: ['miroir', 'vaisselle'], reservesStart: ['rayuresExistantes'], parcels: 0, specialItems: [], endPhotos: [], reservesEnd: [],
      }],
    })
  }
  const sent = moves.find((m) => m.status === 'termine' && m.type === 'gardeMeuble' && m.teamIds[0] === 's-youssef')
  if (sent) {
    const d = sent.date
    const client = customers.find((c) => c.id === sent.customerId)?.name ?? ''
    days.push({
      id: dayId('s-youssef', d), staffId: 's-youssef', date: d, status: 'sent', startedAt: t(d, '07:12'), startPlace: 'nivelles',
      vehicleId: sent.vehicleIds[0] ?? 'v-3',
      check: { km: 48210, odometerPhoto: 'demo:compteur', fuel: 'troisQuarts', ok: true },
      pauses: [{ start: t(d, '10:15'), end: t(d, '10:35') }],
      expenses: [{ id: 'exp-1', kind: 'parking', cents: 1250, photo: 'demo:ticket', at: t(d, '08:05'), moveId: sent.id }],
      corrections: [],
      endedAt: t(d, '12:40'), endKm: 48276, endPlace: 'nivelles', sentAt: t(d, '12:44'),
      missions: [{
        moveId: sent.id, step: 7,
        times: ['07:30', '08:02', '08:31', '09:40', '10:55', '11:20', '11:58'].map((h) => t(d, h)),
        startPhotos: [{ room: 'salon', photo: 'demo:salon' }, { room: 'chambre', photo: 'demo:chambre' }],
        fragile: ['miroir', 'tableau'], reservesStart: ['meubleDemonte'], parcels: 27, specialItems: ['armoire'],
        endPhotos: [{ room: 'cave', photo: 'demo:cartons' }], reservesEnd: [],
        damage: { item: 'miroir', type: 'rayure', severity: 'leger', photo: 'demo:rayure' },
        signature: { name: client, image: DEMO_SIGNATURE, at: t(d, '11:58') },
      }],
    })
  }
  return days
}
