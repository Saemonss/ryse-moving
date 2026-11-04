/*
 * Parcours complet (le fil rouge s'allonge à chaque étape) :
 * 1. le gérant règle ses alertes ; 2. le planificateur affecte un dossier au clic ;
 * 3. une absence crée un conflit, résolu en un clic ; 4. un paramètre modifié recalcule la marge ;
 * 5. Karim commence sa journée ; 6. réinitialisation → retour exact à l'état de départ.
 */
import { demoData, expect, openFresh, test } from './fixtures'

test('Parcours : alertes, affectation, absence et conflit, paramètre, journée chauffeur, puis réinitialisation', async ({ page }) => {
  await openFresh(page, 'gerant', 'fr')

  // État de départ de référence (une réinitialisation écrit les données de départ dans le navigateur)
  await page.keyboard.press('Control+Shift+R')
  await page.getByRole('button', { name: 'Réinitialiser', exact: true }).click()
  await expect(page.getByText('Démo réinitialisée')).toBeVisible()
  const start = await demoData(page)
  expect(start?.moves?.length).toBeGreaterThan(25)

  // 1. Le gérant règle les 5 alertes qui ont une solution ; « Marge faible » mène à la Rentabilité
  const alertActions = page.locator('main section').filter({ hasText: 'Alertes' }).getByRole('button')
  await expect(alertActions).toHaveCount(6)
  for (let i = 6; i > 1; i--) {
    await alertActions.first().click()
    const apply = page.locator('dialog[open] footer button').nth(1)
    await expect(apply).toBeVisible({ timeout: 4000 })
    await apply.click()
    await expect(page.locator('[data-toast]').last()).toBeVisible()
    await expect(alertActions).toHaveCount(i - 1)
  }
  await alertActions.first().click()
  await expect(page).toHaveURL(/#\/gerant\/rentabilite$/)

  // 2. Le planificateur affecte un dossier par clic (sans glisser-déposer)
  await page.goto('/#/planificateur/a-planifier')
  const toPlan = page.locator('main tbody tr')
  const before = await toPlan.count()
  await page.getByRole('button', { name: 'Affecter' }).first().click()
  await page.locator('dialog[open]').getByRole('button', { name: 'Affecter', exact: true }).click()
  await expect(page.getByText(/Dossier affecté à Équipe/)).toBeVisible()
  await expect(toPlan).toHaveCount(before - 1)

  // 3. Une absence de Karim aujourd'hui crée un conflit… résolu en un clic dans le planning
  await page.goto('/#/planificateur/absences')
  await page.getByLabel('Personne').selectOption({ label: 'Karim Benali' })
  await page.getByRole('button', { name: 'Ajouter' }).click()
  await expect(page.getByText(/Déménagements touchés par une absence : 1/)).toBeVisible()
  await page.getByRole('link', { name: 'Résoudre dans le planning' }).click()
  const conflict = page.locator('main li').filter({ hasText: 'Absence de Karim Benali' })
  await expect(conflict).toBeVisible()
  await conflict.getByRole('button', { name: 'Résoudre' }).click()
  await expect(conflict).toHaveCount(0)

  // 4. Un paramètre modifié recalcule immédiatement la marge
  await page.goto('/#/gerant/parametres')
  const preview = page.getByTestId('settings-preview')
  const marginBefore = await preview.innerText()
  await page.getByLabel("Coût horaire chargé d'un déménageur").fill('45')
  await expect(preview).not.toHaveText(marginBefore)
  await page.goto('/#/gerant/dossier/m-13')
  await expect(page.getByText(/^−\s2\s565,00\s€$/)).toBeVisible() // main-d'œuvre : 19 h × 3 pers. × 45 €

  // 5. Karim n'est plus prévu aujourd'hui (remplacé) : on rétablit d'abord la démo pour jouer sa journée
  await page.keyboard.press('Control+Shift+R')
  await page.getByRole('button', { name: 'Réinitialiser', exact: true }).click()
  await page.keyboard.press('3')
  await expect(page).toHaveURL(/#\/chauffeur$/)
  await page.getByRole('button', { name: 'Commencer ma journée' }).click()
  await expect(page.getByText(/Journée commencée à/).first()).toBeVisible()
  expect(await demoData(page)).not.toEqual(start)

  // 6. Réinitialisation par le menu présentateur → retour exact à l'état de départ
  await page.getByRole('button', { name: 'Menu présentateur' }).click()
  await page.getByRole('button', { name: 'Réinitialiser la démo' }).click()
  await page.getByRole('button', { name: 'Réinitialiser', exact: true }).click()
  await expect(page.getByRole('button', { name: 'Commencer ma journée' })).toBeVisible()
  expect(await demoData(page)).toEqual(start)
  await page.keyboard.press('1')
  await expect(alertActions).toHaveCount(6)
})
