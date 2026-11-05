/*
 * Fiche d'une demande. À l'arrivée d'une nouvelle demande, l'agent la traite SOUS LES YEUX du prospect, en étapes
 * animées : lecture (ou transcription) → extraction (morceaux surlignés) → ce qui manque → dossier créé → réponse
 * au client (ou rappel demandé au gérant si la demande vient d'un appel / SMS saisi par lui).
 * Règle d'or : l'agent prépare, l'humain valide ce qui engage l'entreprise.
 */
import { useEffect, useRef, useState } from 'react'
import { ArrowLeft, Bot, CircleCheck, LoaderCircle, Phone, Send, TriangleAlert } from 'lucide-react'
import { translate, useI18n } from '../../i18n'
import { fmtPhone } from '../../i18n/format'
import { useDemo } from '../../store/demoStore'
import { CITIES } from '../../data/lists'
import { addDays } from '../../data/dates'
import { fmtDate } from '../../i18n/format'
import { leadFacts, missingFields, replyMinutes } from '../../data/leads'
import { byId } from '../../data/selectors'
import type { Lead, LeadFacts, LeadField } from '../../data/types'
import { Card } from '../../ui/Card'
import { Button } from '../../ui/Button'
import { Select } from '../../ui/Select'
import { StatusBadge } from '../../ui/StatusBadge'
import { toast } from '../../ui/Toast'
import { go, hrefOf, useRoute } from '../../app/router'
import type { ViewId } from '../../app/views'
import { ScreenLink } from '../shared/ScreenLink'
import { CHANNEL_ICON, agentReply, agoText, fieldValue, messageSegments } from './leadText'
import { LEAD_TONE } from './Inbox'
import { VolumeCard } from './VolumeCard'
import { QuoteCard } from './QuoteCard'

const FIELDS: (LeadField | 'special')[] = ['fromCity', 'fromFloor', 'fromElevator', 'toCity', 'toFloor', 'toElevator', 'date', 'volume', 'special']
const STEP_MS = 1100

export function LeadDetail({ param }: { param?: string }) {
  const { t, lang } = useI18n()
  const data = useDemo((s) => s.data)
  const processLead = useDemo((s) => s.processLead)
  const clientReply = useDemo((s) => s.clientReply)
  const view = useRoute().view as ViewId
  const lead = data.leads.find((l) => l.id === param)
  const back = view === 'commercial' ? { screen: 'demandes', label: t('lead.back') } : { screen: 'accueil', label: t('review.back') }

  // Animation du traitement : étape en cours (0 = pas commencé). Démarre seule pour une nouvelle demande.
  const steps = lead ? stepsFor(lead) : []
  const [step, setStep] = useState(lead?.status === 'nouvelle' ? 0 : steps.length)
  const done = useRef(false)
  useEffect(() => {
    if (!lead || lead.status !== 'nouvelle') return
    if (step >= steps.length) {
      if (!done.current) {
        done.current = true
        processLead(lead.id)
      }
      return
    }
    const id = window.setTimeout(() => setStep((s) => s + 1), STEP_MS)
    return () => window.clearTimeout(id)
  }, [step, lead, steps.length, processLead])

  const backLink = (
    <a
      href={hrefOf(view, back.screen)}
      onClick={(e) => {
        e.preventDefault()
        go(view, back.screen)
      }}
      className="mb-4 inline-flex items-center gap-1.5 rounded-md text-sm font-medium text-muted hover:text-ink"
    >
      <ArrowLeft size={16} aria-hidden="true" />
      {back.label}
    </a>
  )
  if (!lead)
    return (
      <>
        {backLink}
        <Card title={t('file.notFound')}>
          <p className="text-muted">{t('file.notFoundText')}</p>
        </Card>
      </>
    )

  const processing = lead.status === 'nouvelle'
  const extracted = !processing || step >= 2
  const Icon = CHANNEL_ICON[lead.channel]
  const move = byId(data.moves, lead.moveId)
  const missing = missingFields(leadFacts(lead))

  return (
    <>
      {backLink}
      <header className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="grid size-12 place-items-center rounded-2xl bg-surface-2/70 text-accent">
            <Icon size={22} aria-hidden="true" />
          </span>
          <div>
            <h1 className="text-[26px] font-semibold leading-tight tracking-[-0.02em]">{lead.name}</h1>
            <p className="text-[15px] text-muted">
              {t(`channels.${lead.channel}`)} · {agoText(lead.receivedAt, lang)} · {fmtPhone(lead.phone)}
            </p>
          </div>
        </div>
        <StatusBadge tone={LEAD_TONE[lead.status]} size="lg">
          {t(`leadStatus.${lead.status}`)}
        </StatusBadge>
      </header>

      {processing && <AgentSteps steps={steps} step={step} />}

      <div className="grid gap-6 lg:grid-cols-2">
        <Card title={lead.origin === 'gerant' ? t('lead.notes') : t('lead.original')}>
          {lead.origin === 'gerant' ? (
            <p className="whitespace-pre-line text-[16px] leading-relaxed">{lead.notes}</p>
          ) : (
            <p className="text-[16px] leading-relaxed" lang={lead.lang === 'nl' ? 'nl-BE' : 'fr-BE'}>
              {messageSegments(lead).map((s, i) =>
                s.field && extracted ? (
                  <mark key={i} className="rounded bg-accent-pale/70 px-0.5 text-ink transition-colors duration-500">
                    {s.text}
                  </mark>
                ) : (
                  <span key={i}>{s.text}</span>
                ),
              )}
            </p>
          )}
        </Card>

        <Card title={t('lead.understood')} aside={<StatusBadge tone="accent">{t('lead.prepared')}</StatusBadge>}>
          <dl className="grid grid-cols-[minmax(0,180px)_1fr] gap-x-4 gap-y-2 text-[15px]">
            {FIELDS.map((f) => {
              const v = extracted ? fieldValue(lead, f, lang) : undefined
              if (f === 'special' && !v) return null
              const isMissing = f !== 'special' && f !== 'volume' && missing.includes(f as LeadField)
              return (
                <div key={f} className="contents">
                  <dt className="text-muted">{t(`fields.${f}`)}</dt>
                  <dd className={v ? 'font-medium text-ink' : isMissing && extracted ? 'font-medium text-warning' : 'text-subtle'}>
                    {v ?? (extracted ? t('fields.unknown') : '…')}
                  </dd>
                </div>
              )
            })}
          </dl>
          {extracted && (!processing || step >= 3) && (
            <div className="mt-4 border-t border-line pt-3">
              <p className="mb-2 text-sm font-semibold text-muted">{t('lead.missing')}</p>
              {missing.length === 0 ? (
                <p className="flex items-center gap-1.5 text-[15px] text-success">
                  <CircleCheck size={17} aria-hidden="true" />
                  {t('lead.nothingMissing')}
                </p>
              ) : (
                <p className="flex flex-wrap gap-1.5">
                  {missing.map((m) => (
                    <StatusBadge key={m} tone="warning">
                      {t(`fields.${m}`)}
                    </StatusBadge>
                  ))}
                </p>
              )}
            </div>
          )}
        </Card>
      </div>

      {!processing && (
        <div className="mt-6 space-y-6">
          {move && (
            <p className="flex flex-wrap items-center gap-3 text-[15px]">
              <CircleCheck size={18} className="text-success" aria-hidden="true" />
              {t('lead.file', { ref: move.ref })}
              <ScreenLink view="gerant" screen="dossier" param={move.id} arrow className="text-sm">
                {t('lead.openFile')}
              </ScreenLink>
            </p>
          )}

          {lead.status === 'atypique' && <Atypical lead={lead} />}
          {lead.status === 'rappel' && <Callback lead={lead} />}

          {lead.origin === 'client' && lead.replyAt && (
            <Card
              title={t('lead.reply')}
              aside={
                <span className="flex items-center gap-2">
                  <StatusBadge tone="success">{t('lead.replied', { n: replyMinutes(lead) ?? 2 })}</StatusBadge>
                  <StatusBadge tone="accent">{t('lead.prepared')}</StatusBadge>
                </span>
              }
            >
              <p className="mb-2 text-[13px] text-muted">{t('lead.sentVia', { channel: t(`channels.${lead.channel}`) })}</p>
              <p className="whitespace-pre-line rounded-xl bg-surface px-4 py-3 text-[15px] leading-relaxed" lang={lead.lang === 'nl' ? 'nl-BE' : 'fr-BE'}>
                {agentReply(lead)}
              </p>
              {lead.status === 'attenteClient' && (
                <div className="mt-4 flex items-center gap-3">
                  <Button
                    variant="secondary"
                    icon={Send}
                    onClick={() => {
                      clientReply(lead.id)
                      toast(t('lead.clientReplied'))
                    }}
                  >
                    {t('lead.simulateReply')}
                  </Button>
                  <StatusBadge tone="neutral">{t('lead.demo')}</StatusBadge>
                </div>
              )}
            </Card>
          )}

          {lead.clientReplyAt && Object.keys(lead.added).length > 0 && lead.origin === 'client' && (
            <Card title={t('lead.clientReplied')}>
              <p className="rounded-xl bg-surface-2/50 px-4 py-3 text-[15px]" lang={lead.lang === 'nl' ? 'nl-BE' : 'fr-BE'}>
                {translate(lead.lang, 'agentMsg.clientReply')}
              </p>
            </Card>
          )}

          {lead.moveId && (lead.status === 'complete' || lead.status === 'attenteClient') && <VolumeCard lead={lead} />}
          {lead.moveId && (lead.status === 'complete' || lead.quote) && <QuoteCard lead={lead} />}
        </div>
      )}
    </>
  )
}

/** Étapes affichées pendant le traitement, selon le canal et l'origine. */
function stepsFor(lead: Lead): string[] {
  const missing = missingFields(lead.facts).length > 0
  const first = lead.channel === 'appel' || lead.channel === 'vocal' ? 'transcribe' : 'read'
  if (lead.facts.special === 'coffre') return [first, 'extract', 'missing']
  if (lead.origin === 'gerant') return [first, 'extract', 'missing', 'file', ...(missing ? ['callback'] : [])]
  return [first, 'extract', 'missing', 'file', 'reply']
}

function AgentSteps({ steps, step }: { steps: string[]; step: number }) {
  const { t } = useI18n()
  return (
    <section aria-live="polite" className="mb-6 rounded-2xl border border-accent-pale bg-white p-5 shadow-card">
      <p className="mb-3 flex items-center gap-2 font-semibold text-accent">
        <Bot size={19} aria-hidden="true" />
        {t('lead.processing')}
      </p>
      <ol className="space-y-2">
        {steps.map((s, i) => (
          <li key={s} className={`flex items-center gap-2.5 text-[15px] transition-opacity duration-300 ${i <= step ? 'opacity-100' : 'opacity-40'}`}>
            {i < step ? (
              <CircleCheck size={18} className="text-success" aria-hidden="true" />
            ) : i === step ? (
              <LoaderCircle size={18} className="text-accent motion-safe:animate-spin" aria-hidden="true" />
            ) : (
              <span className="size-[18px] rounded-full border-2 border-line" aria-hidden="true" />
            )}
            {t(`lead.steps.${s as 'read'}`)}
          </li>
        ))}
      </ol>
    </section>
  )
}

function Atypical({ lead }: { lead: Lead }) {
  const { t } = useI18n()
  return (
    <section className="rounded-2xl border border-danger/25 bg-danger-soft/60 px-5 py-4">
      <p className="flex items-center gap-2 font-semibold text-danger">
        <TriangleAlert size={18} aria-hidden="true" />
        {t('lead.atypical')}
      </p>
      <p className="mt-1 text-[15px] text-ink">{t('lead.atypicalWhy')}</p>
      <Button className="mt-3" variant="secondary" icon={Phone} onClick={() => toast(t('lead.calling', { name: lead.name, phone: fmtPhone(lead.phone) }), 'info')}>
        {t('lead.call')}
      </Button>
    </section>
  )
}

/** Rappel guidé : le gérant appelle le prospect, note ses réponses (un choix par question), puis renvoie à l'agent. */
function Callback({ lead }: { lead: Lead }) {
  const { t, lang } = useI18n()
  const completeCallback = useDemo((s) => s.completeCallback)
  const today = useDemo((s) => s.seedDay)
  const [answers, setAnswers] = useState<LeadFacts>({})
  const questions = lead.callback?.questions ?? []
  const set = (k: LeadField, v: string) =>
    setAnswers((a) => {
      const next = { ...a }
      if (v === '') delete next[k]
      else if (k === 'fromCity' || k === 'toCity' || k === 'date') next[k] = v
      else if (k === 'fromElevator' || k === 'toElevator') next[k] = v === 'yes'
      else next[k] = Number(v)
      return next
    })
  const choose = '—'
  const options = (k: LeadField) =>
    k === 'fromCity' || k === 'toCity'
      ? CITIES.map((c) => ({ value: c.id, label: c[lang] }))
      : k === 'fromElevator' || k === 'toElevator'
        ? [{ value: 'yes', label: t('fields.yes') }, { value: 'no', label: t('fields.no') }]
        : k === 'date'
          ? Array.from({ length: 12 }, (_, i) => {
              const iso = addDays(today, 14 + i * 7)
              return { value: iso, label: fmtDate(iso, lang, 'weekday') }
            })
          : k === 'volume'
            ? Array.from({ length: 15 }, (_, i) => ({ value: String(10 + i * 5), label: t('common.volume', { n: 10 + i * 5 }) }))
            : Array.from({ length: 9 }, (_, i) => ({ value: String(i), label: i === 0 ? t('common.groundFloor') : t('common.floor', { n: i }) }))
  const answered = Object.keys(answers).length
  return (
    <Card title={t('callback.title')} aside={<StatusBadge tone="warning">{t('leadStatus.rappel')}</StatusBadge>}>
      <p className="mb-3 text-[15px]">{t('callback.why', { name: lead.name })}</p>
      <Button variant="secondary" icon={Phone} onClick={() => toast(t('lead.calling', { name: lead.name, phone: fmtPhone(lead.phone) }), 'info')}>
        {`${t('lead.call')} · ${fmtPhone(lead.phone)}`}
      </Button>
      <p className="mb-2 mt-5 text-sm font-semibold text-muted">{t('callback.answers')}</p>
      <div className="grid gap-3 sm:grid-cols-2">
        {questions.map((q) => (
          <Select
            key={q}
            label={translate(lang, `agentMsg.q.${q}`).replace(/^./, (c) => c.toUpperCase())}
            value={answers[q] === undefined ? '' : typeof answers[q] === 'boolean' ? (answers[q] ? 'yes' : 'no') : String(answers[q])}
            onChange={(v) => set(q, v)}
            options={[{ value: '', label: choose }, ...options(q)]}
          />
        ))}
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <Button
          icon={Bot}
          disabled={answered === 0}
          aria-describedby={answered === 0 ? 'callback-hint' : undefined}
          onClick={() => {
            completeCallback(lead.id, answers)
            toast(t('callback.sent'))
          }}
        >
          {t('callback.send')}
        </Button>
        {answered === 0 && (
          <p id="callback-hint" className="text-[13px] text-muted">
            {t('callback.hint')}
          </p>
        )}
      </div>
    </Card>
  )
}
