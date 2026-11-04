/*
 * Parcours complet de l'étape 1 (le fil rouge s'allongera à chaque étape) :
 * le gérant règle toutes les alertes, Karim commence sa journée, puis on réinitialise la démo
 * et on vérifie que tout revient exactement à l'état de départ.
 */
import { demoData, expect, openFresh, test } from './fixtures'

test('Parcours : alertes réglées, journée commencée, puis réinitialisation', async ({ page }) => {
  await openFresh(page, 'gerant', 'fr')

  // État de départ de référence (une réinitialisation écrit les données de départ dans le navigateur)
  await page.keyboard.press('Control+Shift+R')
  await page.getByRole('button', { name: 'Réinitialiser', exact: true }).click()
  await expect(page.getByText('Démo réinitialisée')).toBeVisible()
  const start = await demoData(page)
  expect(start?.moves?.length).toBeGreaterThan(25)

  // 1. Le gérant règle les 5 alertes, une par une
  const alertActions = page.locator('main section').filter({ hasText: 'Alertes' }).getByRole('button')
  await expect(alertActions).toHaveCount(5)
  for (let i = 5; i > 0; i--) {
    await alertActions.first().click()
    const dialog = page.locator('dialog[open]')
    const apply = dialog.locator('footer button').last()
    await expect(apply).not.toHaveText('Annuler', { timeout: 4000 })
    await apply.click()
    await expect(page.locator('[data-toast]').last()).toBeVisible()
    await expect(alertActions).toHaveCount(i - 1)
  }
  await expect(page.getByText('Tout est en ordre : aucune alerte.')).toBeVisible()

  // 2. Karim commence sa journée (raccourci 3 = vue Chauffeur)
  await page.keyboard.press('3')
  await expect(page).toHaveURL(/#\/chauffeur$/)
  await page.getByRole('button', { name: 'Commencer ma journée' }).click()
  await expect(page.getByText(/Journée commencée à/).first()).toBeVisible()
  await expect(page.getByText(/Maintenant : En route vers le chargement/)).toBeVisible()
  expect(await demoData(page)).not.toEqual(start)

  // 3. Réinitialisation par le menu présentateur → retour exact à l'état de départ
  await page.getByRole('button', { name: 'Menu présentateur' }).click()
  await page.getByRole('button', { name: 'Réinitialiser la démo' }).click()
  await page.getByRole('button', { name: 'Réinitialiser', exact: true }).click()
  await expect(page.getByRole('button', { name: 'Commencer ma journée' })).toBeVisible()
  expect(await demoData(page)).toEqual(start)
  await page.keyboard.press('1')
  await expect(alertActions).toHaveCount(5)
})
