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
import { todayISO } from '../data/dates'
import type { Alert, DemoData, ISODate } from '../data/types'

export const STORAGE_KEY = 'ryse-moving-demo'

interface DemoState {
  seedDay: ISODate
  data: DemoData
  startDriverDay: (moveId: string) => void
  resolveAlert: (alert: Alert) => void
  resetDemo: () => void
}

/** Lecture tolérante : un contenu corrompu est ignoré au lieu de provoquer une erreur. */
const safeStorage: StateStorage = {
  getItem: (name) => {
    try {
      const raw = localStorage.getItem(name)
      if (raw) JSON.parse(raw)
      return raw
    } catch {
      localStorage.removeItem(name)
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
      resetDemo: () => set(fresh()),
    }),
    {
      name: STORAGE_KEY,
      version: 1,
      storage: createJSONStorage(() => safeStorage),
      partialize: (s) => ({ seedDay: s.seedDay, data: s.data }),
      merge: (persisted, current) => {
        const p = persisted as Partial<DemoState> | undefined
        if (!p || p.seedDay !== todayISO() || !p.data?.moves) return current
        return { ...current, seedDay: p.seedDay, data: p.data }
      },
      migrate: () => fresh(),
    },
  ),
)
