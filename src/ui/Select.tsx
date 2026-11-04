/*
 * Liste déroulante native (accessible au clavier et sur tous les navigateurs), avec son libellé visible.
 */
import { useId, type SelectHTMLAttributes } from 'react'
import { ChevronDown } from 'lucide-react'

interface SelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'onChange'> {
  label: string
  options: { value: string; label: string }[]
  onChange: (value: string) => void
  /** Libellé masqué visuellement (lu par les lecteurs d'écran). */
  hideLabel?: boolean
}

export function Select({ label, options, onChange, hideLabel = false, className = '', ...rest }: SelectProps) {
  const id = useId()
  return (
    <div className={className}>
      <label htmlFor={id} className={hideLabel ? 'sr-only' : 'mb-1.5 block text-sm font-medium text-ink'}>
        {label}
      </label>
      <div className="relative">
        <select
          id={id}
          onChange={(e) => onChange(e.target.value)}
          className="h-11 w-full cursor-pointer appearance-none rounded-xl border border-line bg-white pl-3.5 pr-9 text-[15px] text-ink shadow-card transition-[border-color,box-shadow] duration-150 focus:border-accent focus:outline-none focus:ring-4 focus:ring-accent-pale/60"
          {...rest}
        >
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <ChevronDown size={16} aria-hidden="true" className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted" />
      </div>
    </div>
  )
}
