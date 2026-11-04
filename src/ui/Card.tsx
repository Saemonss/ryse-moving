/*
 * Carte : un bloc blanc qui regroupe une information. Titre optionnel, contenu libre, action optionnelle à droite.
 * Les cartes ne s'imbriquent jamais les unes dans les autres.
 */
import type { ReactNode } from 'react'

interface CardProps {
  title?: ReactNode
  aside?: ReactNode
  children: ReactNode
  className?: string
  padded?: boolean
}

export function Card({ title, aside, children, className = '', padded = true }: CardProps) {
  return (
    <section className={`rounded-2xl border border-line/80 bg-white shadow-card ${className}`}>
      {(title || aside) && (
        <header className={`flex items-center justify-between gap-3 ${padded ? 'px-5 pt-4' : 'px-5 py-4 border-b border-line'}`}>
          {title && <h2 className="text-[15px] font-semibold tracking-[-0.01em] text-ink">{title}</h2>}
          {aside}
        </header>
      )}
      <div className={padded ? 'p-5 pt-3' : ''}>{children}</div>
    </section>
  )
}
