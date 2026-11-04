/*
 * Photos de la démo. Il n'y a pas d'appareil photo sur un PC : on utilise des ILLUSTRATIONS dessinées ici (SVG),
 * sans personne ni marque, ou une image choisie sur le PC (réduite avant d'être gardée).
 * Une photo est une chaîne : « demo:salon » (illustration) ou « data:image/jpeg;… » (fichier du PC).
 */
import type { ReactNode } from 'react'
import { useI18n } from '../i18n'

export const DEMO_PHOTOS = ['salon', 'chambre', 'cuisine', 'cartons', 'armoire', 'compteur', 'ticket', 'rayure'] as const
export type DemoPhotoKey = (typeof DEMO_PHOTOS)[number]

const WALL = '#efe9e0'
const FLOOR = '#d8c2a3'
const INK = '#3d4466'

const SCENES: Record<DemoPhotoKey, ReactNode> = {
  salon: (
    <>
      <rect width="160" height="84" fill={WALL} />
      <rect y="84" width="160" height="36" fill={FLOOR} />
      <rect x="98" y="14" width="44" height="34" rx="2" fill="#cfe1ee" stroke="#b9a68b" strokeWidth="3" />
      <rect x="18" y="56" width="78" height="30" rx="8" fill="#7b83b8" />
      <rect x="22" y="46" width="70" height="18" rx="7" fill="#8f97c8" />
      <rect x="22" y="84" width="6" height="8" fill="#5c6390" />
      <rect x="86" y="84" width="6" height="8" fill="#5c6390" />
      <rect x="118" y="60" width="4" height="30" fill="#8a7a63" />
      <path d="M108 60h24l-6-14h-12z" fill="#f2d48a" />
      <rect x="100" y="90" width="40" height="4" rx="2" fill="#bfa685" />
    </>
  ),
  chambre: (
    <>
      <rect width="160" height="80" fill="#e8ecf2" />
      <rect y="80" width="160" height="40" fill={FLOOR} />
      <rect x="30" y="22" width="34" height="24" fill="#d6cbe6" stroke="#a99bc4" strokeWidth="2" />
      <rect x="24" y="58" width="96" height="30" rx="4" fill="#f5f2ec" />
      <rect x="24" y="52" width="26" height="12" rx="4" fill="#ffffff" stroke="#d9d3c7" />
      <rect x="20" y="40" width="8" height="54" rx="2" fill="#8a6e52" />
      <rect x="64" y="64" width="56" height="24" rx="4" fill="#9fb4d8" />
      <rect x="126" y="66" width="22" height="24" rx="2" fill="#a88a6a" />
      <rect x="132" y="56" width="10" height="10" rx="5" fill="#f2d48a" />
    </>
  ),
  cuisine: (
    <>
      <rect width="160" height="120" fill="#eef0ea" />
      <rect x="8" y="12" width="144" height="30" rx="2" fill="#dfe4dc" stroke="#c4cbbf" />
      {[0, 1, 2, 3].map((i) => (
        <rect key={i} x={12 + i * 36} y="16" width="32" height="22" rx="2" fill="#f7f8f4" stroke="#c4cbbf" />
      ))}
      <rect x="8" y="66" width="144" height="46" fill="#dfe4dc" stroke="#c4cbbf" />
      <rect x="8" y="62" width="144" height="6" fill="#9aa39a" />
      <rect x="60" y="74" width="40" height="32" rx="2" fill="#4a4f63" />
      <rect x="66" y="80" width="28" height="18" rx="2" fill="#2f3346" />
      <circle cx="30" cy="54" r="5" fill="#c97b5a" />
      <rect x="120" y="44" width="16" height="18" rx="3" fill="#7e9a86" />
    </>
  ),
  cartons: (
    <>
      <rect width="160" height="88" fill={WALL} />
      <rect y="88" width="160" height="32" fill={FLOOR} />
      {[
        [18, 58, 46, 34],
        [66, 62, 40, 30],
        [108, 54, 38, 38],
        [30, 26, 40, 32],
        [76, 32, 34, 30],
      ].map(([x, y, w, h], i) => (
        <g key={i}>
          <rect x={x} y={y} width={w} height={h} fill="#c9a274" stroke="#a9835a" />
          <rect x={x! + w! / 2 - 3} y={y} width="6" height={h} fill="#e6d3b3" />
        </g>
      ))}
    </>
  ),
  armoire: (
    <>
      <rect width="160" height="92" fill={WALL} />
      <rect y="92" width="160" height="28" fill={FLOOR} />
      <rect x="46" y="10" width="68" height="94" rx="3" fill="#a07c58" stroke="#7f6043" strokeWidth="2" />
      <line x1="80" y1="12" x2="80" y2="102" stroke="#7f6043" strokeWidth="2" />
      <rect x="74" y="50" width="3" height="12" rx="1.5" fill="#e5d3b0" />
      <rect x="83" y="50" width="3" height="12" rx="1.5" fill="#e5d3b0" />
      <rect x="52" y="104" width="6" height="6" fill="#7f6043" />
      <rect x="102" y="104" width="6" height="6" fill="#7f6043" />
    </>
  ),
  compteur: (
    <>
      <rect width="160" height="120" fill="#1d2133" />
      <circle cx="80" cy="64" r="46" fill="#262b40" stroke="#3d4466" strokeWidth="4" />
      {Array.from({ length: 9 }, (_, i) => {
        const a = (Math.PI * (200 + i * 17.5)) / 180
        return <line key={i} x1={80 + Math.cos(a) * 38} y1={64 + Math.sin(a) * 38} x2={80 + Math.cos(a) * 44} y2={64 + Math.sin(a) * 44} stroke="#c9cde0" strokeWidth="2" />
      })}
      <line x1="80" y1="64" x2="104" y2="40" stroke="#ff8a5c" strokeWidth="3" strokeLinecap="round" />
      <circle cx="80" cy="64" r="5" fill="#c9cde0" />
      <rect x="50" y="80" width="60" height="16" rx="2" fill="#0f1220" />
      <text x="80" y="92" textAnchor="middle" fontFamily="monospace" fontSize="11" fill="#9fe6b8">
        048 210
      </text>
    </>
  ),
  ticket: (
    <>
      <rect width="160" height="120" fill="#dfe3ea" />
      <path d="M50 8h60v100l-6-4-6 4-6-4-6 4-6-4-6 4-6-4-6 4-6-4-6 4z" fill="#ffffff" stroke="#c8ccd6" />
      <rect x="66" y="16" width="28" height="22" rx="4" fill={INK} />
      <text x="80" y="33" textAnchor="middle" fontFamily="sans-serif" fontWeight="700" fontSize="16" fill="#ffffff">
        P
      </text>
      {[46, 54, 62, 70].map((y) => (
        <rect key={y} x="58" y={y} width={y === 70 ? 26 : 44} height="3" rx="1.5" fill="#c8ccd6" />
      ))}
      <rect x="58" y="82" width="44" height="6" rx="2" fill={INK} />
    </>
  ),
  rayure: (
    <>
      <rect width="160" height="120" fill="#b8916a" />
      {Array.from({ length: 7 }, (_, i) => (
        <path key={i} d={`M0 ${10 + i * 17} C 50 ${4 + i * 17}, 110 ${18 + i * 17}, 160 ${8 + i * 17}`} stroke="#a47d57" strokeWidth="2" fill="none" />
      ))}
      <rect x="34" y="18" width="92" height="66" rx="4" fill="#cfdde8" stroke="#8f7253" strokeWidth="5" />
      <path d="M52 30 L 104 70" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M58 30 L 100 64" stroke="#e7eef4" strokeWidth="1" strokeLinecap="round" />
      <circle cx="104" cy="70" r="14" fill="none" stroke="#d6453d" strokeWidth="3" />
    </>
  ),
}

interface PhotoViewProps {
  photo: string
  className?: string
}

/** Affiche une photo de la démo (illustration ou fichier). Le texte alternatif décrit la scène. */
export function PhotoView({ photo, className = '' }: PhotoViewProps) {
  const { t } = useI18n()
  const key = photo.startsWith('demo:') ? (photo.slice(5) as DemoPhotoKey) : null
  if (key && key in SCENES)
    return (
      <svg viewBox="0 0 160 120" role="img" aria-label={t(`photos.${key}`)} className={`block h-auto w-full rounded-lg bg-surface ${className}`}>
        {SCENES[key]}
      </svg>
    )
  return <img src={photo} alt={t('photos.file')} className={`block h-auto w-full rounded-lg object-cover ${className}`} />
}

/** Réduit une image choisie sur le PC (≤ 320 px, JPEG) pour ne pas saturer la mémoire du navigateur. */
export function shrinkImage(file: File, max = 320): Promise<string> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      const scale = Math.min(1, max / Math.max(img.width, img.height))
      const canvas = document.createElement('canvas')
      canvas.width = Math.max(1, Math.round(img.width * scale))
      canvas.height = Math.max(1, Math.round(img.height * scale))
      canvas.getContext('2d')?.drawImage(img, 0, 0, canvas.width, canvas.height)
      URL.revokeObjectURL(url)
      resolve(canvas.toDataURL('image/jpeg', 0.72))
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('image'))
    }
    img.src = url
  })
}
