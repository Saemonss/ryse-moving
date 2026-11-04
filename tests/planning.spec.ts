/*
 * Planning : les situations risquées du plan de l'étape 2 (« Review Focus »).
 */
import { expect, openFresh, test } from './fixtures'

test('Glisser-déposer : un jour passé est refusé, une case occupée crée un conflit visible', async ({ page }) => {
  await openFresh(page, 'planificateur', 'fr')
  const card = page.locator('main li[draggable="true"]').first()
  const conflicts = page.getByText(/Conflits à résoudre : \d+/)
  const before = Number((await conflicts.innerText()).match(/\d+/)?.[0] ?? 0)

  // Jour passé : semaine précédente → refus clair, aucun changement
  await page.getByRole('button', { name: 'Semaine précédente' }).click()
  await card.dragTo(page.locator('[data-cell^="t-c|"]').first())
  await expect(page.getByText('Impossible de planifier un déménagement dans le passé.')).toBeVisible()
  await page.getByRole('button', { name: 'Semaine suivante' }).click()

  // Case occupée : l'équipe de Karim, un jour où elle a déjà un déménagement → nouveau conflit visible
  const busyCell = page.locator('[data-cell^="t-b|"]').filter({ has: page.locator('[data-move]') }).last()
  await page.evaluate(() => window.scrollTo(0, 0))
  await card.dragTo(busyCell)
  await expect(page.getByText(/Dossier affecté à Équipe Karim/)).toBeVisible()
  await expect(conflicts).not.toHaveText(new RegExp(`: ${before}$`))
})

test('Absence sur plusieurs jours : tous les dossiers touchés apparaissent', async ({ page }) => {
  await openFresh(page, 'planificateur/absences', 'fr')
  await page.getByLabel('Personne').selectOption({ label: 'Didier Wauters' })
  await page.getByLabel('Durée').selectOption('3')
  await page.getByRole('button', { name: 'Ajouter' }).click()
  const title = page.getByText(/Déménagements touchés par une absence : (\d+)/)
  await expect(title).toBeVisible()
  expect(Number((await title.innerText()).match(/\d+/)?.[0])).toBeGreaterThanOrEqual(2)
})

test('Paramètres vides, négatifs ou énormes : valeurs bornées, jamais de NaN', async ({ page }) => {
  await openFresh(page, 'gerant/parametres', 'fr')
  const hourly = page.getByLabel("Coût horaire chargé d'un déménageur")
  for (const [typed, shown] of [
    ['', '32,00'],
    ['-5', '10,00'],
    ['99999', '100,00'],
  ] as const) {
    await hourly.fill(typed)
    await hourly.blur()
    await expect(hourly).toHaveValue(shown)
  }
  await page.goto('/#/gerant/rentabilite')
  const text = await page.locator('main').innerText()
  expect(text).not.toMatch(/NaN|Infinity/)
})

test('Conflit sans solution : une explication, jamais de bouton « Résoudre » inutile', async ({ page }) => {
  await openFresh(page, 'planificateur/absences', 'fr')
  // Toute l'équipe de terrain absente aujourd'hui : aucun remplaçant possible
  const people = await page.getByLabel('Personne').locator('option').allTextContents()
  for (const name of people) {
    await page.getByLabel('Personne').selectOption({ label: name })
    await page.getByRole('button', { name: 'Ajouter' }).click()
  }
  await page.goto('/#/planificateur')
  const items = page.locator('main section li').filter({ hasText: 'Absence de' })
  await expect(items.first()).toBeVisible()
  await expect(items.first()).toContainText('Pas de solution automatique')
  await expect(items.first().getByRole('button', { name: 'Résoudre' })).toHaveCount(0)
})

test('Navigation à ± 10 semaines puis « Aujourd\'hui »', async ({ page }) => {
  await openFresh(page, 'gerant/planning', 'fr')
  const title = page.locator('main h2').filter({ hasText: 'Semaine du' })
  const initial = await title.innerText()
  for (let i = 0; i < 10; i++) await page.getByRole('button', { name: 'Semaine suivante' }).click()
  await expect(page.locator('main [data-move]')).toHaveCount(0)
  for (let i = 0; i < 20; i++) await page.getByRole('button', { name: 'Semaine précédente' }).click()
  await expect(page.locator('main [data-move]')).toHaveCount(0)
  await page.getByRole('button', { name: "Aujourd'hui" }).click()
  await expect(title).toHaveText(initial)
})

test('Un dossier déjà réalisé ne peut pas être replanifié depuis le planning', async ({ page }) => {
  await openFresh(page, 'planificateur', 'fr')
  await page.getByRole('button', { name: 'Semaine précédente' }).click()
  const before = await page.evaluate(() => localStorage.getItem('ryse-moving-demo'))
  await page.locator('[data-cell^="t-"] [data-move]').first().click()
  const dialog = page.locator('dialog[open]')
  await expect(dialog).toContainText('il ne peut plus être déplacé')
  await expect(dialog.getByRole('button', { name: 'Affecter', exact: true })).toHaveCount(0)
  await dialog.getByRole('button', { name: 'Fermer' }).first().click()
  expect(await page.evaluate(() => localStorage.getItem('ryse-moving-demo'))).toBe(before)
})

test('Le gérant et le planificateur comptent les mêmes conflits', async ({ page }) => {
  await openFresh(page, 'planificateur/absences', 'fr')
  await page.getByLabel('Personne').selectOption({ label: 'Didier Wauters' })
  await page.getByLabel('Durée').selectOption('3')
  await page.getByRole('button', { name: 'Ajouter' }).click()
  await page.goto('/#/planificateur')
  const n = Number((await page.getByText(/Conflits à résoudre : \d+/).innerText()).match(/\d+/)?.[0])
  await page.goto('/#/gerant')
  await expect(page.locator('main section').filter({ hasText: 'Alertes' }).getByRole('button', { name: 'Résoudre' })).toHaveCount(n)
})
