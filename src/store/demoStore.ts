/*
 * État de la démo, sauvegardé dans le navigateur (localStorage) : les actions faites pendant un rendez-vous
 * restent visibles même après un rechargement de page.
 * - Données d'un autre jour ou illisibles → on repart automatiquement des données de départ du jour.
 * - resetDemo() recharge les données de départ (menu présentateur ou Ctrl + Maj + R).
 */
import { create } from 'zustand'
import { createJSONStorage, persist, type StateStorage } from 'zustand/middleware'
import { createSeed } from '../data/seed'
import { fixAlert } from '../data/scenarios'
import { applyFix } from '../data/conflicts'
import { todayISO } from '../data/dates'
import type { Absence, Alert, DemoData, ISODate, PlanConflict, Settings } from '../data/types'

export const STORAGE_KEY = 'ryse-moving-demo'
const SCHEMA_VERSION = 4

interface DemoState {
  seedDay: ISODate
  data: DemoData
  startDriverDay: (moveId: string) => void
  resolveAlert: (alert: Alert) => void
  /** Planifie (ou déplace) un dossier : date, équipe type, camion. */
  assignMove: (moveId: string, plan: { date: ISODate; crewId: string; vehicleId: string }) => void
  addAbsence: (absence: Omit<Absence, 'id'>) => void
  removeAbsence: (id: string) => void
  resolveConflict: (conflict: PlanConflict) => void
  updateSettings: (patch: Partial<Settings>) => void
  publishPlanning: (staffIds: string[]) => void
  resetDemo: () => void
}

const clamp = (v: number, min: number, max: number) => (Number.isFinite(v) ? Math.min(max, Math.max(min, Math.round(v))) : min)

/** Bornes des paramètres : une saisie vide ou aberrante ne peut jamais casser les calculs. */
export const SETTINGS_BOUNDS = {
  hourlyCostCents: [1000, 10000],
  kmCostCents: [0, 500],
  fuelCentsPerLitre: [50, 500],
  marginThresholdPct: [0, 80],
} as const

function sanitize(s: Settings): Settings {
  const B = SETTINGS_BOUNDS
  return {
    hourlyCostCents: clamp(s.hourlyCostCents, ...B.hourlyCostCents),
    fuelCentsPerLitre: clamp(s.fuelCentsPerLitre, ...B.fuelCentsPerLitre),
    marginThresholdPct: clamp(s.marginThresholdPct, ...B.marginThresholdPct),
    kmCostCents: Object.fromEntries(
      Object.entries(s.kmCostCents).map(([k, v]) => [k, clamp(v, ...B.kmCostCents)]),
    ) as Settings['kmCostCents'],
  }
}

/** Lecture tolérante : un contenu corrompu est ignoré au lieu de provoquer une erreur. */
const safeStorage: StateStorage = {
  getItem: (name) => {
    try {
      const raw = localStorage.getItem(name)
      if (raw) JSON.parse(raw)
      return raw
    } catch {
      try {
        localStorage.removeItem(name)
      } catch {
        /* stockage bloqué : on ignore */
      }
      return null
    }
  },
  setItem: (name, value) => {
    try {
      localStorage.setItem(name, value)
    } catch {
      /* stockage plein ou bloqué : la démo continue en mémoire */
    }
  },
  removeItem: (name) => localStorage.removeItem(name),
}

const fresh = () => {
  const day = todayISO()
  return { seedDay: day, data: createSeed(day) }
}

export const useDemo = create<DemoState>()(
  persist(
    (set, get) => ({
      ...fresh(),
      startDriverDay: (moveId) => {
        const now = new Date()
        const stamp = `${get().seedDay}T${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
        set((s) => ({
          data: { ...s.data, moves: s.data.moves.map((m) => (m.id === moveId ? { ...m, status: 'enCours', startedAt: stamp } : m)) },
        }))
      },
      resolveAlert: (alert) => set((s) => ({ data: fixAlert(s.data, alert, s.seedDay) })),
      assignMove: (moveId, plan) =>
        set((s) => {
          const team = s.data.teams.find((t) => t.id === plan.crewId)
          return {
            data: {
              ...s.data,
              moves: s.data.moves.map((m) =>
                m.id !== moveId
                  ? m
                  : {
                      ...m,
                      date: plan.date,
                      crewId: plan.crewId,
                      status: m.status === 'enCours' ? m.status : 'planifie',
                      teamIds: team ? [...team.memberIds] : m.teamIds,
                      vehicleIds: [plan.vehicleId, ...(m.liftUsed ? ['v-7'] : [])],
                    },
              ),
            },
          }
        }),
      addAbsence: (absence) =>
        set((s) => {
          const id = `ab-${s.data.absences.length + 1}-${absence.staffId}-${absence.from}`
          const from = absence.from <= absence.to ? absence.from : absence.to
          const to = absence.from <= absence.to ? absence.to : absence.from
          return { data: { ...s.data, absences: [...s.data.absences, { ...absence, from, to, id }] } }
        }),
      removeAbsence: (id) => set((s) => ({ data: { ...s.data, absences: s.data.absences.filter((a) => a.id !== id) } })),
      resolveConflict: (conflict) => set((s) => ({ data: applyFix(s.data, conflict) })),
      updateSettings: (patch) => set((s) => ({ data: { ...s.data, settings: sanitize({ ...s.data.settings, ...patch }) } })),
      publishPlanning: (staffIds) => set((s) => ({ data: { ...s.data, published: { at: new Date().toISOString(), staffIds } } })),
      resetDemo: () => set(fresh()),
    }),
    {
      name: STORAGE_KEY,
      // À augmenter dès que la forme des données change : les anciennes sauvegardes sont alors ignorées.
      version: SCHEMA_VERSION,
      storage: createJSONStorage(() => safeStorage),
      partialize: (s) => ({ seedDay: s.seedDay, data: s.data }),
      merge: (persisted, current) => {
        const p = persisted as Partial<DemoState> | undefined
        if (!p || p.seedDay !== todayISO() || !isValidData(p.data)) return current
        return { ...current, seedDay: p.seedDay, data: p.data }
      },
      migrate: () => fresh(),
    },
  ),
)

/** Vérifie que la sauvegarde a bien toutes les listes attendues (sinon : données de départ). */
function isValidData(d: unknown): d is DemoData {
  const x = d as Partial<DemoData> | undefined
  return (
    !!x &&
    typeof x.company === 'object' &&
    typeof x.settings === 'object' &&
    Array.isArray(x.absences) &&
    [x.staff, x.teams, x.vehicles, x.customers, x.moves].every((list) => Array.isArray(list) && list.length > 0)
  )
}

/**
 * Si la démo reste ouverte jusqu'au lendemain (ordinateur en veille), elle repart des données du nouveau jour
 * dès que la fenêtre redevient active, ou au plus tard une minute après minuit.
 */
export function watchDayChange() {
  const check = () => {
    if (useDemo.getState().seedDay !== todayISO()) useDemo.getState().resetDemo()
  }
  const id = window.setInterval(check, 60_000)
  window.addEventListener('focus', check)
  document.addEventListener('visibilitychange', check)
  return () => {
    window.clearInterval(id)
    window.removeEventListener('focus', check)
    document.removeEventListener('visibilitychange', check)
  }
}
