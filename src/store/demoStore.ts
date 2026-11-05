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
import { applyFix, detectConflicts } from '../data/conflicts'
import { assignMoveData } from '../data/planning'
import { todayISO } from '../data/dates'
import type { Absence, Alert, Claim, DemoData, DriverDay, ISODate, Lead, LeadChannel, LeadFacts, PlanConflict, Settings } from '../data/types'
import { clientAnswers, leadFacts, missingFields, parseNotes, simulateLead, upsertMoveFromLead } from '../data/leads'
import { DEMO_CLIENT_PHOTOS, confidenceFor, inventoryFromPhotos, inventoryTotal } from '../data/inventory'
import { optionsOf, patchLine, prepareQuote, quoteDeposit, quoteTotal } from '../data/quote'
import { addDays } from '../data/dates'
import { MISSION_DONE, advanceMissionDemo, applyValidation, dayId, driverMoves, emptyMission, openClaimData, syncOffice } from '../data/field'

export const STORAGE_KEY = 'ryse-moving-demo'
const SCHEMA_VERSION = 7

/** Ce qui attend dans la file du téléphone quand il n'y a pas de réseau. */
export type QueueLabel = 'dayStart' | 'vehicleCheck' | 'step' | 'photos' | 'damage' | 'signature' | 'expense' | 'pause' | 'dayEnd' | 'daySent'
export interface QueueItem {
  id: number
  label: QueueLabel
  at: string
}

interface DemoState {
  seedDay: ISODate
  /** Données vues par le bureau (gérant, planificateur…). */
  data: DemoData
  /** Journées telles qu'enregistrées sur les téléphones des chauffeurs. */
  phoneDays: DriverDay[]
  /** Chauffeur connecté sur le téléphone de démo (null = écran de connexion). */
  session: string | null
  /** Réseau du téléphone (le présentateur peut simuler une coupure). */
  online: boolean
  queue: QueueItem[]
  login: (staffId: string) => void
  logout: () => void
  /** Toute action du chauffeur passe par ici : enregistrée sur le téléphone, puis envoyée (ou mise en file). */
  field: (label: QueueLabel, update: (days: DriverDay[]) => DriverDay[]) => void
  /** Coupe ou rétablit le réseau. Au retour : renvoie le nombre d'éléments envoyés. */
  setOnline: (online: boolean) => number
  /** Menu présentateur : avance la mission en cours (Karim, sinon Didier). Renvoie le prénom concerné. */
  advanceMission: () => string | null
  validateDay: (dayId: string) => void
  correctDay: (dayId: string, field: 'hours' | 'km' | 'expenses', from: number, to: number) => void
  openClaim: (dayId: string, moveId: string) => string
  setClaimStatus: (claimId: string, status: Claim['status']) => void
  /** Menu présentateur : une nouvelle demande arrive (canal, langue). Renvoie son identifiant. */
  simulateLead: (channel: LeadChannel, lang: 'fr' | 'nl') => string
  /** Le gérant confie à l'agent une demande reçue par appel ou SMS (texte libre). Renvoie son identifiant. */
  askAgent: (input: { channel: LeadChannel; name: string; phone: string; notes: string; lang: 'fr' | 'nl' }) => string
  /** L'agent traite la demande : dossier créé, réponse au client ou rappel demandé au gérant. */
  processLead: (id: string) => void
  /** Démo : le client répond aux questions de l'agent. */
  clientReply: (id: string) => void
  /** Le gérant a rappelé le prospect et renvoie ses réponses à l'agent. */
  completeCallback: (id: string, answers: LeadFacts) => void
  /** Volume par photos : lien envoyé au client, photos reçues (démo), inventaire corrigé, volume validé. */
  requestPhotos: (id: string) => void
  clientSendPhotos: (id: string, mode: 'full' | 'partial') => void
  setInventoryQty: (id: string, lineId: string, qty: number) => void
  validateVolume: (id: string) => void
  proposeVisit: (id: string) => void
  /** Devis : préparé par l'agent, corrigé par le commercial, envoyé (humain), signé par le client. */
  prepareQuote: (id: string) => void
  setQuoteLine: (id: string, lineId: string, patch: { qty?: number; unitCents?: number }) => void
  /** Renvoie false si le devis était déjà envoyé (double clic) : un seul envoi. */
  sendQuote: (id: string) => boolean
  signQuote: (id: string, name: string, image: string) => void
  startDriverDay: (moveId: string) => void
  /** Renvoie false si la situation a changé entre-temps (rien n'est modifié). */
  resolveAlert: (alert: Alert) => boolean
  /** Planifie (ou déplace) un dossier : date, équipe type, camion. */
  assignMove: (moveId: string, plan: { date: ISODate; crewId: string; vehicleId: string }) => void
  addAbsence: (absence: Omit<Absence, 'id'>) => void
  removeAbsence: (id: string) => void
  /** Renvoie false si le conflit n'existe plus ou n'a plus de solution (rien n'est modifié). */
  resolveConflict: (conflict: PlanConflict) => boolean
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
    pricing: Object.fromEntries(
      Object.entries(s.pricing).map(([k, v]) => [k, k === 'depositPct' ? clamp(v, 0, 100) : clamp(v, 0, 10_000_000)]),
    ) as unknown as Settings['pricing'],
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
  const data = createSeed(day)
  return { seedDay: day, data, phoneDays: structuredClone(data.days), session: null, online: true, queue: [] as QueueItem[] }
}

let queueSeq = 1

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
      login: (staffId) => set({ session: staffId }),
      logout: () => set({ session: null }),
      field: (label, update) =>
        set((s) => {
          const phoneDays = update(s.phoneDays)
          if (s.online) return { phoneDays, data: syncOffice(s.data, phoneDays) }
          return { phoneDays, queue: [...s.queue, { id: queueSeq++, label, at: new Date().toISOString() }] }
        }),
      setOnline: (online) => {
        const s = get()
        if (!online) {
          set({ online: false })
          return 0
        }
        const sent = s.queue.length
        set({ online: true, queue: [], data: syncOffice(s.data, s.phoneDays) })
        return sent
      },
      advanceMission: () => {
        const s = get()
        for (const staffId of ['s-karim', 's-didier']) {
          const day = s.phoneDays.find((d) => d.id === dayId(staffId, s.seedDay) && d.status === 'started')
          if (!day) continue
          const nextMove = driverMoves(s.data, staffId, s.seedDay).find((m) => !day.missions.some((x) => x.moveId === m.id && x.step >= MISSION_DONE))
          const mission = day.missions.find((m) => m.step < MISSION_DONE) ?? (nextMove ? emptyMission(nextMove.id) : undefined)
          if (!mission) continue
          const move = s.data.moves.find((m) => m.id === mission.moveId)
          const client = s.data.customers.find((c) => c.id === move?.customerId)?.name ?? ''
          const next = advanceMissionDemo(mission, client, new Date().toISOString())
          get().field(next.step === MISSION_DONE ? 'signature' : 'step', (days) =>
            days.map((d) =>
              d.id === day.id
                ? { ...d, missions: d.missions.some((m) => m.moveId === next.moveId) ? d.missions.map((m) => (m.moveId === next.moveId ? next : m)) : [...d.missions, next] }
                : d,
            ),
          )
          return s.data.staff.find((p) => p.id === staffId)?.firstName ?? ''
        }
        return null
      },
      validateDay: (id) =>
        set((s) => {
          const day = s.data.days.find((d) => d.id === id)
          return day ? { data: applyValidation(s.data, day, new Date().toISOString()) } : {}
        }),
      correctDay: (id, fieldName, from, to) =>
        set((s) => ({
          data: {
            ...s.data,
            days: s.data.days.map((d) =>
              d.id !== id
                ? d
                : {
                    ...d,
                    endKm: fieldName === 'km' && d.check ? d.check.km + Math.max(0, Math.round(to)) : d.endKm,
                    corrections: [...d.corrections, { field: fieldName, from, to: Math.max(0, to), at: new Date().toISOString() }],
                  },
            ),
          },
        })),
      openClaim: (id, moveId) => {
        const r = openClaimData(get().data, id, moveId, new Date().toISOString())
        set({ data: r.data })
        return r.claimId
      },
      setClaimStatus: (claimId, status) =>
        set((s) => ({ data: { ...s.data, claims: s.data.claims.map((c) => (c.id === claimId ? { ...c, status } : c)) } })),
      simulateLead: (channel, lang) => {
        const s = get()
        const n = s.data.leads.filter((l) => l.id.startsWith('lead-sim')).length
        const lead = simulateLead(channel, lang, n, s.seedDay)
        set({ data: { ...s.data, leads: [lead, ...s.data.leads] } })
        return lead.id
      },
      askAgent: ({ channel, name, phone, notes, lang }) => {
        const s = get()
        const lead: Lead = {
          id: `lead-g-${Date.now()}`, channel, lang, name: name.trim() || '—', phone, notes, origin: 'gerant',
          receivedAt: new Date().toISOString(), facts: parseNotes(notes, s.seedDay), added: {}, status: 'nouvelle',
        }
        set({ data: { ...s.data, leads: [lead, ...s.data.leads] } })
        return lead.id
      },
      processLead: (id) =>
        set((s) => {
          const lead = s.data.leads.find((l) => l.id === id)
          if (!lead || lead.status !== 'nouvelle') return {}
          const f = leadFacts(lead)
          const put = (data: DemoData, l: Lead) => ({ ...data, leads: data.leads.map((x) => (x.id === id ? l : x)) })
          if (f.special === 'coffre') return { data: put(s.data, { ...lead, status: 'atypique' }) }
          const created = upsertMoveFromLead(s.data, lead, s.seedDay)
          const missing = missingFields(f)
          const replyAt = new Date(new Date(lead.receivedAt).getTime() + 2 * 60_000).toISOString()
          const next: Lead =
            lead.origin === 'gerant'
              ? { ...lead, moveId: created.moveId, status: missing.length ? 'rappel' : 'complete', callback: missing.length ? { questions: missing } : undefined }
              : { ...lead, moveId: created.moveId, status: missing.length ? 'attenteClient' : 'complete', replyAt }
          return { data: put(created.data, next) }
        }),
      clientReply: (id) =>
        set((s) => {
          const lead = s.data.leads.find((l) => l.id === id)
          if (!lead || lead.status !== 'attenteClient') return {}
          const next: Lead = { ...lead, added: { ...lead.added, ...clientAnswers(lead) }, clientReplyAt: new Date().toISOString(), status: 'complete' }
          const created = upsertMoveFromLead(s.data, next, s.seedDay)
          return { data: { ...created.data, leads: created.data.leads.map((x) => (x.id === id ? next : x)) } }
        }),
      completeCallback: (id, answers) =>
        set((s) => {
          const lead = s.data.leads.find((l) => l.id === id)
          if (!lead || lead.status !== 'rappel') return {}
          const added = { ...lead.added, ...answers }
          const missing = missingFields({ ...lead.facts, ...added })
          const next: Lead = {
            ...lead, added, status: missing.length ? 'rappel' : 'complete',
            callback: { questions: missing.length ? missing : (lead.callback?.questions ?? []), doneAt: missing.length ? undefined : new Date().toISOString() },
          }
          const created = upsertMoveFromLead(s.data, next, s.seedDay)
          const move = created.data.moves.find((m) => m.id === created.moveId)
          const withQuote = next.status === 'complete' && move ? { ...next, quote: prepareQuote(next, move, s.data.settings.pricing) } : next
          return { data: { ...created.data, leads: created.data.leads.map((x) => (x.id === id ? withQuote : x)) } }
        }),
      requestPhotos: (id) => set((s) => ({ data: patchLead(s.data, id, (l) => ({ ...l, photosRequestedAt: new Date().toISOString() })) })),
      clientSendPhotos: (id, mode) =>
        set((s) => {
          const photos = DEMO_CLIENT_PHOTOS[mode]
          return {
            data: patchLead(s.data, id, (l) => ({
              ...l, photos, photosAt: new Date().toISOString(), inventory: inventoryFromPhotos(photos), confidence: confidenceFor(photos), volumeValidatedAt: undefined,
            })),
          }
        }),
      setInventoryQty: (id, lineId, qty) =>
        set((s) => ({
          data: patchLead(s.data, id, (l) => ({
            ...l,
            inventory: (l.inventory ?? []).map((x) => (x.id === lineId ? { ...x, qty: Math.min(99, Math.max(0, Math.round(Number.isFinite(qty) ? qty : 0))) } : x)),
          })),
        })),
      validateVolume: (id) =>
        set((s) => {
          const lead = s.data.leads.find((l) => l.id === id)
          if (!lead?.inventory) return {}
          const next = { ...lead, volumeValidatedAt: new Date().toISOString(), added: { ...lead.added, volume: Math.max(1, Math.round(inventoryTotal(lead.inventory))) } }
          const created = upsertMoveFromLead(s.data, next, s.seedDay)
          return { data: patchLead(created.data, id, () => next) }
        }),
      proposeVisit: (id) =>
        set((s) => {
          const lead = s.data.leads.find((l) => l.id === id)
          if (!lead?.moveId) return {}
          return { data: { ...s.data, moves: s.data.moves.map((m) => (m.id === lead.moveId ? { ...m, status: 'visite' as const, visitOn: addDays(s.seedDay, 2) } : m)) } }
        }),
      prepareQuote: (id) =>
        set((s) => {
          const lead = s.data.leads.find((l) => l.id === id)
          const move = s.data.moves.find((m) => m.id === lead?.moveId)
          if (!lead || !move || lead.quote?.sentAt) return {}
          return { data: patchLead(s.data, id, (l) => ({ ...l, quote: prepareQuote(l, move, s.data.settings.pricing) })) }
        }),
      setQuoteLine: (id, lineId, patch) =>
        set((s) => ({ data: patchLead(s.data, id, (l) => (l.quote && !l.quote.sentAt ? { ...l, quote: patchLine(l.quote, lineId, patch) } : l)) })),
      sendQuote: (id) => {
        const s = get()
        const lead = s.data.leads.find((l) => l.id === id)
        if (!lead?.quote || lead.quote.sentAt) return false
        const q = { ...lead.quote, sentAt: new Date().toISOString() }
        const data = patchLead(s.data, id, (l) => ({ ...l, quote: q }))
        set({
          data: {
            ...data,
            moves: data.moves.map((m) =>
              m.id === lead.moveId
                ? { ...m, status: 'devisEnvoye' as const, quoteSentOn: s.seedDay, priceCents: quoteTotal(q), depositCents: quoteDeposit(q), options: optionsOf(q) }
                : m,
            ),
          },
        })
        return true
      },
      signQuote: (id, name, image) =>
        set((s) => {
          const lead = s.data.leads.find((l) => l.id === id)
          if (!lead?.quote?.sentAt || lead.quote.signedAt) return {}
          const data = patchLead(s.data, id, (l) => ({ ...l, quote: { ...l.quote!, signedAt: new Date().toISOString(), signature: { name, image } } }))
          return { data: { ...data, moves: data.moves.map((m) => (m.id === lead.moveId ? { ...m, status: 'devisSigne' as const, signedOn: s.seedDay } : m)) } }
        }),
      resolveAlert: (alert) => {
        if (alert.kind === 'conflict') return alert.conflict ? get().resolveConflict(alert.conflict) : false
        if (alert.kind === 'damage') return !!(alert.dayId && alert.moveId && get().openClaim(alert.dayId, alert.moveId))
        set((s) => ({ data: fixAlert(s.data, alert, s.seedDay) }))
        return true
      },
      assignMove: (moveId, plan) => set((s) => ({ data: assignMoveData(s.data, moveId, plan) })),
      addAbsence: (absence) =>
        set((s) => {
          // Identifiant unique : le plus grand numéro existant + 1 (jamais réutilisé après une suppression)
          const max = s.data.absences.reduce((n, a) => Math.max(n, Number(/^ab-(\d+)/.exec(a.id)?.[1] ?? 0)), 0)
          const id = `ab-${max + 1}`
          const from = absence.from <= absence.to ? absence.from : absence.to
          const to = absence.from <= absence.to ? absence.to : absence.from
          return { data: { ...s.data, absences: [...s.data.absences, { ...absence, from, to, id }] } }
        }),
      removeAbsence: (id) => set((s) => ({ data: { ...s.data, absences: s.data.absences.filter((a) => a.id !== id) } })),
      resolveConflict: (conflict) => {
        const fresh = detectConflicts(get().data).find((c) => c.id === conflict.id)
        if (!fresh?.fix) return false
        set((s) => ({ data: applyFix(s.data, fresh) }))
        return true
      },
      updateSettings: (patch) => set((s) => ({ data: { ...s.data, settings: sanitize({ ...s.data.settings, ...patch }) } })),
      publishPlanning: (staffIds) => set((s) => ({ data: { ...s.data, published: { at: new Date().toISOString(), staffIds } } })),
      resetDemo: () => set(fresh()),
    }),
    {
      name: STORAGE_KEY,
      // À augmenter dès que la forme des données change : les anciennes sauvegardes sont alors ignorées.
      version: SCHEMA_VERSION,
      storage: createJSONStorage(() => safeStorage),
      partialize: (s) => ({ seedDay: s.seedDay, data: s.data, phoneDays: s.phoneDays, session: s.session, online: s.online, queue: s.queue }),
      merge: (persisted, current) => {
        const p = persisted as Partial<DemoState> | undefined
        if (!p || p.seedDay !== todayISO() || !isValidData(p.data) || !Array.isArray(p.phoneDays)) return current
        return { ...current, seedDay: p.seedDay, data: p.data, phoneDays: p.phoneDays, session: p.session ?? null, online: p.online ?? true, queue: p.queue ?? [] }
      },
      migrate: () => fresh(),
    },
  ),
)

/** Remplace une demande par sa version modifiée. */
function patchLead(data: DemoData, id: string, fn: (l: Lead) => Lead): DemoData {
  return { ...data, leads: data.leads.map((l) => (l.id === id ? fn(l) : l)) }
}

/** Vérifie que la sauvegarde a bien toutes les listes attendues (sinon : données de départ). */
function isValidData(d: unknown): d is DemoData {
  const x = d as Partial<DemoData> | undefined
  return (
    !!x &&
    typeof x.company === 'object' &&
    typeof x.settings === 'object' &&
    Array.isArray(x.absences) &&
    Array.isArray(x.days) &&
    Array.isArray(x.claims) &&
    Array.isArray(x.leads) &&
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
