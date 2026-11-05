/*
 * Parcours étape 4 : une demande WhatsApp en néerlandais → l'agent répond → le client répond → photos →
 * volume validé → devis préparé, modifié, envoyé (validation humaine) → PDF → signature du client →
 * le dossier arrive dans « Dossiers à planifier » → réinitialisation = retour exact à l'état de départ.
 */
import { demoData, expect, openFresh, test } from './fixtures'
import { big, phone, presenter, sign } from './driver'

test('Demande WhatsApp NL → devis validé → PDF → signature client → à planifier → réinitialisation', async ({ page }) => {
  test.setTimeout(120_000)
  await openFresh(page, 'gerant', 'fr')
  await page.keyboard.press('Control+Shift+R')
  await page.getByRole('button', { name: 'Réinitialiser', exact: true }).click()
  const start = await demoData(page)
  expect(start).not.toBeNull()

  // 1. Une nouvelle demande arrive (menu présentateur)
  await presenter(page, 'lead')
  const dialog = page.getByRole('dialog')
  await dialog.getByLabel('Canal').selectOption('whatsapp')
  await dialog.getByLabel('Langue du client').selectOption('nl')
  await dialog.getByRole('button', { name: 'Faire arriver la demande' }).click()
  await expect(page).toHaveURL(/#\/commercial\/demande\//)
  const leadId = decodeURIComponent(page.url().split('/').pop()!)

  // 2. L'agent traite la demande, répond au client dans sa langue ; le client répond
  await page.getByRole('button', { name: 'Simuler la réponse du client' }).click({ timeout: 15_000 })

  // 3. Photos → inventaire → volume validé par l'humain
  await page.getByRole('button', { name: 'Demander des photos au client' }).click()
  await page.getByRole('button', { name: 'Simuler l’envoi des photos' }).click()
  await page.getByRole('button', { name: 'Valider le volume' }).click({ timeout: 10_000 })

  // 4. Devis préparé par l'agent, une ligne modifiée, total recalculé
  await page.getByRole('button', { name: 'Préparer le devis' }).click()
  const send = page.getByRole('button', { name: 'Valider et envoyer au client' })
  await expect(send).toBeVisible({ timeout: 10_000 })
  const lead0 = (await demoData(page)).leads.find((l: { id: string }) => l.id === leadId)
  await page.getByLabel('Prix unitaire de « Déménagement (au m³) » en euros').fill('99')
  const lead1 = (await demoData(page)).leads.find((l: { id: string }) => l.id === leadId)
  expect(lead1.quote.lines[0].unitCents).toBe(9900)
  expect(lead1.quote.lines[0].unitCents).not.toBe(lead0.quote.lines[0].unitCents)

  // 5. Envoi : un double clic ne crée qu'un envoi
  await send.dblclick()
  await expect(page.getByRole('button', { name: 'Ouvrir le PDF' })).toBeVisible()
  const sentAt = (await demoData(page)).leads.find((l: { id: string }) => l.id === leadId).quote.sentAt
  expect(sentAt).toBeTruthy()

  // 6. Le PDF s'ouvre (généré sur le PC, aucune requête réseau)
  // (le navigateur de test télécharge les PDF au lieu de les afficher : on vérifie le fichier produit)
  await page.evaluate(() => {
    const orig = URL.createObjectURL.bind(URL)
    URL.createObjectURL = (b: Blob | MediaSource) => {
      if (b instanceof Blob) (window as unknown as { __pdf: Blob }).__pdf = b
      return orig(b)
    }
  })
  const [popup] = await Promise.all([page.waitForEvent('popup'), page.getByRole('button', { name: 'Ouvrir le PDF' }).click()])
  await popup.close()
  const pdf = await page.evaluate(async () => {
    const b = (window as unknown as { __pdf?: Blob }).__pdf
    return b ? { type: b.type, size: b.size, head: await b.slice(0, 5).text() } : null
  })
  expect(pdf).toMatchObject({ type: 'application/pdf', head: '%PDF-' })
  expect(pdf!.size).toBeGreaterThan(2000)

  // 7. Le client signe sur son téléphone, dans SA langue (néerlandais)
  await page.getByRole('button', { name: 'Voir ce que reçoit le client' }).click()
  await expect(phone(page)).toContainText('Uw offerte')
  await big(page).click()
  await sign(page)
  await phone(page).getByRole('button', { name: 'Mijn handtekening bevestigen' }).click()
  const signed = (await demoData(page)).leads.find((l: { id: string }) => l.id === leadId)
  expect(signed.quote.signedAt).toBeTruthy()
  expect(signed.quote.sentAt).toBe(sentAt)

  // 8. Le dossier arrive chez le planificateur, sans ressaisie
  await page.goto('/#/planificateur/a-planifier')
  await expect(page.locator('main')).toContainText(signed.name)

  // 9. Réinitialisation → état de départ exact
  await page.keyboard.press('Control+Shift+R')
  await page.getByRole('button', { name: 'Réinitialiser', exact: true }).click()
  expect(await demoData(page)).toEqual(start)
})
