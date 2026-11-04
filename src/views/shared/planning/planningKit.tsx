/*
 * Éléments du planning : couleurs par type de déménagement, bloc « dossier », légende.
 * Les 6 teintes sont réservées aux TYPES de déménagement (elles ne servent jamais aux états ni aux alertes).
 * Un conflit = contour rouge + icône, quel que soit le type.
 */
import type { DragEvent } from 'react'
import { TriangleAlert } from 'lucide-react'
import { useI18n } from '../../../i18n'
import { cityName, customerOf } from '../../../data/selectors'
import type { DemoData, Move, MoveType } from '../../../data/types'

export const TYPE_COLORS: Record<MoveType, { bg: string; dot: string }> = {
  appartement: { bg: '#eef0ff', dot: '#4f56d6' },
  maison: { bg: '#e6f5f1', dot: '#17806b' },
  bureaux: { bg: '#eef1f5', dot: '#475569' },
  international: { bg: '#fcedf3', dot: '#b0336a' },
  gardeMeuble: { bg: '#f2edfc', dot: '#7046c4' },
  debarras: { bg: '#f5f0e6', dot: '#7f6232' },
}

interface MoveBlockProps {
  move: Move
  data: DemoData
  conflict: boolean
  compact?: boolean
  draggable?: boolean
  onOpen: () => void
}

export function MoveBlock({ move, data, conflict, compact = false, draggable = false, onOpen }: MoveBlockProps) {
  const { t, lang } = useI18n()
  const c = TYPE_COLORS[move.type]
  const client = customerOf(data, move)?.name ?? ''
  // Étape en cours envoyée par le téléphone du chauffeur (avancement en direct)
  const liveStep = data.days.flatMap((d) => d.missions).find((m) => m.moveId === move.id)?.step ?? 0
  const label = `${move.startTime} · ${client} · ${t(`moveType.${move.type}`)}${conflict ? ` · ${t('planning.conflict')}` : ''}`
  return (
    <button
      type="button"
      data-crawl-sample
      data-move={move.id}
      draggable={draggable}
      onDragStart={(e: DragEvent) => {
        e.dataTransfer.setData('text/move', move.id)
        e.dataTransfer.effectAllowed = 'move'
      }}
      onClick={onOpen}
      aria-label={label}
      title={label}
      style={{ background: c.bg }}
      className={`group relative w-full rounded-lg px-2 py-1.5 text-left text-[12.5px] leading-snug text-ink transition-[box-shadow,transform] duration-150 hover:shadow-pop active:scale-[0.98] ${
        conflict ? 'ring-2 ring-danger' : 'ring-1 ring-black/[0.04]'
      } ${draggable ? 'cursor-grab active:cursor-grabbing' : ''}`}
    >
      <span className="flex items-center gap-1.5">
        <span className="size-2 shrink-0 rounded-full" style={{ background: c.dot }} aria-hidden="true" />
        <span className="tabular font-semibold">{move.startTime}</span>
        {liveStep > 0 && liveStep < 7 && <span className="tabular ml-auto rounded bg-warning-soft px-1 text-[11px] font-semibold text-warning">{liveStep + 1}/7</span>}
        {conflict && <TriangleAlert size={13} className={`${liveStep > 0 && liveStep < 7 ? '' : 'ml-auto'} shrink-0 text-danger`} aria-hidden="true" />}
      </span>
      <span className="mt-0.5 block truncate font-medium">{client}</span>
      {!compact && (
        <span className="block truncate text-muted">
          {cityName(move.from.cityId, lang)}
          {move.to ? ` → ${cityName(move.to.cityId, lang)}` : ''} · {move.volumeM3} m³
        </span>
      )}
    </button>
  )
}

export function TypeLegend() {
  const { t } = useI18n()
  return (
    <ul className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[13px] text-muted">
      {(Object.keys(TYPE_COLORS) as MoveType[]).map((type) => (
        <li key={type} className="flex items-center gap-1.5">
          <span className="size-2.5 rounded-full" style={{ background: TYPE_COLORS[type].dot }} aria-hidden="true" />
          {t(`moveType.${type}`)}
        </li>
      ))}
      <li className="flex items-center gap-1.5">
        <span className="size-2.5 rounded-full ring-2 ring-danger" aria-hidden="true" />
        {t('planning.conflict')}
      </li>
    </ul>
  )
}
