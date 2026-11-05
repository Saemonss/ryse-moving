/*
 * Gestes du chauffeur dans le téléphone de démo, réutilisés par les tests (fonctionnent en FR et en NL :
 * ils s'appuient sur la structure de l'écran, pas sur les textes).
 */
import type { Page } from '@playwright/test'

export const phone = (page: Page) => page.locator('[data-phone]')
/** Le très gros bouton d'action principale. */
export const big = (page: Page) => phone(page).locator('button.min-h-16').last()
/** Première photo de démonstration proposée dans le panneau « Prendre une photo ». */
export const pickPhoto = (page: Page) => page.locator('[data-sheet]').last().locator('button').nth(1).click()

export async function login(page: Page, name = 'Karim Benali') {
  await phone(page).getByText(name).click()
  for (const k of ['1', '2', '3', '4']) await phone(page).getByRole('button', { name: k, exact: true }).click()
}

/** Connexion → début de journée → position → contrôle du camion : arrivée sur « Mes missions ». */
export async function toMissions(page: Page) {
  await login(page)
  await big(page).click() // Commencer ma journée
  await big(page).click() // Enregistrer ma position
  await big(page).click() // Photo du compteur
  await pickPhoto(page)
  await big(page).click() // Valider
  await phone(page).locator('[aria-pressed]').first().click() // carburant
  await page.waitForTimeout(450) // comme une vraie personne : la protection anti double tap ignore un tap trop rapide
  await phone(page).locator('[aria-pressed]').first().click() // bon état
}

/** … puis mission ouverte, départ et arrivée : état des lieux de départ. */
export async function toInventory(page: Page) {
  await toMissions(page)
  await big(page).click() // Ouvrir la mission
  await big(page).click() // Je pars
  await big(page).click() // Je suis arrivé
}

async function roomPhoto(page: Page) {
  await phone(page).locator('[data-room]').first().click()
  await pickPhoto(page)
}

/** … jusqu'à l'état des lieux d'arrivée. */
export async function toArrival(page: Page) {
  await toInventory(page)
  await roomPhoto(page)
  await big(page).click() // Valider l'état des lieux
  await phone(page).getByRole('button', { name: '30', exact: true }).click()
  await big(page).click() // Chargement terminé
  await big(page).click() // Arrivé à destination
}

/** … jusqu'à la signature. */
export async function toSignature(page: Page) {
  await toArrival(page)
  await roomPhoto(page)
  await big(page).click()
}

export async function sign(page: Page) {
  const box = (await phone(page).locator('canvas').boundingBox())!
  await page.mouse.move(box.x + 30, box.y + 100)
  await page.mouse.down()
  for (let i = 0; i < 12; i++) await page.mouse.move(box.x + 30 + i * 20, box.y + 60 + (i % 2) * 50)
  await page.mouse.up()
}

/** … mission signée, journée terminée : récapitulatif avant envoi. */
export async function toDayEnd(page: Page) {
  await toSignature(page)
  await sign(page)
  await big(page).click() // Valider la signature
  await big(page).click() // Retour à mes missions
  await big(page).click() // Terminer ma journée
  await big(page).click() // Photo du compteur de fin
  await pickPhoto(page)
}

/** Menu présentateur : une entrée par son repère (reset, lead, network, advance). */
export async function presenter(page: Page, entry: 'reset' | 'lead' | 'network' | 'advance') {
  await page.locator('header button[aria-haspopup]').click()
  await page.locator(`[data-popover] [data-presenter="${entry}"]`).click()
}
