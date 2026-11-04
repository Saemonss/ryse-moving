/*
 * Garde-fous communs à tous les tests :
 * - toute requête vers un autre site que la démo locale est bloquée ET fait échouer le test ;
 * - toute erreur ou tout avertissement dans la console du navigateur fait échouer le test.
 */
import { test as base, expect, type Page } from '@playwright/test'

export const VIEWS = ['gerant', 'planificateur', 'chauffeur', 'commercial', 'client', 'comptabilite'] as const
export const LANGS = ['fr', 'nl'] as const

interface Guard {
  problems: string[]
}

export const test = base.extend<{ guard: Guard }>({
  guard: [
    async ({ page, context }, use) => {
      const guard: Guard = { problems: [] }
      await context.route('**/*', (route) => {
        const url = new URL(route.request().url())
        if (['localhost', '127.0.0.1'].includes(url.hostname) || url.protocol === 'data:') return route.continue()
        guard.problems.push(`Requête externe bloquée : ${url.href}`)
        return route.abort()
      })
      page.on('console', (m) => {
        if (m.type() === 'error' || m.type() === 'warning') guard.problems.push(`Console (${m.type()}) : ${m.text().slice(0, 200)}`)
      })
      page.on('pageerror', (e) => guard.problems.push(`Erreur JavaScript : ${e.message}`))
      await use(guard)
      expect(guard.problems, 'Console propre et aucune requête externe').toEqual([])
    },
    { auto: true },
  ],
})

export { expect }

/** Ouvre une vue avec des données de départ neuves, dans la langue voulue. */
export async function openFresh(page: Page, route: string, lang: 'fr' | 'nl') {
  await page.goto('/')
  await page.evaluate((l) => {
    localStorage.clear()
    localStorage.setItem('ryse-moving-lang', JSON.stringify({ state: { lang: l }, version: 0 }))
  }, lang)
  await page.goto(`/#/${route}`)
  await page.reload()
  await page.locator('main').waitFor()
}

export async function demoData(page: Page) {
  return page.evaluate(() => JSON.parse(localStorage.getItem('ryse-moving-demo') ?? 'null')?.state?.data ?? null)
}
