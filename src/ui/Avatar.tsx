/*
 * Avatar en initiales (pas de photo réelle). La couleur est déduite du nom : toujours la même pour une personne.
 */
const PALETTE = [
  'bg-[#e9e6fa] text-[#4427d7]',
  'bg-[#e3f4ec] text-[#13704a]',
  'bg-[#fdf0dc] text-[#8f5200]',
  'bg-[#e5eefa] text-[#1d5fb5]',
  'bg-[#f6e6f1] text-[#8e2468]',
  'bg-[#e6f3f4] text-[#1c6870]',
]

export function initials(name: string) {
  const parts = name.trim().split(/\s+/)
  return ((parts[0]?.[0] ?? '') + (parts.length > 1 ? (parts[parts.length - 1]?.[0] ?? '') : '')).toUpperCase()
}

export function Avatar({ name, size = 36, className = '' }: { name: string; size?: number; className?: string }) {
  let hash = 0
  for (const c of name) hash = (hash * 31 + c.charCodeAt(0)) >>> 0
  return (
    <span
      aria-hidden="true"
      className={`inline-grid shrink-0 place-items-center rounded-full font-semibold ${PALETTE[hash % PALETTE.length]} ${className}`}
      style={{ width: size, height: size, fontSize: Math.round(size * 0.38) }}
    >
      {initials(name)}
    </span>
  )
}
