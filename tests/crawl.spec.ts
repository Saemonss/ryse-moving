/*
 * Vérification « zéro bouton mort ».
 * Pour chaque écran et chaque langue : on clique chaque bouton, lien, onglet et champ visible
 * (et aussi ceux des fenêtres et menus qu'ils ouvrent), en repartant à chaque fois d'une page neuve,
 * et on exige un effet visible : changement d'écran, fenêtre, menu, message, texte ou donnée.
 * Un élément déjà actif (onglet sélectionné, page en cours, langue choisie) est accepté s'il est marqué comme tel.
 */
import type { Locator, Page } from '@playwright/test'
import { LANGS, VIEWS, expect, openFresh, test } from './fixtures'

const SCREENS = [
  ...VIEWS,
  'gerant/demenagements',
  'gerant/dossier/m-13',
  'gerant/planning',
  'gerant/equipe',
  'gerant/flotte',
  'gerant/rentabilite',
  'gerant/parametres',
  'planificateur/absences',
  'planificateur/a-planifier',
  'charte',
] as const
const CLICKABLE = 'button, a[href], [role="tab"], input, textarea, select'
const MAX_DEPTH = 3

/** Zone où chercher les éléments : la fenêtre ou le menu ouvert le plus récent, sinon toute la page. */
async function scope(page: Page): Promise<Locator> {
  const dialog = page.locator('dialog[open]')
  if (await dialog.count()) return dialog.last()
  const pop = page.locator('[data-popover]')
  if (await pop.count()) return pop.last()
  return page.locator('body')
}

async function targets(page: Page): Promise<Locator[]> {
  const root = await scope(page)
  const all = await root.locator(CLICKABLE).all()
  const visible: Locator[] = []
  // Listes répétitives (lignes de tableau, blocs du planning) : on teste les 3 premiers éléments seulement.
  let sampled = 0
  for (const el of all) {
    if (!(await el.isVisible())) continue
    const repeated = await el.evaluate((e) => !!e.closest('[data-crawl-sample]'))
    if (repeated && ++sampled > 3) continue
    visible.push(el)
  }
  return visible
}

async function signature(page: Page) {
  return page.evaluate(() => {
    const phoneClock = document.querySelector('[data-phone] .tabular')
    const text = document.body.innerText.replace(phoneClock?.textContent ?? '\u0000', '')
    return JSON.stringify({
      hash: location.hash,
      text,
      dialogs: document.querySelectorAll('dialog[open]').length,
      popovers: document.querySelectorAll('[data-popover]').length,
      toasts: document.querySelectorAll('[data-toast]').length,
      data: localStorage.getItem('ryse-moving-demo'),
      lang: document.documentElement.lang,
      // Un champ <input> doit produire un effet ailleurs (ex. résultats filtrés) : sa propre valeur ne compte pas.
      // Une zone de texte libre (<textarea>, ex. brouillon de relance) est acceptée si elle se remplit.
      values: [...document.querySelectorAll('textarea, select')].map((e) => (e as HTMLTextAreaElement).value).join('|'),
    })
  })
}

/** Identité de la fenêtre ou du menu ouvert (vide s'il n'y en a pas). */
const overlayKey = (page: Page) =>
  page.evaluate(() => {
    const list = document.querySelectorAll('dialog[open], [data-popover]')
    const last = list[list.length - 1] as HTMLElement | undefined
    return last ? `${list.length}:${last.innerText.slice(0, 60)}` : ''
  })

async function describe(el: Locator) {
  const label = (await el.getAttribute('aria-label')) ?? (await el.innerText().catch(() => '')) ?? ''
  const tag = await el.evaluate((e) => e.tagName.toLowerCase())
  return `${tag} « ${label.replace(/\s+/g, ' ').trim().slice(0, 60) || '(sans texte)'} »`
}

async function isMarkedActive(el: Locator) {
  return el.evaluate(
    (e) => e.getAttribute('aria-current') === 'page' || e.getAttribute('aria-pressed') === 'true' || e.getAttribute('aria-selected') === 'true',
  )
}

async function act(el: Locator) {
  const tag = await el.evaluate((e) => e.tagName.toLowerCase())
  const numeric = (await el.getAttribute('inputmode')) === 'decimal'
  if (numeric) await el.fill('12')
  else if (tag === 'input' || tag === 'textarea') await el.fill(`${(await el.inputValue()) || ''}Ka`)
  else if (tag === 'select') {
    // Choisir une autre option que celle en cours
    const next = await el.evaluate((s) => {
      const sel = s as HTMLSelectElement
      return sel.options[(sel.selectedIndex + 1) % sel.options.length]?.value ?? ''
    })
    await el.selectOption(next)
  } else await el.click()
}

/** Rejoue un chemin de clics depuis une page neuve ; renvoie l'élément final. */
async function replay(page: Page, screen: string, lang: 'fr' | 'nl', path: number[]) {
  await openFresh(page, screen, lang)
  for (let d = 0; d < path.length; d++) {
    const list = await targets(page)
    const el = list[path[d]!]
    if (!el) return null
    if (d === path.length - 1) return el
    await act(el)
    await page.waitForTimeout(250)
    if (await page.locator('[role="status"]').filter({ hasText: /…/ }).count()) await page.waitForTimeout(2100)
  }
  return null
}

for (const lang of LANGS) {
  for (const screen of SCREENS) {
    test(`${lang.toUpperCase()} · ${screen}`, async ({ page }, info) => {
      const failures: string[] = []
      let checked = 0
      const queue: number[][] = []
      await openFresh(page, screen, lang)
      const roots = await targets(page)
      roots.forEach((_, i) => queue.push([i]))

      while (queue.length) {
        const path = queue.shift()!
        const el = await replay(page, screen, lang, path)
        if (!el) {
          failures.push(`élément introuvable au rejeu (${path.join('>')})`)
          continue
        }
        const name = `${path.length > 1 ? '↳ ' : ''}${await describe(el)}`
        checked++
        if (await el.isDisabled().catch(() => false)) {
          failures.push(`${name} : désactivé (bouton mort)`)
          continue
        }
        if (await isMarkedActive(el)) continue

        const before = await signature(page)
        const overlayBefore = await overlayKey(page)
        await act(el)
        await page.waitForTimeout(300)
        const after = await signature(page)
        if (before === after) {
          failures.push(`${name} : aucun effet visible`)
          continue
        }
        // Une fenêtre ou un menu s'est ouvert : on teste aussi ce qu'il contient.
        const overlayAfter = await overlayKey(page)
        if (overlayAfter && overlayAfter !== overlayBefore && path.length < MAX_DEPTH) {
          if (await page.locator('dialog[open] [role="status"]').count()) await page.waitForTimeout(2100)
          const inner = await targets(page)
          inner.forEach((_, j) => queue.push([...path, j]))
        }
      }

      info.annotations.push({ type: 'checked', description: String(checked) })
      for (const f of failures) info.annotations.push({ type: 'failure', description: f })
      expect(failures, `Éléments sans effet sur ${screen} (${lang})`).toEqual([])
    })
  }
}
