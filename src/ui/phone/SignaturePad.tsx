/*
 * Signature au doigt (ou à la souris sur PC). Renvoie une image PNG, ou null tant que rien n'est signé.
 */
import { useEffect, useRef } from 'react'
import { RotateCcw } from 'lucide-react'
import { useI18n } from '../../i18n'

export function SignaturePad({ onChange }: { onChange: (image: string | null) => void }) {
  const { t } = useI18n()
  const canvas = useRef<HTMLCanvasElement>(null)
  const drawing = useRef(false)
  const drawn = useRef(false)

  useEffect(() => {
    const c = canvas.current
    if (!c) return
    const ratio = window.devicePixelRatio || 1
    c.width = c.offsetWidth * ratio
    c.height = c.offsetHeight * ratio
    const ctx = c.getContext('2d')
    if (!ctx) return
    ctx.scale(ratio, ratio)
    ctx.lineWidth = 3
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.strokeStyle = '#0b1026'
  }, [])

  const point = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const r = e.currentTarget.getBoundingClientRect()
    return [e.clientX - r.left, e.clientY - r.top] as const
  }

  const clear = () => {
    const c = canvas.current
    c?.getContext('2d')?.clearRect(0, 0, c.width, c.height)
    drawn.current = false
    onChange(null)
  }

  return (
    <div>
      <div className="relative rounded-2xl border-2 border-dashed border-accent-soft bg-white">
        <canvas
          ref={canvas}
          aria-label={t('terrain.mission.signHere')}
          role="img"
          className="block h-44 w-full touch-none rounded-2xl"
          onPointerDown={(e) => {
            e.currentTarget.setPointerCapture(e.pointerId)
            drawing.current = true
            const ctx = e.currentTarget.getContext('2d')
            const [x, y] = point(e)
            ctx?.beginPath()
            ctx?.moveTo(x, y)
          }}
          onPointerMove={(e) => {
            if (!drawing.current) return
            const ctx = e.currentTarget.getContext('2d')
            const [x, y] = point(e)
            ctx?.lineTo(x, y)
            ctx?.stroke()
            drawn.current = true
          }}
          onPointerUp={(e) => {
            drawing.current = false
            if (drawn.current) onChange(e.currentTarget.toDataURL('image/png'))
          }}
        />
        <span className="pointer-events-none absolute bottom-3 left-4 right-4 border-b border-line" aria-hidden="true" />
      </div>
      <div className="mt-2 flex items-center justify-between gap-3">
        <p className="text-[15px] text-muted">{t('terrain.mission.signHere')}</p>
        <button type="button" onClick={clear} className="flex min-h-12 items-center gap-1.5 rounded-xl px-3 text-[16px] font-semibold text-accent">
          <RotateCcw size={18} aria-hidden="true" />
          {t('terrain.mission.clear')}
        </button>
      </div>
    </div>
  )
}
