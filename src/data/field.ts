/*
 * Terrain : la journée du chauffeur, en fonctions pures (aucune interface ici).
 * - Le TÉLÉPHONE garde sa propre copie des journées (phoneDays). Le BUREAU ne voit que la dernière synchronisation
 *   (data.days). En ligne, chaque action est synchronisée aussitôt ; hors ligne, elle attend dans une file.
 * - La synchronisation met aussi à jour les dossiers : mission commencée → « En cours », signée → « Terminé ».
 * - La validation d'une journée par le gérant reporte les heures réelles et les frais sur les dossiers.
 */
import type { Claim, DemoData, DriverDay, ISODate, MissionLog, Move } from './types'

/** Les 7 étapes d'une mission, dans l'ordre. */
export const MISSION_STEPS = ['depart', 'arriveeClient', 'edlDepart', 'chargement', 'trajet', 'edlArrivee', 'signature'] as const
export type MissionStepKey = (typeof MISSION_STEPS)[number]
export const MISSION_DONE = MISSION_STEPS.length

export const dayId = (staffId: string, date: ISODate) => `day-${staffId}-${date}`

export function emptyMission(moveId: string): MissionLog {
  return { moveId, step: 0, times: [], startPhotos: [], fragile: [], reservesStart: [], parcels: 0, specialItems: [], endPhotos: [], reservesEnd: [] }
}

/** Les dossiers du jour d'un chauffeur (planifiés ou en cours), dans l'ordre de passage. */
export function driverMoves(data: DemoData, staffId: string, date: ISODate): Move[] {
  return data.moves
    .filter((m) => m.date === date && m.teamIds.includes(staffId) && ['planifie', 'enCours', 'termine'].includes(m.status))
    .sort((a, b) => a.startTime.localeCompare(b.startTime))
}

/** Remplace une journée dans la liste (ou l'ajoute). */
export function putDay(days: DriverDay[], day: DriverDay): DriverDay[] {
  return days.some((d) => d.id === day.id) ? days.map((d) => (d.id === day.id ? day : d)) : [...days, day]
}

/** Remplace une mission dans une journée (ou l'ajoute). */
export function putMission(day: DriverDay, mission: MissionLog): DriverDay {
  const missions = day.missions.some((m) => m.moveId === mission.moveId)
    ? day.missions.map((m) => (m.moveId === mission.moveId ? mission : m))
    : [...day.missions, mission]
  return { ...day, missions }
}

/** Heures travaillées d'une journée (pauses déduites). */
export function workedHours(day: DriverDay, now = new Date()): number {
  const end = day.endedAt ? new Date(day.endedAt) : now
  const total = (end.getTime() - new Date(day.startedAt).getTime()) / 3_600_000
  const paused = day.pauses.reduce((s, p) => s + ((p.end ? new Date(p.end) : now).getTime() - new Date(p.start).getTime()) / 3_600_000, 0)
  return Math.max(0, total - paused)
}

/** Kilomètres parcourus (compteur de fin − compteur de début). */
export const dayKm = (day: DriverDay) => (day.check && day.endKm ? Math.max(0, day.endKm - day.check.km) : 0)

export const isPaused = (day: DriverDay) => day.pauses.some((p) => !p.end)

/**
 * Synchronisation téléphone → bureau. Les décisions du bureau (validation, corrections) sont conservées.
 * Les dossiers suivent l'avancement : 1re étape franchie → « En cours » ; signature → « Terminé ».
 */
export function syncOffice(data: DemoData, phoneDays: DriverDay[]): DemoData {
  const days = phoneDays.map((p) => {
    const office = data.days.find((d) => d.id === p.id)
    if (!office || office.status !== 'validated') return { ...p, corrections: office?.corrections ?? p.corrections }
    return { ...p, status: office.status, validatedAt: office.validatedAt, corrections: office.corrections, endKm: office.endKm }
  })
  const missions = new Map(days.flatMap((d) => d.missions.map((m) => [m.moveId, m] as const)))
  const moves = data.moves.map((m) => {
    const log = missions.get(m.id)
    if (!log) return m
    if (log.step >= MISSION_DONE && ['planifie', 'enCours'].includes(m.status)) return { ...m, status: 'termine' as const, startedAt: m.startedAt ?? log.times[0] }
    if (log.step >= 1 && m.status === 'planifie') return { ...m, status: 'enCours' as const, startedAt: log.times[0] }
    return m
  })
  return { ...data, days, moves }
}

/**
 * Validation d'une journée par le gérant : heures réelles et frais reportés sur chaque dossier.
 * Heures réelles = durée mesurée de la mission ; si la démo a été accélérée (moins de 30 min), on garde la durée
 * prévue pour que la marge reste crédible.
 */
export function applyValidation(data: DemoData, day: DriverDay, at: string): DemoData {
  const hoursFix = day.corrections.filter((c) => c.field === 'hours').at(-1)
  const moves = data.moves.map((m) => {
    const log = day.missions.find((x) => x.moveId === m.id && x.step >= MISSION_DONE)
    if (!log) return m
    const measured = (new Date(log.times.at(-1)!).getTime() - new Date(log.times[0]!).getTime()) / 3_600_000
    const share = day.missions.filter((x) => x.step >= MISSION_DONE).length || 1
    const hours = hoursFix ? hoursFix.to / share : measured >= 0.5 ? measured : m.plannedHours
    const expenses = day.expenses.filter((e) => e.moveId === m.id).reduce((s, e) => s + e.cents, 0)
    const extraCosts = [...(m.extraCosts ?? []).filter((c) => c.kind !== 'expenses'), ...(expenses ? [{ kind: 'expenses' as const, cents: expenses }] : [])]
    return { ...m, actualHours: Math.max(0.5, Math.round(hours * 2) / 2), extraCosts }
  })
  return { ...data, moves, days: data.days.map((d) => (d.id === day.id ? { ...day, status: 'validated' as const, validatedAt: at } : d)) }
}

/** Ouvre un dossier litige pour un dégât signalé (une seule fois par dossier). */
export function openClaimData(data: DemoData, dayIdValue: string, moveId: string, at: string): { data: DemoData; claimId: string } {
  const existing = data.claims.find((c) => c.moveId === moveId)
  if (existing) return { data, claimId: existing.id }
  const damage = data.days.find((d) => d.id === dayIdValue)?.missions.find((m) => m.moveId === moveId)?.damage
  if (!damage) return { data, claimId: '' }
  const claimId = `lit-${data.claims.length + 1}`
  const claim: Claim = { id: claimId, moveId, dayId: dayIdValue, openedAt: at, status: 'ouvert', damage }
  return { data: { ...data, claims: [...data.claims, claim] }, claimId }
}

/** Signature de démonstration (trait au doigt) en SVG, pour le jeu de départ et l'avance rapide. */
export const DEMO_SIGNATURE =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 100"><path d="M14 70 C 34 20, 52 20, 58 62 S 84 92, 98 48 S 122 18, 130 58 C 136 84, 152 80, 166 52 S 196 30, 206 60 S 236 78, 286 40" fill="none" stroke="#0b1026" stroke-width="3.5" stroke-linecap="round"/></svg>',
  )

/**
 * Avance rapide (menu présentateur) : complète l'étape en cours avec des valeurs de démonstration,
 * puis passe à l'étape suivante.
 */
export function advanceMissionDemo(mission: MissionLog, clientName: string, now: string): MissionLog {
  const m = { ...mission }
  const key = MISSION_STEPS[m.step]
  if (key === 'edlDepart' && m.startPhotos.length === 0) {
    m.startPhotos = [
      { room: 'salon', photo: 'demo:salon' },
      { room: 'chambre', photo: 'demo:chambre' },
    ]
    m.fragile = ['miroir']
  }
  if (key === 'chargement' && m.parcels === 0) m.parcels = 34
  if (key === 'edlArrivee' && m.endPhotos.length === 0) m.endPhotos = [{ room: 'salon', photo: 'demo:salon' }]
  if (key === 'signature' && !m.signature) m.signature = { name: clientName, image: DEMO_SIGNATURE, at: now }
  return { ...m, step: Math.min(MISSION_DONE, m.step + 1), times: [...m.times, now] }
}
