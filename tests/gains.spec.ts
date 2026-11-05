/*
 * Étape 4 · lot 7 : calculateur de gain. Formule vérifiée à la main, valeurs vides ou énormes bornées,
 * agents inactifs exclus, mention « estimation » toujours visible.
 */
import { expect, openFresh, test } from './fixtures'
import { presenter } from './driver'

test('Calculateur : formule, valeurs bornées, agents inactifs exclus, valeurs de départ', async ({ page }) => {
  test.setTimeout(60_000)
  await openFresh(page, 'commercial', 'fr')
  await page.evaluate(() => localStorage.removeItem('ryse-moving-gains'))
  await page.reload()

  // Accessible depuis le menu du présentateur
  await presenter(page, 'gains')
  await expect(page).toHaveURL(/#\/commercial\/gains/)
  await expect(page.getByText('Estimation basée sur vos chiffres et nos hypothèses, à affiner ensemble.')).toBeVisible()

  // 25×10 + 15×15 + 15×20 + 15×5 + (40×12/52)×3 + 5×15 = 952,7 min = 15,9 h ; × 35 € = 556 € / semaine
  const main = page.locator('main')
  await expect(main).toContainText('15,9 h gagnées par semaine')
  await expect(main).toContainText('556')

  // + 25 demandes × 10 min = + 4,2 h → 1202,7 min
  await page.getByLabel('Demandes reçues par semaine').fill('50')
  await expect(main).toContainText('20 h gagnées par semaine')

  // Champ vidé puis valeur énorme : jamais de NaN, plafonné aux heures de bureau
  await page.getByLabel('Demandes reçues par semaine').fill('')
  await expect(main).not.toContainText('NaN')
  await page.getByLabel('Demandes reçues par semaine').fill('99999999')
  await expect(main).toContainText('Plafonné à vos heures de bureau déclarées.')
  await expect(main).toContainText('60 h gagnées par semaine')
  await expect(main).not.toContainText('NaN')

  // Valeurs de départ
  await page.getByRole('button', { name: 'Valeurs de départ' }).click()
  await expect(main).toContainText('15,9 h gagnées par semaine')

  // Un agent coupé disparaît du détail et du total
  await page.goto('/#/commercial/agents')
  await page.getByRole('switch', { name: /Accueil des demandes/ }).click()
  await page.getByRole('button', { name: 'Estimer les gains' }).click()
  await expect(page).toHaveURL(/#\/commercial\/gains/)
  await expect(page.locator('main table')).not.toContainText('Accueil des demandes')
  await expect(main).toContainText('11,7 h gagnées par semaine')
})
