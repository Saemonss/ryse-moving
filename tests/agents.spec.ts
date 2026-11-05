/*
 * Étape 4 · lot 6 : page Agents IA (interrupteurs qui changent vraiment la démo) et résumé du soir du gérant.
 */
import { demoData, expect, openFresh, test } from './fixtures'
import { presenter } from './driver'

test('Interrupteurs des agents : effet réel (relances, accueil) ; résumé du soir cliquable ; réinitialisation', async ({ page }) => {
  test.setTimeout(90_000)
  await openFresh(page, 'gerant', 'fr')
  await page.keyboard.press('Control+Shift+R')
  await page.getByRole('button', { name: 'Réinitialiser', exact: true }).click()
  const start = await demoData(page)

  // Résumé du soir : 4 rubriques, une ligne mène à l'écran concerné
  await page.getByRole('button', { name: /Résumé du soir|résumé du soir est prêt/ }).click()
  const dialog = page.getByRole('dialog')
  await expect(dialog.getByText('Demain', { exact: true })).toBeVisible({ timeout: 5_000 })
  for (const s of ['Aujourd’hui', 'Marges', 'En attente']) await expect(dialog.getByText(s, { exact: true })).toBeVisible()
  await dialog.getByRole('button', { name: /Déménagements prévus demain/ }).click()
  await expect(page).toHaveURL(/#\/planificateur/)

  // Agents IA : couper l'agent de relance → plus de « Préparer la relance »
  await page.goto('/#/commercial/agents')
  const relances = page.getByRole('switch', { name: /Relances/ })
  await expect(relances).toHaveAttribute('aria-checked', 'true')
  await relances.click()
  await expect(relances).toHaveAttribute('aria-checked', 'false')
  await page.goto('/#/commercial/relances')
  await expect(page.getByText('Agent de relance inactif')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Préparer la relance' })).toHaveCount(0)

  // Couper l'agent d'accueil → une nouvelle demande attend ; l'humain peut lancer l'agent quand même
  await page.goto('/#/commercial/agents')
  await page.getByRole('switch', { name: /Accueil des demandes/ }).click()
  await presenter(page, 'lead')
  await page.getByRole('dialog').getByRole('button', { name: 'Faire arriver la demande' }).click()
  await expect(page.getByText('Agent d’accueil inactif')).toBeVisible()
  await page.waitForTimeout(1500)
  const leadId = decodeURIComponent(page.url().split('/').pop()!)
  expect((await demoData(page)).leads.find((l: { id: string }) => l.id === leadId).status).toBe('nouvelle')
  await page.getByRole('button', { name: 'Laisser l’agent la traiter' }).click()
  await expect(page.getByRole('button', { name: 'Simuler la réponse du client' })).toBeVisible({ timeout: 15_000 })

  // Réinitialisation → agents réactivés, état de départ exact
  await page.keyboard.press('Control+Shift+R')
  await page.getByRole('button', { name: 'Réinitialiser', exact: true }).click()
  expect(await demoData(page)).toEqual(start)
})
