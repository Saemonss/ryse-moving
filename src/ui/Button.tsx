/*
 * Bouton unique de l'application.
 * - variant : primary (action principale), secondary, ghost (discret), danger (destructif), onDark (sur fond sombre)
 * - size xl : très grand bouton pleine largeur pour le chauffeur et le client (≥ 64 px de haut, texte 20 px).
 * Toujours un mot ; l'icône accompagne le mot, elle ne le remplace jamais (sauf iconOnly + label accessible).
 */
import type { ButtonHTMLAttributes, ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'onDark'
type Size = 'sm' | 'md' | 'lg' | 'xl'

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  icon?: LucideIcon
  children?: ReactNode
}

const VARIANTS: Record<Variant, string> = {
  primary:
    'bg-accent text-white shadow-[0_1px_2px_rgb(68_39_215/0.4),inset_0_1px_0_rgb(255_255_255/0.14)] hover:bg-[#4f30dc] active:bg-[#4427d7]',
  secondary: 'bg-white text-ink border border-line shadow-card hover:border-accent-pale hover:bg-surface',
  ghost: 'text-ink hover:bg-surface-2/70',
  danger: 'bg-white text-danger border border-danger/30 hover:bg-danger-soft',
  onDark: 'text-white/90 hover:bg-white/10 hover:text-white',
}

const SIZES: Record<Size, string> = {
  sm: 'h-9 px-3 gap-1.5 text-sm rounded-lg',
  md: 'h-11 px-4 gap-2 text-[15px] rounded-xl',
  lg: 'h-12 px-5 gap-2 text-base rounded-xl',
  xl: 'min-h-16 w-full px-6 gap-3 text-xl rounded-2xl',
}

const ICON: Record<Size, number> = { sm: 16, md: 18, lg: 20, xl: 26 }

export function Button({ variant = 'primary', size = 'md', icon: Icon, children, className = '', type = 'button', ...rest }: ButtonProps) {
  return (
    <button
      type={type}
      className={`inline-flex shrink-0 select-none items-center justify-center font-semibold leading-tight transition-[background-color,border-color,transform,box-shadow] duration-150 ease-out active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-50 ${VARIANTS[variant]} ${SIZES[size]} ${className}`}
      {...rest}
    >
      {Icon && <Icon size={ICON[size]} strokeWidth={size === 'xl' ? 2.25 : 2} aria-hidden="true" />}
      {children}
    </button>
  )
}
