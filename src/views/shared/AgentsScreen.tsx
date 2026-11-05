/*
 * Page « Agents IA » (vues Commercial et Gérant) : chaque agent, ce qu'il fait, où il serait branché chez le client,
 * ce que l'humain garde, et un interrupteur qui change réellement le comportement de la démo.
 */
import { BellRing, Calculator, Camera, FileText, FlaskConical, Inbox, Moon, Scale, type LucideIcon } from 'lucide-react'
import { useI18n } from '../../i18n'
import { useDemo } from '../../store/demoStore'
import { AGENT_IDS, type AgentId } from '../../data/agents'
import { Card } from '../../ui/Card'
import { toast } from '../../ui/Toast'
import { Button } from '../../ui/Button'
import { go, useRoute } from '../../app/router'
import type { ViewId } from '../../app/views'
import { PageHeader } from './Page'

const ICON: Record<AgentId, LucideIcon> = { accueil: Inbox, volume: Camera, devis: FileText, relances: BellRing, litiges: Scale, resume: Moon }

export function AgentsScreen() {
  const { t } = useI18n()
  const agents = useDemo((s) => s.data.settings.agents)
  const updateSettings = useDemo((s) => s.updateSettings)
  const view = useRoute().view as ViewId
  return (
    <>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <PageHeader title={t('agents.title')} subtitle={t('agents.subtitle')} />
        <Button variant="secondary" icon={Calculator} onClick={() => go(view, 'gains')}>
          {t('gains.menu')}
        </Button>
      </div>
      <p className="mb-6 flex max-w-3xl items-start gap-2.5 rounded-xl bg-surface px-4 py-3 text-[15px] text-ink">
        <FlaskConical size={18} className="mt-0.5 shrink-0 text-accent" aria-hidden="true" />
        <span>
          <strong className="font-semibold">{t('agents.simulated')}.</strong> {t('agents.simulatedHelp')}
        </span>
      </p>
      <Card padded={false}>
        <ul className="divide-y divide-line">
          {AGENT_IDS.map((id) => {
            const Icon = ICON[id]
            const on = agents[id]
            const name = t(`agents.names.${id}`)
            return (
              <li key={id} className="grid gap-x-6 gap-y-3 px-5 py-5 md:grid-cols-[minmax(0,1fr)_auto]">
                <div className="flex gap-4">
                  <span className={`grid size-11 shrink-0 place-items-center rounded-xl ${on ? 'bg-surface-2/70 text-accent' : 'bg-surface text-subtle'}`}>
                    <Icon size={20} aria-hidden="true" />
                  </span>
                  <div className="min-w-0">
                    <h2 className="text-[17px] font-semibold text-ink">{name}</h2>
                    <p className="mt-1 text-[15px] leading-snug text-ink">{t(`agents.doesText.${id}`)}</p>
                    <dl className="mt-3 grid gap-x-4 gap-y-1.5 text-[14px] sm:grid-cols-[auto_1fr]">
                      <dt className="text-muted">{t('agents.plugged')}</dt>
                      <dd className="text-ink">{t(`agents.pluggedText.${id}`)}</dd>
                      <dt className="text-muted">{t('agents.human')}</dt>
                      <dd className="font-medium text-ink">{t(`agents.humanText.${id}`)}</dd>
                    </dl>
                  </div>
                </div>
                <div className="flex items-start md:justify-end">
                  <button
                    type="button"
                    role="switch"
                    aria-checked={on}
                    aria-label={name}
                    onClick={() => {
                      updateSettings({ agents: { ...agents, [id]: !on } })
                      toast(t('agents.toggled', { name, state: (on ? t('agents.off') : t('agents.on')).toLowerCase() }), on ? 'info' : 'success')
                    }}
                    className="group inline-flex min-h-11 items-center gap-3 rounded-full px-1 text-[15px] font-medium focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-accent-pale"
                  >
                    <span className={`relative h-7 w-12 rounded-full transition-colors duration-150 ${on ? 'bg-accent' : 'bg-line'}`} aria-hidden="true">
                      <span
                        className={`absolute left-0 top-0.5 size-6 rounded-full bg-white shadow-sm transition-transform duration-150 ease-out motion-reduce:transition-none ${on ? 'translate-x-[22px]' : 'translate-x-0.5'}`}
                      />
                    </span>
                    <span className={`w-16 text-left ${on ? 'text-ink' : 'text-muted'}`}>{on ? t('agents.on') : t('agents.off')}</span>
                  </button>
                </div>
              </li>
            )
          })}
        </ul>
      </Card>
    </>
  )
}
