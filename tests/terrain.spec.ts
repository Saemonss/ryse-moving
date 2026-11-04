/*
 * Parcours terrain demandé pour l'étape 3 :
 * 1. journée complète de Karim (connexion → contrôle du camion → mission avec dégât et signature → frais → fin → envoi) ;
 * 2. contrôle et validation par le gérant → la marge du dossier est mise à jour ;
 * 3. la même mission avec perte de réseau simulée, puis retour du réseau ;
 * 4. réinitialisation → retour exact à l'état de départ.
 */
import { demoData, expect, openFresh, test } from './fixtures'
import { big, phone, pickPhoto, presenter, sign, toArrival, toInventory, toMissions } from './driver'

const reset = async (page: import('@playwright/test').Page) => {
  await page.keyboard.press('Control+Shift+R')
  await page.getByRole('button', { name: 'Réinitialiser', exact: true }).click()
}

test('Journée de Karim, contrôle du gérant, marge mise à jour, hors ligne, réinitialisation', async ({ page }) => {
  test.setTimeout(180_000)
  await openFresh(page, 'gerant', 'fr')
  await reset(page)
  const start = await demoData(page)

  // Marge de départ du dossier de Karim (aujourd'hui, équipe de Karim)
  const today = await page.evaluate(() => JSON.parse(localStorage.getItem('ryse-moving-demo') ?? '{}').state.seedDay)
  const karimMove = start.moves.find((m: { status: string; teamIds: string[]; date: string }) => m.status === 'planifie' && m.teamIds[0] === 's-karim' && m.date === today)
  await page.goto(`/#/gerant/dossier/${karimMove.id}`)
  const margin = page.locator('main dd').filter({ hasText: '%' }).last()
  const marginBefore = await margin.innerText()

  // 1. Journée complète de Karim
  await page.keyboard.press('3')
  await toArrival(page)
  await phone(page).locator('[data-room]').first().click()
  await pickPhoto(page)
  await phone(page).getByRole('button', { name: 'Signaler un dégât' }).click()
  const sheet = page.locator('[data-sheet]').last()
  await sheet.getByRole('button', { name: 'Prendre une photo' }).click()
  await pickPhoto(page)
  await sheet.getByRole('button', { name: 'Miroir' }).click()
  await sheet.getByRole('button', { name: 'Rayure' }).click()
  await sheet.getByRole('button', { name: 'Léger' }).click()
  await sheet.getByRole('button', { name: 'Enregistrer le dégât' }).click()
  await expect(phone(page).getByText('Dégât signalé : Miroir')).toBeVisible()
  await big(page).click() // valider l'état des lieux d'arrivée
  await sign(page)
  await big(page).click() // valider la signature
  await expect(phone(page).getByText('Mission terminée').first()).toBeVisible()
  await big(page).click() // retour aux missions
  // Frais : parking 25 €
  await phone(page).getByRole('button', { name: 'Frais' }).click()
  const exp = page.locator('[data-sheet]').last()
  await exp.getByRole('button', { name: 'Parking' }).click()
  await exp.getByRole('button', { name: 'Photo du ticket' }).click()
  await pickPhoto(page)
  for (const k of ['2', '5']) await exp.getByRole('button', { name: k, exact: true }).click()
  await exp.getByRole('button', { name: 'Enregistrer le frais' }).click()
  await big(page).click() // terminer ma journée
  await big(page).click() // photo du compteur de fin
  await pickPhoto(page)
  await big(page).click() // envoyer
  await expect(phone(page).getByText('Journée envoyée au bureau.').first()).toBeVisible()

  // 2. Le gérant contrôle et valide → marge du dossier mise à jour (frais de 25 € ajoutés aux coûts)
  await page.keyboard.press('1')
  await page.locator('main li').filter({ hasText: 'Karim Benali' }).getByRole('link', { name: 'Contrôler' }).click()
  await expect(page.getByText('Dégât signalé').first()).toBeVisible()
  await page.getByRole('button', { name: 'Valider la journée' }).click()
  await expect(page.getByText('Journée validée').first()).toBeVisible()
  await page.goto(`/#/gerant/dossier/${karimMove.id}`)
  await expect(margin).not.toHaveText(marginBefore)

  // 3. Même mission, réseau coupé : rien n'arrive au bureau tant que le réseau n'est pas revenu
  await reset(page)
  await page.keyboard.press('3')
  await presenter(page, 1) // simuler une perte de réseau
  await toInventory(page)
  await expect(phone(page).getByText('Pas de réseau : tout est gardé sur le téléphone.')).toBeVisible()
  await expect(phone(page).getByText(/À envoyer : [3-9]/)).toBeVisible()
  await page.keyboard.press('1')
  const karimRow = page.locator('main li').filter({ hasText: '07:30' }).first()
  // Hors ligne : le bureau ne voit encore aucune étape (quelle que soit l'heure du test)
  await expect(karimRow).not.toContainText('Étape')
  await expect(karimRow).toContainText('Planifié')
  await presenter(page, 1) // rétablir le réseau
  await expect(page.getByText(/Réseau revenu : \d+ éléments envoyés au bureau/)).toBeVisible()
  await expect(karimRow).toContainText('Étape 3/7')

  // 4. Réseau recoupé puis réinitialisation → état de départ exact, réseau rétabli, file vide
  await presenter(page, 1)
  await reset(page)
  expect(await demoData(page)).toEqual(start)
  const state = await page.evaluate(() => JSON.parse(localStorage.getItem('ryse-moving-demo') ?? '{}').state)
  expect(state.online).toBe(true)
  expect(state.queue).toEqual([])
  expect(state.session).toBeNull()
})

test('Double appui rapide : une seule étape franchie', async ({ page }) => {
  await openFresh(page, 'chauffeur', 'fr')
  await toMissions(page)
  await big(page).click() // ouvrir la mission (étape 1 sur 7)
  await big(page).dblclick()
  await expect(phone(page).getByText('Étape 2 sur 7')).toBeVisible()
})

test('Signature vide : validation impossible, avec une explication', async ({ page }) => {
  await openFresh(page, 'chauffeur', 'fr')
  await toArrival(page)
  await phone(page).locator('[data-room]').first().click()
  await pickPhoto(page)
  await big(page).click()
  await expect(big(page)).toBeDisabled()
  await expect(phone(page).getByText('Signez dans le cadre pour valider.')).toBeVisible()
  await sign(page)
  await expect(big(page)).toBeEnabled()
})

test('Photo très lourde choisie sur le PC : réduite, aucune erreur de stockage', async ({ page }) => {
  await openFresh(page, 'chauffeur', 'fr')
  await toInventory(page)
  await phone(page).locator('[data-room]').first().click()
  const shapes = Array.from({ length: 6000 }, (_, i) => `<rect x="${(i * 37) % 4000}" y="${(i * 53) % 4000}" width="80" height="80" fill="#${((i * 99991) % 16777215).toString(16).padStart(6, '0')}"/>`).join('')
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="4000" height="4000">${shapes}</svg>`
  const [chooser] = await Promise.all([page.waitForEvent('filechooser'), page.locator('[data-sheet] button').last().click()])
  await chooser.setFiles({ name: 'grande-photo.svg', mimeType: 'image/svg+xml', buffer: Buffer.from(svg) })
  await expect(phone(page).locator('[data-room] img').first()).toBeVisible()
  const size = await page.evaluate(() => (localStorage.getItem('ryse-moving-demo') ?? '').length)
  expect(size).toBeLessThan(1_000_000)
})

for (const lang of ['fr', 'nl'] as const) {
  test(`Téléphone ${lang.toUpperCase()} au zoom 200 % : rien ne déborde, gros boutons`, async ({ page }) => {
    await page.setViewportSize({ width: 720, height: 900 })
    await openFresh(page, 'chauffeur', lang)
    await toInventory(page)
    const overflow = await phone(page).evaluate((el) =>
      [...el.querySelectorAll('*')].filter((e) => {
        const st = getComputedStyle(e)
        return e.scrollWidth > e.clientWidth + 1 && st.overflowX !== 'visible' && st.textOverflow !== 'ellipsis'
      }).length,
    )
    expect(overflow).toBe(0)
    expect((await big(page).boundingBox())?.height ?? 0).toBeGreaterThanOrEqual(56)
  })
}
