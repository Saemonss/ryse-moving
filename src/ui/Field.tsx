/*
 * Champ de saisie avec son libellé toujours visible (jamais seulement un texte d'exemple).
 */
import { useId, type InputHTMLAttributes, type TextareaHTMLAttributes } from 'react'

interface FieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string
  hint?: string
}

const INPUT =
  'w-full rounded-xl border border-line bg-white px-3.5 text-[15px] text-ink placeholder:text-muted/80 shadow-card transition-[border-color,box-shadow] duration-150 focus:border-accent focus:outline-none focus:ring-4 focus:ring-accent-pale/60'

export function Field({ label, hint, className = '', ...rest }: FieldProps) {
  const id = useId()
  return (
    <div className={className}>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-ink">
        {label}
      </label>
      <input id={id} className={`${INPUT} h-11`} aria-describedby={hint ? `${id}-hint` : undefined} {...rest} />
      {hint && (
        <p id={`${id}-hint`} className="mt-1.5 text-[13px] text-muted">
          {hint}
        </p>
      )}
    </div>
  )
}

interface TextAreaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string
}

export function TextArea({ label, className = '', ...rest }: TextAreaProps) {
  const id = useId()
  return (
    <div className={className}>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-ink">
        {label}
      </label>
      <textarea id={id} className={`${INPUT} py-2.5 leading-relaxed`} {...rest} />
    </div>
  )
}
