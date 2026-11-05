/*
 * Litige › « Préparer avec l'IA » : l'agent rassemble photos, signature et faits, rédige une réponse au client
 * (dans sa langue) et un brouillon de déclaration à l'assurance. La décision reste au gérant.
 */
import { useEffect, useState } from 'react'
import { CircleCheck, ClipboardCopy, Scale, Send, Sparkles } from 'lucide-react'
import { useI18n } from '../../i18n'
import { fmtDate, fmtTime } from '../../i18n/format'
import { useDemo } from '../../store/demoStore'
import { useViewUser } from '../../app/shellState'
import { claimBrief } from '../../data/followups'
import type { Claim } from '../../data/types'
import { Card } from '../../ui/Card'
import { Button } from '../../ui/Button'
import { StatusBadge } from '../../ui/StatusBadge'
import { TextArea } from '../../ui/Field'
import { AiProcessing } from '../../ui/AiProcessing'
import { toast } from '../../ui/Toast'

export function ClaimAiCard({ claim }: { claim: Claim }) {
  const { t, lang } = useI18n()
  const data = useDemo((s) => s.data)
  const prepareClaim = useDemo((s) => s.prepareClaim)
  const sendClaimReply = useDemo((s) => s.sendClaimReply)
  const sender = useViewUser('gerant').name
  const [preparing, setPreparing] = useState(false)
  const brief = claimBrief(data, claim, lang, sender)
  const [reply, setReply] = useState(brief.reply)
  const [insurance, setInsurance] = useState(brief.insurance)
  // Brouillons recalculés si la langue de l'écran change avant toute retouche
  useEffect(() => {
    setInsurance(claimBrief(useDemo.getState().data, claim, lang, sender).insurance)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lang, claim.id, sender])

  useEffect(() => {
    if (!preparing) return
    const id = window.setTimeout(() => {
      prepareClaim(claim.id)
      setPreparing(false)
    }, 1600)
    return () => window.clearTimeout(id)
  }, [preparing, prepareClaim, claim.id])

  if (!claim.aiPreparedAt && !data.settings.agents.litiges) return null
  if (!claim.aiPreparedAt)
    return (
      <Card title={t('claimAi.title')} className="mt-6">
        <p className="mb-4 max-w-2xl text-[15px] text-muted">{t('claimAi.intro')}</p>
        {preparing ? (
          <AiProcessing label={t('claimAi.preparing')} />
        ) : (
          <Button icon={Sparkles} onClick={() => setPreparing(true)}>
            {t('claimAi.prepare')}
          </Button>
        )}
      </Card>
    )

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(insurance)
    } catch {
      // Presse-papiers indisponible (navigateur verrouillé) : le texte reste sélectionnable à l'écran
    }
    toast(t('claimAi.copied'))
  }

  return (
    <Card title={t('claimAi.title')} aside={<StatusBadge tone="accent">{t('lead.prepared')}</StatusBadge>} className="mt-6">
      <div className="grid gap-6 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1fr)]">
        <div>
          <h3 className="mb-2 text-sm font-semibold text-muted">{t('claimAi.summary')}</h3>
          <ul className="space-y-2 text-[15px]">
            {brief.facts.map((f, i) => (
              <li key={i} className="flex gap-2">
                <CircleCheck size={17} className="mt-0.5 shrink-0 text-accent" aria-hidden="true" />
                {f}
              </li>
            ))}
          </ul>
          <p className="mt-5 flex items-start gap-2 rounded-xl bg-surface px-4 py-3 text-[15px] font-medium text-ink">
            <Scale size={18} className="mt-0.5 shrink-0 text-accent" aria-hidden="true" />
            {t('claimAi.decision')}
          </p>
        </div>
        <div className="space-y-5">
          <div>
            {claim.replySentAt ? (
              <p className="whitespace-pre-line rounded-xl bg-surface px-4 py-3 text-[15px] leading-relaxed" lang={brief.lang === 'nl' ? 'nl-BE' : 'fr-BE'}>
                {claim.replyText ?? reply}
              </p>
            ) : (
              <TextArea
                label={t('claimAi.replyLabel')}
                rows={11}
                value={reply}
                onChange={(e) => setReply(e.target.value)}
                lang={brief.lang === 'nl' ? 'nl-BE' : 'fr-BE'}
              />
            )}
            <div className="mt-3">
              {claim.replySentAt ? (
                <p className="flex items-center gap-1.5 text-[15px] text-success">
                  <CircleCheck size={17} aria-hidden="true" />
                  {t('claimAi.replySent', { date: fmtDate(claim.replySentAt.slice(0, 10), lang, 'dayMonth'), time: fmtTime(claim.replySentAt, lang) })}
                </p>
              ) : (
                <Button
                  icon={Send}
                  onClick={() => {
                    if (sendClaimReply(claim.id, reply)) toast(t('claimAi.replyDone'))
                  }}
                >
                  {t('claimAi.sendReply')}
                </Button>
              )}
            </div>
          </div>
          <div>
            <TextArea label={t('claimAi.insuranceLabel')} rows={13} value={insurance} onChange={(e) => setInsurance(e.target.value)} />
            <Button variant="secondary" icon={ClipboardCopy} className="mt-3" onClick={copy}>
              {t('claimAi.copy')}
            </Button>
          </div>
        </div>
      </div>
    </Card>
  )
}
