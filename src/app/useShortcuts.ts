/*
 * Raccourcis du présentateur : 1 à 6 = changer de vue, L = changer de langue,
 * Ctrl + Maj + R = réinitialiser la démo (avec confirmation).
 * Ignorés quand on tape dans un champ ou qu'une fenêtre est ouverte.
 */
import { useEffect } from 'react'
import { useLangStore } from '../i18n'
import { go } from './router'
import { VIEWS } from './views'
import { useShell } from './shellState'

function isTyping(target: EventTarget | null) {
  const el = target as HTMLElement | null
  return !!el && (el.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(el.tagName))
}

export function useShortcuts() {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'r') {
        e.preventDefault()
        useShell.getState().setResetOpen(true)
        return
      }
      if (e.ctrlKey || e.metaKey || e.altKey || isTyping(e.target) || document.querySelector('dialog[open]')) return
      const view = VIEWS.find((v) => v.key === e.key)
      if (view) {
        go(view.id)
        return
      }
      if (e.key.toLowerCase() === 'l') useLangStore.getState().toggleLang()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])
}
