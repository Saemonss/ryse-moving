/*
 * Calculateur de gain : une ESTIMATION à partir des chiffres du prospect et d'hypothèses visibles et modifiables.
 * temps gagné par semaine = tâches automatisées × minutes économisées ; valeur = ce temps × coût horaire.
 * Aucun chiffre n'est présenté comme un résultat constaté chez un client.
 */
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { AgentId } from './agents'

export interface GainInputs {
  leadsPerWeek: number
  quotesPerWeek: number
  movesPerMonth: number
  officeHoursPerWeek: number
  hourlyCost: number
}

/** Minutes économisées par tâche, par agent (hypothèses de départ, modifiables à l'écran). */
export type GainMinutes = Record<AgentId, number>

export const DEFAULT_INPUTS: GainInputs = { leadsPerWeek: 25, quotesPerWeek: 15, movesPerMonth: 40, officeHoursPerWeek: 60, hourlyCost: 35 }
export const DEFAULT_MINUTES: GainMinutes = { accueil: 10, volume: 15, devis: 20, relances: 5, litiges: 3, resume: 15 }

export const INPUT_BOUNDS: Record<keyof GainInputs, [number, number]> = {
  leadsPerWeek: [0, 1000],
  quotesPerWeek: [0, 1000],
  movesPerMonth: [0, 2000],
  officeHoursPerWeek: [1, 1000],
  hourlyCost: [0, 500],
}
export const MINUTES_BOUNDS: [number, number] = [0, 240]

const clamp = (v: number, [min, max]: [number, number]) => (Number.isFinite(v) ? Math.min(max, Math.max(min, v)) : min)

/** Nombre de tâches par semaine que chaque agent prend en charge. */
export function tasksPerWeek(id: AgentId, i: GainInputs): number {
  switch (id) {
    case 'accueil':
      return i.leadsPerWeek
    case 'volume':
    case 'devis':
    case 'relances':
      return i.quotesPerWeek
    case 'litiges':
      return (i.movesPerMonth * 12) / 52
    case 'resume':
      return 5
  }
}

export interface GainLine {
  id: AgentId
  tasks: number
  minutes: number
  hours: number
}

/** Calcul complet pour les agents actifs. Le total ne dépasse jamais les heures de bureau déclarées. */
export function computeGains(i: GainInputs, m: GainMinutes, active: Record<AgentId, boolean>, ids: readonly AgentId[]) {
  const lines: GainLine[] = ids
    .filter((id) => active[id])
    .map((id) => {
      const tasks = tasksPerWeek(id, i)
      return { id, tasks, minutes: m[id], hours: (tasks * m[id]) / 60 }
    })
  const raw = lines.reduce((s, l) => s + l.hours, 0)
  const capped = i.officeHoursPerWeek > 0 ? Math.min(raw, i.officeHoursPerWeek) : raw
  const week = capped * i.hourlyCost
  return {
    lines,
    hoursWeek: capped,
    capped: capped < raw,
    shareOfOffice: i.officeHoursPerWeek > 0 ? capped / i.officeHoursPerWeek : 0,
    valueWeek: week,
    valueMonth: (week * 52) / 12,
    valueYear: week * 52,
  }
}

interface GainState {
  inputs: GainInputs
  minutes: GainMinutes
  setInput: (k: keyof GainInputs, v: number) => void
  setMinutes: (id: AgentId, v: number) => void
  reset: () => void
}

export const useGains = create<GainState>()(
  persist(
    (set) => ({
      inputs: DEFAULT_INPUTS,
      minutes: DEFAULT_MINUTES,
      setInput: (k, v) => set((s) => ({ inputs: { ...s.inputs, [k]: clamp(v, INPUT_BOUNDS[k]) } })),
      setMinutes: (id, v) => set((s) => ({ minutes: { ...s.minutes, [id]: clamp(v, MINUTES_BOUNDS) } })),
      reset: () => set({ inputs: DEFAULT_INPUTS, minutes: DEFAULT_MINUTES }),
    }),
    {
      name: 'ryse-moving-gains',
      // Sauvegarde abîmée ou incomplète : on repart des valeurs de départ, champ par champ
      merge: (persisted, current) => {
        const p = (persisted ?? {}) as Partial<GainState>
        const inputs = { ...DEFAULT_INPUTS }
        for (const k of Object.keys(DEFAULT_INPUTS) as (keyof GainInputs)[]) {
          const v = p.inputs?.[k]
          if (typeof v === 'number') inputs[k] = clamp(v, INPUT_BOUNDS[k])
        }
        const minutes = { ...DEFAULT_MINUTES }
        for (const k of Object.keys(DEFAULT_MINUTES) as AgentId[]) {
          const v = p.minutes?.[k]
          if (typeof v === 'number') minutes[k] = clamp(v, MINUTES_BOUNDS)
        }
        return { ...current, inputs, minutes }
      },
    },
  ),
)
