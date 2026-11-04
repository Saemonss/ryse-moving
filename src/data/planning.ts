/*
 * Affectation d'un dossier (date, équipe type, camion), en fonction pure : utilisée par le store ET par la
 * fenêtre « Affecter » pour prévisualiser les conflits avant de valider.
 */
import { isAbsent } from './selectors'
import { distanceKm, plannedHoursFor } from './geo'
import type { DemoData, ISODate } from './types'

export interface AssignPlan {
  date: ISODate
  crewId: string
  vehicleId: string
}

const kmFor = (m: DemoData['moves'][number], agencyId?: string) =>
  distanceKm(agencyId === 'a-lille' ? 'lille' : 'nivelles', m.from.cityId, m.to?.cityId)

/** Statuts qu'on peut encore planifier ou déplacer (jamais un dossier en cours ou réalisé). */
export const PLANNABLE = ['devisSigne', 'planifie']

export function assignMoveData(data: DemoData, moveId: string, plan: AssignPlan): DemoData {
  const team = data.teams.find((t) => t.id === plan.crewId)
  const target = data.moves.find((m) => m.id === moveId)
  if (!target || !PLANNABLE.includes(target.status)) return data
  return {
    ...data,
    moves: data.moves.map((m) =>
      m.id !== moveId
        ? m
        : {
            ...m,
            date: plan.date,
            crewId: plan.crewId,
            status: 'planifie',
            // Distance et durée recalculées depuis le dépôt de l'équipe (Nivelles ou Lille) → coût et marge à jour
            distanceKm: kmFor(m, team?.agencyId),
            plannedHours: plannedHoursFor(m.volumeM3, kmFor(m, team?.agencyId)),
            teamIds: team ? [...team.memberIds] : m.teamIds,
            vehicleIds: [plan.vehicleId, ...(m.liftUsed ? ['v-7'] : [])],
          },
    ),
  }
}

/** Équipe proposée par défaut : celle de l'agence du dossier, libre ce jour-là, sans absent. */
export function suggestCrew(data: DemoData, moveId: string, date: ISODate): string {
  const move = data.moves.find((m) => m.id === moveId)
  const agency = move?.from.country === 'FR' ? 'a-lille' : 'a-nivelles'
  const busy = new Set(data.moves.filter((m) => m.date === date && m.id !== moveId && ['planifie', 'enCours'].includes(m.status)).map((m) => m.crewId))
  const ranked = [...data.teams].sort((a, b) => {
    const score = (t: (typeof data.teams)[number]) =>
      (t.agencyId === agency ? 0 : 4) + (busy.has(t.id) ? 2 : 0) + (t.memberIds.some((id) => isAbsent(data, id, date)) ? 1 : 0)
    return score(a) - score(b)
  })
  return move?.crewId ?? ranked[0]?.id ?? data.teams[0]!.id
}
