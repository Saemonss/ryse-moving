/*
 * Logo RySe Moving : 3 barres montantes (SVG inline) + wordmark « RySe » (gras) « Moving » (light, dégradé violet).
 * variant="light" sur fond clair, variant="dark" sur fond sombre (barre latérale).
 */
interface LogoProps {
  variant?: 'light' | 'dark'
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const SIZES = { sm: { bars: 20, text: 'text-[19px]' }, md: { bars: 26, text: 'text-2xl' }, lg: { bars: 44, text: 'text-[44px]' } }

export function Logo({ variant = 'light', size = 'md', className = '' }: LogoProps) {
  const s = SIZES[size]
  const dark = variant === 'dark'
  return (
    <span className={`inline-flex items-center gap-[0.45em] leading-none ${s.text} ${className}`} aria-label="RySe Moving" role="img">
      <svg width={s.bars} height={s.bars} viewBox="0 0 32 32" aria-hidden="true" className="shrink-0">
        <rect x="2" y="19" width="7.5" height="11" rx="2" fill={dark ? '#4a3f8f' : '#d3ccf7'} />
        <rect x="12.25" y="12" width="7.5" height="18" rx="2" fill={dark ? '#8a6dff' : '#9c85ff'} />
        <rect x="22.5" y="4" width="7.5" height="26" rx="2" fill={dark ? '#b49cff' : '#5b3bea'} />
      </svg>
      <span aria-hidden="true" className="tracking-[-0.03em] whitespace-nowrap">
        <span className={`font-bold ${dark ? 'text-white' : 'text-ink'}`}>RySe</span>{' '}
        <span
          className="font-light bg-clip-text text-transparent"
          style={{
            backgroundImage: dark
              ? 'linear-gradient(90deg, #c4b2ff, #a07cff)'
              : 'linear-gradient(90deg, var(--accent-to), var(--accent-from))',
          }}
        >
          Moving
        </span>
      </span>
    </span>
  )
}
