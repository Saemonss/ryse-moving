/*
 * Fenêtre modale basée sur l'élément <dialog> natif : le navigateur gère le piège du focus, la touche Échap
 * et le retour du focus au bouton d'origine. Ouverture rapide (180 ms), sans animation de fermeture.
 */
import { useEffect, useRef, type ReactNode } from 'react'
import { X } from 'lucide-react'
import { useI18n } from '../i18n'

interface ModalProps {
  open: boolean
  onClose: () => void
  title: string
  children: ReactNode
  footer?: ReactNode
}

export function Modal({ open, onClose, title, children, footer }: ModalProps) {
  const ref = useRef<HTMLDialogElement>(null)
  const { t } = useI18n()

  useEffect(() => {
    const dialog = ref.current
    if (!dialog) return
    if (open && !dialog.open) dialog.showModal()
    if (!open && dialog.open) dialog.close()
  }, [open])

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onClick={(e) => e.target === ref.current && onClose()}
      aria-labelledby="modal-title"
      className="m-auto w-[min(560px,calc(100vw-2rem))] rounded-2xl border border-line bg-white p-0 text-ink shadow-float backdrop:bg-ink/40 open:animate-[rm-scale-in_180ms_var(--ease-out)] open:backdrop:animate-[rm-fade_180ms_ease-out]"
    >
      {open && (
        <div className="flex max-h-[85dvh] flex-col">
          <header className="flex items-start justify-between gap-4 px-6 pt-5 pb-2">
            <h2 id="modal-title" className="text-xl font-semibold tracking-[-0.015em] text-balance">
              {title}
            </h2>
            <button
              type="button"
              onClick={onClose}
              aria-label={t('common.close')}
              className="-mr-2 grid size-9 shrink-0 place-items-center rounded-lg text-muted transition-colors hover:bg-surface hover:text-ink"
            >
              <X size={18} aria-hidden="true" />
            </button>
          </header>
          <div className="overflow-y-auto px-6 pb-5 text-[15px] leading-relaxed">{children}</div>
          {footer && <footer className="flex flex-wrap justify-end gap-2 border-t border-line bg-surface/60 px-6 py-4">{footer}</footer>}
        </div>
      )}
    </dialog>
  )
}
