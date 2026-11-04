/*
 * Conflits de planning, détectés en direct à partir des données :
 * véhicule ou personne affectés deux fois le même jour, personne absente, compétence manquante,
 * volume supérieur à la capacité des camions, contrôle technique dépassé.
 * Chaque conflit propose si possible UNE solution en un clic (autre camion libre, remplaçant disponible).
 */
import { addDays, fromISO } from './dates'
import { isAbsent } from './selectors'
import type { ConflictFix, DemoData, ISODate, Move, PlanConflict, Skill, Staff, Vehicle } from './types'

const ACTIVE = ['planifie', 'enCours']
const FIELD_ROLES = ['chefEquipe', 'chauffeur', 'demenageur']
const NEEDS_PERMIS_C = ['camion20', 'camion40', 'porteurHayon']
export const TRUCK_KINDS = ['camion20', 'camion40', 'porteurHayon', 'utilitaire']

const activeOn = (data: DemoData, day: ISODate, exceptId?: string) =>
  data.moves.filter((m) => m.date === day && ACTIVE.includes(m.status) && m.id !== exceptId)

const vehicle = (data: DemoData, id: string) => data.vehicles.find((v) => v.id === id)

/** Compétences nécessaires pour un dossier. */
export function requiredSkills(move: Move, data: DemoData): Skill[] {
  const skills: Skill[] = []
  if (move.type === 'international') skills.push('international')
  if ((move.liftUsed || move.options.includes('monteMeubles')) && !move.liftRented) skills.push('monteMeubles')
  if (move.vehicleIds.some((id) => NEEDS_PERMIS_C.includes(vehicle(data, id)?.kind ?? ''))) skills.push('permisC')
  return skills
}

function inspectionOk(v: Vehicle, day: ISODate) {
  return v.nextInspection >= day || (!!v.inspectionBookedOn && v.inspectionBookedOn <= day)
}

/** Camion libre ce jour-là, assez grand, contrôle technique en règle (même agence en priorité). */
export function freeTruck(data: DemoData, move: Move, minVolume: number, exclude: string[] = []): Vehicle | undefined {
  const busy = new Set(activeOn(data, move.date, move.id).flatMap((m) => m.vehicleIds))
  const agency = data.teams.find((t) => t.id === move.crewId)?.agencyId
  return data.vehicles
    .filter((v) => TRUCK_KINDS.includes(v.kind) && v.volumeM3 >= minVolume && !busy.has(v.id) && !exclude.includes(v.id))
    .filter((v) => !move.vehicleIds.includes(v.id) && inspectionOk(v, move.date))
    .sort((a, b) => Number(b.agencyId === agency) - Number(a.agencyId === agency) || a.volumeM3 - b.volumeM3)[0]
}

/** Personne de terrain disponible ce jour-là, avec les compétences demandées. */
export function freePerson(data: DemoData, move: Move, skills: Skill[]): Staff | undefined {
  const busy = new Set(activeOn(data, move.date, move.id).flatMap((m) => m.teamIds))
  const agency = data.teams.find((t) => t.id === move.crewId)?.agencyId
  return data.staff
    .filter((s) => FIELD_ROLES.includes(s.role) && !busy.has(s.id) && !move.teamIds.includes(s.id))
    .filter((s) => !isAbsent(data, s.id, move.date) && skills.every((k) => s.skills.includes(k)))
    .sort((a, b) => Number(b.agencyId === agency) - Number(a.agencyId === agency) || a.skills.length - b.skills.length)[0]
}

/** Remplaçant pour une personne : il doit apporter les compétences que l'équipe perdrait. */
function replacementFor(data: DemoData, move: Move, staffId: string): ConflictFix | undefined {
  const rest = move.teamIds.filter((id) => id !== staffId)
  const restSkills = new Set(rest.flatMap((id) => data.staff.find((s) => s.id === id)?.skills ?? []))
  const needed = requiredSkills(move, data).filter((k) => !restSkills.has(k))
  const p = freePerson(data, move, needed)
  return p ? { type: 'staff', from: staffId, to: p.id } : undefined
}

function vehicleFix(data: DemoData, move: Move, vehicleId: string): ConflictFix | undefined {
  const v = vehicle(data, vehicleId)
  if (v?.kind === 'monteMeubles') return undefined
  const other = freeTruck(data, move, move.volumeM3)
  return other ? { type: 'vehicle', from: vehicleId, to: other.id } : undefined
}

/** Prix de location d'un monte-meubles avec son opérateur, pour une journée. */
export const LIFT_RENTAL_CENTS = 18_000
const POSTPONE_MAX_DAYS = 14

const concerning = (list: PlanConflict[], moveId: string) => list.filter((c) => c.moveId === moveId || c.otherMoveId === moveId)

/**
 * Conflits du planning, chacun avec une solution SÛRE (qui ne crée aucun nouveau conflit sur le dossier).
 * Si la solution directe n'est pas sûre ou n'existe pas : location d'un monte-meubles, ou décalage au premier
 * jour libre. Il ne reste « sans solution » que des cas extrêmes (aucun jour libre sur 14 jours).
 */
export function detectConflicts(data: DemoData): PlanConflict[] {
  const raw = rawConflicts(data)
  return raw.map((c) => ({ ...c, fix: safeFix(data, c, raw) }))
}

function isSafe(data: DemoData, c: PlanConflict, raw: PlanConflict[], fix: ConflictFix): boolean {
  const before = concerning(raw, c.moveId)
  const beforeIds = new Set(before.map((x) => x.id))
  const after = concerning(rawConflicts(applyFix(data, { ...c, fix })), c.moveId)
  return after.length < before.length && after.every((x) => beforeIds.has(x.id))
}

function safeFix(data: DemoData, c: PlanConflict, raw: PlanConflict[]): ConflictFix | undefined {
  if (c.fix && isSafe(data, c, raw, c.fix)) return c.fix
  if (c.kind === 'vehicleDouble' && vehicle(data, c.vehicleId ?? '')?.kind === 'monteMeubles') return { type: 'rentLift' }
  const move = data.moves.find((m) => m.id === c.moveId)
  if (!move || move.status !== 'planifie') return undefined
  for (let d = 1; d <= POSTPONE_MAX_DAYS; d++) {
    const to = addDays(move.date, d)
    if (fromISO(to).getDay() === 0) continue
    const fix: ConflictFix = { type: 'postpone', to }
    if (concerning(rawConflicts(applyFix(data, { ...c, fix })), move.id).length === 0) return fix
  }
  return undefined
}

function rawConflicts(data: DemoData): PlanConflict[] {
  const out: PlanConflict[] = []
  const moves = data.moves.filter((m) => ACTIVE.includes(m.status)).sort((a, b) => a.date.localeCompare(b.date) || a.startTime.localeCompare(b.startTime))
  const firstVehicleUse = new Map<string, string>()
  const firstPersonUse = new Map<string, string>()

  for (const move of moves) {
    // 1. Véhicule déjà pris ce jour-là
    for (const vid of move.vehicleIds) {
      const key = `${move.date}|${vid}`
      const first = firstVehicleUse.get(key)
      if (first) out.push({ id: `vehicleDouble-${move.id}-${vid}`, kind: 'vehicleDouble', moveId: move.id, date: move.date, vehicleId: vid, otherMoveId: first, fix: vehicleFix(data, move, vid) })
      else firstVehicleUse.set(key, move.id)
    }
    // 2. Personne déjà prise ce jour-là
    for (const sid of move.teamIds) {
      const key = `${move.date}|${sid}`
      const first = firstPersonUse.get(key)
      if (first) out.push({ id: `personDouble-${move.id}-${sid}`, kind: 'personDouble', moveId: move.id, date: move.date, staffId: sid, otherMoveId: first, fix: replacementFor(data, move, sid) })
      else firstPersonUse.set(key, move.id)
    }
    // 3. Personne absente
    for (const sid of move.teamIds) {
      if (isAbsent(data, sid, move.date))
        out.push({ id: `personAbsent-${move.id}-${sid}`, kind: 'personAbsent', moveId: move.id, date: move.date, staffId: sid, fix: replacementFor(data, move, sid) })
    }
    // 4. Compétence manquante (seulement si une équipe est affectée)
    if (move.teamIds.length) {
      const team = new Set(move.teamIds.flatMap((id) => data.staff.find((s) => s.id === id)?.skills ?? []))
      for (const skill of requiredSkills(move, data)) {
        if (team.has(skill)) continue
        const p = freePerson(data, move, [skill])
        out.push({ id: `skillMissing-${move.id}-${skill}`, kind: 'skillMissing', moveId: move.id, date: move.date, skill, fix: p ? { type: 'staff', to: p.id } : undefined })
      }
    }
    // 5. Volume supérieur à la capacité des camions
    const trucks = move.vehicleIds.map((id) => vehicle(data, id)).filter((v): v is Vehicle => !!v && TRUCK_KINDS.includes(v.kind))
    const capacity = trucks.reduce((s, v) => s + v.volumeM3, 0)
    if (trucks.length && capacity < move.volumeM3) {
      const main = trucks[0]!
      const bigger = freeTruck(data, move, move.volumeM3)
      out.push({ id: `overCapacity-${move.id}`, kind: 'overCapacity', moveId: move.id, date: move.date, vehicleId: main.id, fix: bigger ? { type: 'vehicle', from: main.id, to: bigger.id } : undefined })
    }
    // 6. Contrôle technique dépassé le jour du déménagement
    for (const v of trucks) {
      if (!inspectionOk(v, move.date))
        out.push({ id: `inspectionOverdue-${move.id}-${v.id}`, kind: 'inspectionOverdue', moveId: move.id, date: move.date, vehicleId: v.id, fix: vehicleFix(data, move, v.id) })
    }
  }
  return out
}

/** Applique la solution proposée d'un conflit. */
export function applyFix(data: DemoData, conflict: PlanConflict): DemoData {
  const fix = conflict.fix
  if (!fix) return data
  return {
    ...data,
    moves: data.moves.map((m) => {
      if (m.id !== conflict.moveId) return m
      if (fix.type === 'vehicle') return { ...m, vehicleIds: m.vehicleIds.map((v) => (v === fix.from ? fix.to : v)) }
      if (fix.type === 'postpone') return { ...m, date: fix.to }
      if (fix.type === 'rentLift')
        return {
          ...m,
          liftRented: true,
          vehicleIds: m.vehicleIds.filter((v) => vehicle(data, v)?.kind !== 'monteMeubles'),
          extraCosts: [...(m.extraCosts ?? []), { kind: 'liftRental' as const, cents: LIFT_RENTAL_CENTS }],
        }
      const teamIds = fix.from ? m.teamIds.map((s) => (s === fix.from ? fix.to : s)) : [...m.teamIds, fix.to]
      return { ...m, teamIds }
    }),
  }
}
