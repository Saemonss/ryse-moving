/*
 * Lien vers un autre écran de la démo. Si l'écran cible n'est pas encore prêt, rien n'est affiché
 * (ou seulement le contenu, sans lien) : jamais de lien mort.
 */
import type { ReactNode } from 'react'
import { ArrowRight } from 'lucide-react'
import { go, hrefOf } from '../../app/router'
import { isScreenReady, type ViewId } from '../../app/views'

interface ScreenLinkProps {
  view: ViewId
  screen: string
  param?: string
  children: ReactNode
  className?: string
  /** Affiche une flèche discrète après le texte. */
  arrow?: boolean
  /** Si l'écran n'est pas prêt : afficher quand même le contenu, sans lien. */
  fallback?: boolean
}

export function ScreenLink({ view, screen, param, children, className = '', arrow = false, fallback = false }: ScreenLinkProps) {
  if (!isScreenReady(view, screen)) return fallback ? <span className={className}>{children}</span> : null
  return (
    <a
      href={hrefOf(view, screen, param)}
      onClick={(e) => {
        e.preventDefault()
        go(view, screen, param)
      }}
      className={`group inline-flex items-center gap-1 rounded-md font-medium text-accent underline-offset-4 hover:underline ${className}`}
    >
      {children}
      {arrow && <ArrowRight size={15} aria-hidden="true" className="transition-transform duration-150 group-hover:translate-x-0.5" />}
    </a>
  )
}
