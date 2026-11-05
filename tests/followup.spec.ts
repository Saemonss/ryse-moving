/*
 * Étape 4 · lot 5 : relance de devis rédigée par l'agent (langue du client, validation humaine, un seul envoi)
 * et litige préparé avec l'IA (réponse validée par le gérant), puis réinitialisation.
 */
import { demoData, expect, openFresh, test } from './fixtures'

test('Relance préparée par l’agent puis validée ; litige préparé avec l’IA ; réinitialisation', async ({ page }) => {
  test.setTimeout(90_000)
  await openFresh(page, 'gerant', 'fr')
  await page.keyboard.press('Control+Shift+R')
  await page.getByRole('button', { name: 'Réinitialiser', exact: true }).click()
  const start = await demoData(page)

  // Relance : le devis le plus ancien (client de Louvain → message en néerlandais), aucune remise
  await page.goto('/#/commercial/relances')
  const top = page.locator('main li').first()
  await expect(top).toContainText('À relancer aujourd’hui')
  const ref = (await top.innerText()).match(/RM-\d+-\d+/)![0]
  // la ligne relancée descend en bas de la liste : on la suit par sa référence
  const first = page.locator('main li').filter({ hasText: ref })
  await first.getByRole('button', { name: 'Préparer la relance' }).click()
  const draft = first.getByRole('textbox')
  await expect(draft).toHaveValue(/Goedendag/, { timeout: 5_000 })
  await expect(draft).not.toHaveValue(/korting|remise|%/)
  await first.getByRole('button', { name: 'Valider et envoyer' }).dblclick()
  await expect(first).toContainText('Relancé le')
  const reminded = (await demoData(page)).moves.filter((m: { quoteReminderOn?: string }) => m.quoteReminderOn)
  expect(reminded).toHaveLength(1)

  // Litige : ouvert depuis une journée à contrôler, puis préparé avec l'IA
  await page.goto('/#/gerant')
  await page.locator('main a[href*="/journee/"]').first().click()
  await page.locator('main button').filter({ hasText: /litige/ }).first().click()
  await page.getByRole('button', { name: 'Préparer avec l’IA' }).click()
  await expect(page.getByText('Résumé du cas')).toBeVisible({ timeout: 5_000 })
  await page.getByRole('button', { name: 'Valider et envoyer la réponse' }).click()
  await expect(page.getByText(/Réponse envoyée au client le/)).toBeVisible()
  const claim = (await demoData(page)).claims[0]
  expect(claim).toMatchObject({ status: 'enCours' })
  expect(claim.aiPreparedAt).toBeTruthy()
  expect(claim.replySentAt).toBeTruthy()
  await page.getByRole('button', { name: 'Copier le brouillon assurance' }).click()
  await expect(page.locator('[data-toast]').last()).toContainText('copié')

  // Réinitialisation → état de départ exact
  await page.keyboard.press('Control+Shift+R')
  await page.getByRole('button', { name: 'Réinitialiser', exact: true }).click()
  expect(await demoData(page)).toEqual(start)
})
