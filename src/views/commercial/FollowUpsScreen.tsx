/*
 * Commercial › Relances : les devis envoyés sans réponse, avec le moment conseillé pour relancer.
 * L'agent rédige la relance (langue et canal du client, ton adapté) ; le commercial valide l'envoi.
 * Jamais de remise proposée par l'IA.
 */
import { useEffect, useState } from 'react'
import { Send, ShieldCheck, Sparkles } from 'lucide-react'
import { useI18n } from '../../i18n'
import { fmtDate, fmtMoney } from '../../i18n/format'
import { useDemo } from '../../store/demoStore'
import { useViewUser } from '../../app/shellState'
import { customerLang, followUps, reminderText, replyChannel, type FollowUp } from '../../data/followups'
import { cityLabel } from '../../data/leads'
import { Card } from '../../ui/Card'
import { Button } from '../../ui/Button'
import { StatusBadge } from '../../ui/StatusBadge'
import { TextArea } from '../../ui/Field'
import { AiProcessing } from '../../ui/AiProcessing'
import { toast } from '../../ui/Toast'
import { PageHeader } from '../shared/Page'
import { ScreenLink } from '../shared/ScreenLink'

export function FollowUpsScreen() {
  const { t } = useI18n()
  const data = useDemo((s) => s.data)
  const today = useDemo((s) => s.seedDay)
  const list = followUps(data, today)
  const agentOn = data.settings.agents.relances
  return (
    <>
      <PageHeader title={t('followup.title')} subtitle={t('followup.subtitle')} />
      {!agentOn && (
        <p className="mb-4 flex flex-wrap items-center gap-x-3 gap-y-1 rounded-xl bg-surface px-4 py-3 text-[15px] text-ink">
          {t('agents.offNote.relances')}
          <ScreenLink view="commercial" screen="agents">
            {t('agents.reactivate')}
          </ScreenLink>
        </p>
      )}
      {list.length === 0 ? (
        <Card>
          <p className="text-muted">{t('followup.empty')}</p>
        </Card>
      ) : (
        <ul className="space-y-3">
          {list.map((f) => (
            <FollowUpRow key={f.move.id} f={f} />
          ))}
        </ul>
      )}
    </>
  )
}

function FollowUpRow({ f }: { f: FollowUp }) {
  const { t, lang } = useI18n()
  const data = useDemo((s) => s.data)
  const sendReminder = useDemo((s) => s.sendReminder)
  const sender = useViewUser('commercial').name
  const [phase, setPhase] = useState<'idle' | 'preparing' | 'draft'>('idle')
  const [text, setText] = useState('')
  const { move, days } = f
  const customer = data.customers.find((c) => c.id === move.customerId)
  const who = customer?.name ?? move.ref
  const clientLang = customerLang(data, move)
  const channel = replyChannel(data, move)
  const done = !!move.quoteReminderOn

  useEffect(() => {
    if (phase !== 'preparing') return
    const id = window.setTimeout(() => {
      setText(reminderText(useDemo.getState().data, move, days, sender))
      setPhase('draft')
    }, 1200)
    return () => window.clearTimeout(id)
  }, [phase, move, days, sender])

  return (
    <li className="rounded-2xl border border-line/80 bg-white shadow-card">
      <div className="flex flex-wrap items-center gap-x-5 gap-y-3 px-5 py-4">
        <div className="min-w-0 flex-1" data-crawl-sample>
          <ScreenLink view="gerant" screen="dossier" param={move.id} className="font-semibold text-ink">
            {who}
          </ScreenLink>
          <p className="mt-0.5 text-[14px] text-muted">
            {move.ref} · {cityLabel(move.from.cityId, lang)}
            {move.to ? ` → ${cityLabel(move.to.cityId, lang)}` : ''} · {days === 0 ? t('followup.sentToday') : t('followup.sent', { n: days })}
          </p>
        </div>
        <span className="tabular text-[16px] font-semibold">{fmtMoney(move.priceCents, lang)}</span>
        {done ? (
          <StatusBadge tone="success">{t('followup.doneOn', { date: fmtDate(move.quoteReminderOn!, lang, 'dayMonth') })}</StatusBadge>
        ) : f.due ? (
          <StatusBadge tone="warning">{t('followup.dueNow')}</StatusBadge>
        ) : (
          <StatusBadge tone="neutral">{t('followup.dueOn', { date: fmtDate(f.advisedOn, lang, 'dayMonth') })}</StatusBadge>
        )}
        {!done && phase === 'idle' && data.settings.agents.relances && (
          <Button variant={f.due ? 'primary' : 'secondary'} icon={Sparkles} onClick={() => setPhase('preparing')}>
            {t('followup.prepare')}
          </Button>
        )}
      </div>

      {!done && phase === 'preparing' && (
        <div className="border-t border-line px-5 py-4">
          <AiProcessing label={t('followup.preparing')} />
        </div>
      )}
      {!done && phase === 'draft' && (
        <div className="border-t border-line px-5 py-4">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <StatusBadge tone="accent">{t('lead.prepared')}</StatusBadge>
            <span className="text-[14px] text-muted">
              {t('followup.via', { channel: t(`channels.${channel}`), lang: t(`followup.langs.${clientLang}`) })}
            </span>
          </div>
          <TextArea
            label={t('followup.draftLabel', { name: who })}
            rows={13}
            value={text}
            onChange={(e) => setText(e.target.value)}
            lang={clientLang === 'nl' ? 'nl-BE' : 'fr-BE'}
          />
          <p className="mt-2 flex items-center gap-1.5 text-[14px] text-muted">
            <ShieldCheck size={16} className="shrink-0 text-accent" aria-hidden="true" />
            {t('followup.noDiscount')}
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Button
              icon={Send}
              disabled={text.trim() === ''}
              onClick={() => {
                if (sendReminder(move.id)) toast(t('followup.done', { name: who, channel: t(`channels.${channel}`) }))
                setPhase('idle')
              }}
            >
              {t('followup.send')}
            </Button>
            <Button variant="ghost" onClick={() => setPhase('idle')}>
              {t('followup.cancel')}
            </Button>
          </div>
        </div>
      )}
    </li>
  )
}
