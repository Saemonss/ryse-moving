/*
 * Navigation par « # » dans l'adresse : #/vue, #/vue/ecran, #/vue/ecran/parametre (ex. #/gerant/dossier/m-04).
 * Pas de rechargement de page. Une adresse inconnue renvoie vers l'écran par défaut (jamais d'écran vide).
 */
import { useSyncExternalStore } from 'react'
import { VIEW_IDS, defaultScreen, isScreenReady, type ViewId } from './views'

export interface Route {
  view: ViewId | 'charte'
  screen: string
  param?: string
}

function parse(hash: string): Route | null {
  const [view = '', screen, param] = hash.replace(/^#\/?/, '').split('?')[0]!.split('/')
  if (view === 'charte') return { view: 'charte', screen: 'accueil' }
  if (!(VIEW_IDS as readonly string[]).includes(view)) return null
  const v = view as ViewId
  if (!screen) return { view: v, screen: defaultScreen(v) }
  if (!isScreenReady(v, screen)) return null
  return { view: v, screen, param: param ? decodeURIComponent(param) : undefined }
}

export function hrefOf(view: ViewId | 'charte', screen?: string, param?: string): string {
  if (view === 'charte') return '#/charte'
  if (!screen || (screen === defaultScreen(view) && !param)) return `#/${view}`
  return `#/${view}/${screen}${param ? `/${encodeURIComponent(param)}` : ''}`
}

function subscribe(cb: () => void) {
  window.addEventListener('hashchange', cb)
  return () => window.removeEventListener('hashchange', cb)
}

/** Corrige une adresse inconnue (sans ajouter d'entrée dans l'historique). */
export function normalizeHash() {
  if (parse(window.location.hash)) return
  const view = window.location.hash.replace(/^#\/?/, '').split('/')[0] ?? ''
  const target = (VIEW_IDS as readonly string[]).includes(view) ? `#/${view}` : '#/gerant'
  window.history.replaceState(null, '', target)
  window.dispatchEvent(new HashChangeEvent('hashchange'))
}

export function go(view: ViewId | 'charte', screen?: string, param?: string) {
  const href = hrefOf(view, screen, param)
  if (window.location.hash !== href) window.location.hash = href
}

export function useRoute(): Route {
  const hash = useSyncExternalStore(subscribe, () => window.location.hash)
  return parse(hash) ?? { view: 'gerant', screen: defaultScreen('gerant') }
}
