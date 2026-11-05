/*
 * Résumé du soir du gérant, préparé par l'agent : la journée, ce qui coince demain, les marges, ce qui attend.
 * Court, en phrases simples ; chaque ligne mène à l'écran concerné.
 */
import { useEffect, useState } from 'react'
import { ChevronRight } from 'lucide-react'
import { useI18n, type TKey } from '../../i18n'
import { fmtDate } from '../../i18n/format'
import { useDemo } from '../../store/demoStore'
import { eveningSummary } from '../../data/agents'
import { Modal } from '../../ui/Modal'
import { Button } from '../../ui/Button'
import { AiProcessing } from '../../ui/AiProcessing'
import { go } from '../../app/router'

const DOT = { success: 'bg-success', warning: 'bg-warning', danger: 'bg-danger', neutral: 'bg-subtle' } as const

export function EveningSummary({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { t, lang } = useI18n()
  const data = useDemo((s) => s.data)
  const today = useDemo((s) => s.seedDay)
  const [ready, setReady] = useState(false)
  useEffect(() => {
    if (!open) return
    setReady(false)
    const id = window.setTimeout(() => setReady(true), 1200)
    return () => {
      window.clearTimeout(id)
      setReady(false)
    }
  }, [open])

  const sections = eveningSummary(data, today)
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={t('evening.title', { date: fmtDate(today, lang, 'dayMonth') })}
      footer={
        <Button variant="secondary" onClick={onClose}>
          {t('evening.close')}
        </Button>
      }
    >
      {!ready ? (
        <AiProcessing label={t('evening.preparing')} />
      ) : (
        <div className="space-y-5">
          {sections.map((s) => (
            <section key={s.title}>
              <h3 className="mb-1.5 text-sm font-semibold text-muted">{t(s.title as TKey)}</h3>
              <ul className="-mx-2">
                {s.items.map((it) => (
                  <li key={it.key}>
                    <button
                      type="button"
                      onClick={() => {
                        onClose()
                        go(it.to.view, it.to.screen, it.to.param)
                      }}
                      className="flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left text-[16px] text-ink hover:bg-surface focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-accent-pale"
                    >
                      <span className={`size-2 shrink-0 rounded-full ${DOT[it.tone]}`} aria-hidden="true" />
                      <span className="flex-1">{t(it.key as TKey, it.vars)}</span>
                      <ChevronRight size={17} className="shrink-0 text-subtle" aria-hidden="true" />
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}
    </Modal>
  )
}
