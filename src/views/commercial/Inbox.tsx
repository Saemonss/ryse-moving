/*
 * Commercial › Demandes : une seule boîte de réception pour tous les canaux (site, appel, vocal, mail, WhatsApp, SMS,
 * plateforme). En haut, l'indicateur clé : demandes sans réponse depuis plus de 24 h.
 */
import { useEffect, useState } from 'react'
import { Bot } from 'lucide-react'
import { useI18n } from '../../i18n'
import { useDemo } from '../../store/demoStore'
import type { Lead } from '../../data/types'
import { Card } from '../../ui/Card'
import { Button } from '../../ui/Button'
import { Tabs } from '../../ui/Tabs'
import { StatusBadge, type Tone } from '../../ui/StatusBadge'
import { go, hrefOf, useRoute } from '../../app/router'
import type { ViewId } from '../../app/views'
import { FactStrip, PageHeader } from '../shared/Page'
import { CHANNEL_ICON, agoText, messageSegments } from './leadText'
import { replyMinutes } from '../../data/leads'
import { AskAgentDialog } from './AskAgentDialog'

export const LEAD_TONE: Record<Lead['status'], Tone> = { nouvelle: 'accent', attenteClient: 'info', rappel: 'warning', complete: 'success', atypique: 'danger' }
type Tab = 'all' | 'todo' | 'waiting'

/** Demande sans réponse depuis plus de 24 h (ni réponse de l'agent, ni prise en main). */
export const unanswered = (l: Lead, now: number) => !l.replyAt && l.status !== 'complete' && now - new Date(l.receivedAt).getTime() > 24 * 3_600_000

export function Inbox() {
  const { t, lang } = useI18n()
  const leads = useDemo((s) => s.data.leads)
  const today = useDemo((s) => s.seedDay)
  const view = useRoute().view as ViewId
  const [tab, setTab] = useState<Tab>('all')
  const [asking, setAsking] = useState(false)
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 30_000)
    return () => window.clearInterval(id)
  }, [])

  const replied = leads.filter((l) => replyMinutes(l) !== null)
  const avg = replied.length ? Math.round(replied.reduce((s, l) => s + (replyMinutes(l) ?? 0), 0) / replied.length) : 0
  const rows = leads.filter((l) => tab === 'all' || (tab === 'todo' ? ['rappel', 'atypique', 'nouvelle'].includes(l.status) : l.status === 'attenteClient'))

  return (
    <>
      <div className="mb-7 flex flex-wrap items-start justify-between gap-4">
        <PageHeader title={t('inbox.title')} subtitle={t('inbox.subtitle')} />
        <Button icon={Bot} onClick={() => setAsking(true)}>
          {t('inbox.askAgent')}
        </Button>
      </div>
      <FactStrip
        facts={[
          { label: t('inbox.unanswered'), value: leads.filter((l) => unanswered(l, now)).length, tone: leads.some((l) => unanswered(l, now)) ? 'danger' : undefined },
          { label: t('inbox.today'), value: leads.filter((l) => l.receivedAt.startsWith(today)).length },
          { label: t('inbox.answered'), value: replied.length },
          { label: t('inbox.avgReply'), value: t('inbox.minutes', { n: avg }) },
        ]}
      />
      <Card padded={false}>
        <div className="border-b border-line px-5 py-3">
          <Tabs
            label={t('inbox.title')}
            value={tab}
            onChange={setTab}
            tabs={(['all', 'todo', 'waiting'] as const).map((id) => ({ id, label: t(`inbox.tabs.${id}`) }))}
          />
        </div>
        {rows.length === 0 ? (
          <p className="px-5 py-10 text-center text-muted">{t('inbox.empty')}</p>
        ) : (
          <ul className="divide-y divide-line/70">
            {rows.map((l) => {
              const Icon = CHANNEL_ICON[l.channel]
              const preview = l.origin === 'gerant' ? (l.notes ?? '') : messageSegments(l).map((s) => s.text).join('')
              return (
                <li key={l.id}>
                  <a
                    href={hrefOf(view, 'demande', l.id)}
                    data-crawl-sample
                    onClick={(e) => {
                      e.preventDefault()
                      go(view, 'demande', l.id)
                    }}
                    className="flex items-center gap-4 px-5 py-3.5 transition-colors hover:bg-surface/70"
                  >
                    <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-surface-2/70 text-accent" title={t(`channels.${l.channel}`)}>
                      <Icon size={19} aria-hidden="true" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex flex-wrap items-baseline gap-x-2">
                        <span className="font-semibold text-ink">{l.name}</span>
                        <span className="text-[13px] text-muted">{t('inbox.via', { channel: t(`channels.${l.channel}`) })}</span>
                      </span>
                      <span className="block truncate text-sm text-muted">{preview}</span>
                    </span>
                    <span className="hidden shrink-0 text-[13px] text-muted sm:block">{agoText(l.receivedAt, lang, now)}</span>
                    <StatusBadge tone={LEAD_TONE[l.status]}>{t(`leadStatus.${l.status}`)}</StatusBadge>
                  </a>
                </li>
              )
            })}
          </ul>
        )}
      </Card>
      <AskAgentDialog open={asking} onClose={() => setAsking(false)} />
    </>
  )
}
