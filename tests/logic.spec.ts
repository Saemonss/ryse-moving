/*
 * Logique métier testée sans navigateur (rapide) : conflits, solutions sûres, kilomètres recalculés.
 */
import { expect, test } from '@playwright/test'
import { createSeed } from '../src/data/seed'
import { addDays } from '../src/data/dates'
import { applyFix, detectConflicts } from '../src/data/conflicts'
import { assignMoveData } from '../src/data/planning'
import type { DemoData } from '../src/data/types'

const concerning = (d: DemoData, moveId: string) => detectConflicts(d).filter((c) => c.moveId === moveId || c.otherMoveId === moveId)

test('Deux chantiers monte-meubles le même jour → location proposée, puis plus aucun conflit', () => {
  const d0 = createSeed('2026-11-04')
  const lift = d0.moves.find((m) => m.liftUsed && m.status === 'planifie')!
  const other = d0.moves.find((m) => m.status === 'planifie' && m.id !== lift.id && m.date !== lift.date && m.crewId !== lift.crewId)!
  const data: DemoData = {
    ...d0,
    moves: d0.moves.map((m) => (m.id === other.id ? { ...m, date: lift.date, liftUsed: true, vehicleIds: [...m.vehicleIds, 'v-7'] } : m)),
  }
  const c = detectConflicts(data).find((x) => x.kind === 'vehicleDouble' && x.vehicleId === 'v-7')
  expect(c?.fix?.type).toBe('rentLift')
  const fixed = applyFix(data, c!)
  expect(concerning(fixed, c!.moveId).filter((x) => x.vehicleId === 'v-7')).toEqual([])
  expect(fixed.moves.find((m) => m.id === c!.moveId)?.extraCosts?.[0]?.cents).toBeGreaterThan(0)
})

test('Aucune solution proposée ne crée de nouveau conflit (7 jours × absences possibles)', () => {
  for (let i = 0; i < 7; i++) {
    const today = addDays('2026-11-02', i)
    const base = createSeed(today)
    const field = base.staff.filter((s) => ['chefEquipe', 'chauffeur', 'demenageur'].includes(s.role))
    for (const person of field) {
      for (let k = 0; k < 5; k++) {
        const data: DemoData = { ...base, absences: [...base.absences, { id: 'x', staffId: person.id, kind: 'maladie', from: addDays(today, k), to: addDays(today, k) }] }
        for (const c of detectConflicts(data)) {
          if (!c.fix) continue
          const before = new Set(concerning(data, c.moveId).map((x) => x.id))
          const after = concerning(applyFix(data, c), c.moveId)
          expect(after.every((x) => before.has(x.id)), `${today} ${person.id} ${c.id} → ${c.fix.type}`).toBe(true)
          expect(after.length).toBeLessThan(before.size)
        }
      }
    }
  }
})

test("Changer d'équipe (autre agence) recalcule kilomètres et durée", () => {
  const data = createSeed('2026-11-04')
  const move = data.moves.find((m) => m.status === 'devisSigne' && m.from.country === 'BE')!
  const next = assignMoveData(data, move.id, { date: addDays('2026-11-04', 3), crewId: 't-l', vehicleId: 'v-8' })
  const after = next.moves.find((m) => m.id === move.id)!
  expect(after.distanceKm).not.toBe(move.distanceKm)
  expect(after.plannedHours).toBeGreaterThan(0)
})
