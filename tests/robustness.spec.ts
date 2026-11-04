/*
 * Robustesse : situations qui ne doivent jamais casser la démo en rendez-vous.
 */
import { expect, openFresh, test } from './fixtures'
import { login } from './driver'

test('Données sauvegardées un autre jour → données de départ du jour', async ({ page }) => {
  await openFresh(page, 'gerant', 'fr')
  await page.evaluate(() =>
    localStorage.setItem('ryse-moving-demo', JSON.stringify({ state: { seedDay: '2000-01-01', data: { moves: [] } }, version: 1 })),
  )
  await page.reload()
  await expect(page.locator('main [role="progressbar"]')).toHaveCount(3)
})

test('Sauvegarde illisible → la démo démarre quand même', async ({ page }) => {
  await openFresh(page, 'gerant', 'fr')
  await page.evaluate(() => localStorage.setItem('ryse-moving-demo', '{pas du json'))
  await page.reload()
  await expect(page.getByRole('heading', { name: /Bonjour Nathalie/ })).toBeVisible()
})

test('Adresse inconnue → vue Gérant', async ({ page }) => {
  await openFresh(page, 'xyz', 'fr')
  await expect(page).toHaveURL(/#\/gerant$/)
  await expect(page.getByRole('heading', { name: /Bonjour Nathalie/ })).toBeVisible()
})

test('Raccourcis 1 à 6, L et Ctrl+Maj+R', async ({ page }) => {
  await openFresh(page, 'gerant', 'fr')
  const expected = ['gerant', 'planificateur', 'chauffeur', 'commercial', 'client', 'comptabilite']
  for (const [i, view] of expected.entries()) {
    await page.keyboard.press(String(i + 1))
    await expect(page).toHaveURL(new RegExp(`#/${view}$`))
  }
  await page.keyboard.press('l')
  await expect(page.locator('html')).toHaveAttribute('lang', 'nl-BE')
  await page.keyboard.press('L')
  await expect(page.locator('html')).toHaveAttribute('lang', 'fr-BE')
  await page.keyboard.press('Control+Shift+R')
  await expect(page.locator('dialog[open]')).toContainText('Réinitialiser la démo ?')
  await page.keyboard.press('Escape')
  await expect(page.locator('dialog[open]')).toHaveCount(0)
})

test('Raccourcis ignorés pendant la saisie dans un champ', async ({ page }) => {
  await openFresh(page, 'charte', 'fr')
  const field = page.getByLabel('Rechercher un client')
  await field.click()
  await page.keyboard.type('3l')
  await expect(page).toHaveURL(/#\/charte$/)
  await expect(page.locator('html')).toHaveAttribute('lang', 'fr-BE')
  await expect(field).toHaveValue('3l')
})

for (const lang of ['fr', 'nl'] as const) {
  test(`Cadre téléphone ${lang.toUpperCase()} : gros bouton, texte lisible, rien ne déborde`, async ({ page }) => {
    await openFresh(page, 'chauffeur', lang)
    const phone = page.locator('[data-phone]')
    await expect(phone).toBeVisible()
    const button = phone.getByRole('button').last()
    const box = await button.boundingBox()
    expect(box?.height ?? 0).toBeGreaterThanOrEqual(56)
    const overflow = await phone.evaluate((el) => [...el.querySelectorAll('*')].filter((e) => e.scrollWidth > e.clientWidth + 1 && getComputedStyle(e).overflowX !== 'visible').length)
    expect(overflow).toBe(0)
    const small = await phone.evaluate((el) =>
      [...el.querySelectorAll('h1, p, li, button, dd, dt')].filter((e) => parseFloat(getComputedStyle(e).fontSize) < 15).map((e) => e.textContent),
    )
    expect(small).toEqual([])
  })
}

for (const view of ['gerant', 'gerant/demenagements', 'gerant/dossier/m-13', 'gerant/planning', 'gerant/equipe', 'gerant/flotte', 'gerant/rentabilite', 'gerant/parametres', 'planificateur', 'planificateur/absences', 'planificateur/a-planifier', 'commercial', 'comptabilite']) {
  test(`Néerlandais sur un écran de 1280 px (${view}) : rien ne déborde`, async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 })
    await openFresh(page, view, 'nl')
    const overflowing = await page.evaluate(() =>
      // Texte volontairement tronqué par « … » : accepté (le texte complet est dans l'infobulle)
      [...document.querySelectorAll('header, main *')].filter((e) => {
        const st = getComputedStyle(e)
        return e.scrollWidth > e.clientWidth + 1 && st.overflowX !== 'visible' && st.textOverflow !== 'ellipsis'
      }).length,
    )
    expect(overflowing).toBe(0)
  })
}

// Les données dépendent du jour : on rejoue la démo pour chacun des 7 jours de la semaine.
for (const [i, day] of ['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi', 'dimanche'].entries()) {
  test(`Un ${day} : 6 alertes, 5 réglables en un clic, et une mission pour Karim`, async ({ page }) => {
    await page.clock.setFixedTime(new Date(2026, 10, 2 + i, 9, 0)) // lundi 2 novembre 2026 + i jours
    await openFresh(page, 'gerant', 'fr')
    const actions = page.locator('main section').filter({ hasText: 'Alertes' }).getByRole('button')
    await expect(actions).toHaveCount(6)
    for (let n = 6; n > 1; n--) {
      await actions.first().click()
      const apply = page.locator('dialog[open] footer button').nth(1)
      await expect(apply).toBeVisible({ timeout: 4000 })
      await apply.click()
    if (!/#\/gerant$/.test(page.url())) await page.goto('/#/gerant') // le dégât ouvre le dossier litige
      await expect(actions).toHaveCount(n - 1)
    }
    await page.keyboard.press('3')
    await login(page)
    await expect(page.getByRole('button', { name: 'Commencer ma journée' })).toBeVisible()
  })
}
