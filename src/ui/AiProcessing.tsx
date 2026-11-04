/*
 * IA simulée. Aucune API : le résultat est préparé à l'avance et rendu après un court délai réaliste.
 * - <AiProcessing /> : indicateur « Traitement IA en cours… » (les 3 barres du logo qui respirent).
 * - useFakeAi(result) : { run, status, data } ; status passe de idle → running → done.
 */
import { useCallback, useEffect, useRef, useState } from 'react'
import { useI18n } from '../i18n'

export function AiProcessing({ label }: { label?: string }) {
  const { t } = useI18n()
  return (
    <div role="status" className="flex items-center gap-3 rounded-xl bg-surface-2/60 px-4 py-3 text-[15px] text-ink">
      <span className="flex h-5 items-end gap-[3px]" aria-hidden="true">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="w-[5px] origin-bottom rounded-sm bg-accent motion-safe:animate-[rm-bar_900ms_ease-in-out_infinite]"
            style={{ height: `${10 + i * 5}px`, animationDelay: `${i * 140}ms`, opacity: 0.45 + i * 0.27 }}
          />
        ))}
      </span>
      {label ?? t('ai.processing')}
    </div>
  )
}

export type FakeAiStatus = 'idle' | 'running' | 'done'

/** Délai par défaut entre 0,8 et 2 s, comme demandé dans CLAUDE.md. */
export function useFakeAi<T>(result: T, ms = 1300) {
  const [status, setStatus] = useState<FakeAiStatus>('idle')
  const timer = useRef<number | undefined>(undefined)
  useEffect(() => () => window.clearTimeout(timer.current), [])
  const run = useCallback(() => {
    window.clearTimeout(timer.current)
    setStatus('running')
    timer.current = window.setTimeout(() => setStatus('done'), Math.min(2000, Math.max(800, ms)))
  }, [ms])
  const reset = useCallback(() => {
    window.clearTimeout(timer.current)
    setStatus('idle')
  }, [])
  return { run, reset, status, data: status === 'done' ? result : null }
}
