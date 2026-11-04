/*
 * Navigation par « # » dans l'adresse : #/gerant, #/chauffeur, #/charte…
 * Pas de rechargement de page. Une adresse inconnue renvoie vers la vue Gérant (jamais d'écran vide).
 */
import { useSyncExternalStore } from 'react'
import { VIEW_IDS, type ViewId } from './views'

export type Route = ViewId | 'charte'

function parse(hash: string): Route | null {
  const id = hash.replace(/^#\/?/, '').split(/[/?]/)[0] ?? ''
  if (id === 'charte') return 'charte'
  return (VIEW_IDS as readonly string[]).includes(id) ? (id as ViewId) : null
}

function current(): Route {
  return parse(window.location.hash) ?? 'gerant'
}

function subscribe(cb: () => void) {
  window.addEventListener('hashchange', cb)
  return () => window.removeEventListener('hashchange', cb)
}

/** Corrige une adresse inconnue au démarrage (sans ajouter d'entrée dans l'historique). */
export function normalizeHash() {
  if (!parse(window.location.hash)) window.history.replaceState(null, '', '#/gerant')
}

export function go(route: Route) {
  if (current() !== route) window.location.hash = `#/${route}`
}

export function useRoute(): Route {
  return useSyncExternalStore(subscribe, current)
}
