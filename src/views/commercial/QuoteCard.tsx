/*
 * Devis préparé par l'agent, validé par l'humain : lignes calculées avec la grille tarifaire, options proposées
 * avec leur raison, chaque ligne modifiable (total, acompte et marge prévue recalculés en direct).
 * « Valider et envoyer » = action humaine obligatoire → PDF + vue Client pour la signature.
 */
import { useEffect, useState } from 'react'
import { CircleCheck, FileText, Lightbulb, Send, Smartphone, Sparkles } from 'lucide-react'
import { useI18n } from '../../i18n'
import { fmtDate, fmtMoney, fmtNumber, fmtTime } from '../../i18n/format'
import { useDemo } from '../../store/demoStore'
import { quoteDeposit, quoteMargin, quoteTotal } from '../../data/quote'
import type { Lead } from '../../data/types'
import { Card } from '../../ui/Card'
import { Button } from '../../ui/Button'
import { StatusBadge } from '../../ui/StatusBadge'
import { AiProcessing } from '../../ui/AiProcessing'
import { clearToasts, toast } from '../../ui/Toast'
import { go } from '../../app/router'
import { quotePdfUrl } from '../../pdf/quotePdf'

export function QuoteCard({ lead }: { lead: Lead }) {
  const { t, lang } = useI18n()
  const data = useDemo((s) => s.data)
  const today = useDemo((s) => s.seedDay)
  const prepare = useDemo((s) => s.prepareQuote)
  const setLine = useDemo((s) => s.setQuoteLine)
  const sendQuote = useDemo((s) => s.sendQuote)
  const [preparing, setPreparing] = useState(false)
  const [busy, setBusy] = useState(false)
  useEffect(() => {
    if (!preparing) return
    const id = window.setTimeout(() => {
      prepare(lead.id)
      setPreparing(false)
    }, 1400)
    return () => window.clearTimeout(id)
  }, [preparing, prepare, lead.id])

  const move = data.moves.find((m) => m.id === lead.moveId)
  const q = lead.quote
  if (!move) return null

  const openPdf = async () => {
    try {
      const url = await quotePdfUrl(useDemo.getState().data.leads.find((l) => l.id === lead.id)!, move, data.customers.find((c) => c.id === move.customerId), today)
      window.open(url, '_blank', 'noopener')
    } catch {
      toast(t('quote.pdfError'), 'info')
    }
  }

  if (!q)
    return (
      <Card title={t('quote.title')}>
        {preparing ? (
          <AiProcessing label={t('quote.preparing')} />
        ) : (
          <Button icon={Sparkles} onClick={() => setPreparing(true)}>
            {t('quote.prepare')}
          </Button>
        )}
      </Card>
    )

  const total = quoteTotal(q)
  const margin = quoteMargin(q, move, data)
  const low = margin.rate * 100 < data.settings.marginThresholdPct
  const sent = !!q.sentAt
  const euros = (c: number) => (c / 100).toFixed(2).replace('.', ',')

  return (
    <Card
      title={t('quote.title')}
      aside={
        q.signedAt ? (
          <StatusBadge tone="success">{t('quote.status.signed')}</StatusBadge>
        ) : sent ? (
          <StatusBadge tone="info">{t('quote.status.sent')}</StatusBadge>
        ) : (
          <StatusBadge tone="accent">{t('lead.prepared')}</StatusBadge>
        )
      }
    >
      {!sent && <p className="mb-3 text-[15px] text-muted">{t('quote.intro')}</p>}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[560px] text-[15px]">
          <thead>
            <tr className="border-b border-line text-left text-[13px] text-muted">
              <th className="py-2 font-medium">{t('quote.colLine')}</th>
              <th className="py-2 text-right font-medium">{t('quote.colQty')}</th>
              <th className="py-2 text-right font-medium">{t('quote.colUnit')}</th>
              <th className="py-2 text-right font-medium">{t('quote.colTotal')}</th>
            </tr>
          </thead>
          <tbody className="tabular">
            {q.lines.map((l) => (
              <tr key={l.id} className="border-b border-line/60 align-top">
                <td className="py-2 pr-3">
                  <span className="font-medium">{t(`quote.lines.${l.kind}`)}</span>
                  {l.reason && (
                    <span className="mt-0.5 flex items-start gap-1.5 text-[13px] text-accent">
                      <Lightbulb size={14} className="mt-0.5 shrink-0" aria-hidden="true" />
                      {t(`quote.reasons.${l.reason}`)}
                    </span>
                  )}
                </td>
                <td className="py-2 text-right">
                  {sent ? (
                    fmtNumber(l.qty, lang)
                  ) : (
                    <input
                      inputMode="decimal"
                      aria-label={`${t('quote.colQty')} · ${t(`quote.lines.${l.kind}`)}`}
                      value={String(l.qty)}
                      onChange={(e) => setLine(lead.id, l.id, { qty: Number(e.target.value.replace(',', '.')) })}
                      className="h-9 w-20 rounded-lg border border-line px-2 text-right focus:border-accent focus:outline-none focus:ring-4 focus:ring-accent-pale/60"
                    />
                  )}
                </td>
                <td className="py-2 text-right">
                  {sent ? (
                    fmtMoney(l.unitCents, lang)
                  ) : (
                    <input
                      inputMode="decimal"
                      aria-label={t('quote.unitLabel', { line: t(`quote.lines.${l.kind}`) })}
                      defaultValue={euros(l.unitCents)}
                      onChange={(e) => {
                        const n = Number(e.target.value.replace(',', '.'))
                        if (e.target.value.trim() !== '' && Number.isFinite(n)) setLine(lead.id, l.id, { unitCents: Math.round(n * 100) })
                      }}
                      className="h-9 w-28 rounded-lg border border-line px-2 text-right focus:border-accent focus:outline-none focus:ring-4 focus:ring-accent-pale/60"
                    />
                  )}
                </td>
                <td className="py-2 text-right font-medium">{fmtMoney(l.qty * l.unitCents, lang)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <dl className="tabular mt-4 ml-auto max-w-sm space-y-1.5 text-[15px]">
        <div className="flex justify-between gap-4 text-[18px] font-semibold">
          <dt>{t('quote.total')}</dt>
          <dd>{fmtMoney(total, lang)}</dd>
        </div>
        <div className="flex justify-between gap-4 text-muted">
          <dt>{t('quote.deposit', { pct: q.depositPct })}</dt>
          <dd>{fmtMoney(quoteDeposit(q), lang)}</dd>
        </div>
        <div className={`flex justify-between gap-4 font-medium ${low ? 'text-danger' : 'text-success'}`}>
          <dt>{low ? t('quote.marginLow', { threshold: data.settings.marginThresholdPct }) : t('quote.margin', { pct: Math.round(margin.rate * 100) })}</dt>
          <dd>{low ? `${Math.round(margin.rate * 100)} %` : ''}</dd>
        </div>
      </dl>

      <div className="mt-5 flex flex-wrap items-center gap-3 border-t border-line pt-4">
        {!sent ? (
          <>
            <Button
              icon={Send}
              disabled={busy}
              onClick={() => {
                if (busy) return
                setBusy(true)
                if (sendQuote(lead.id)) toast(t('quote.sent', { name: lead.name, channel: t(`channels.${lead.channel}`) }))
                setBusy(false)
              }}
            >
              {t('quote.send')}
            </Button>
            <span className="text-[13px] text-muted">{t('quote.sendHint')}</span>
          </>
        ) : (
          <>
            <span className="flex items-center gap-1.5 text-[15px] text-success">
              <CircleCheck size={17} aria-hidden="true" />
              {q.signedAt
                ? t('quote.signed', { date: fmtDate(q.signedAt.slice(0, 10), lang, 'dayMonth'), time: fmtTime(q.signedAt, lang) })
                : t('quote.sentOn', { date: fmtDate(q.sentAt!.slice(0, 10), lang, 'dayMonth'), time: fmtTime(q.sentAt!, lang) })}
            </span>
            <Button variant="secondary" icon={FileText} onClick={openPdf}>
              {t('quote.pdf')}
            </Button>
            {!q.signedAt && (
              <Button variant="ghost" icon={Smartphone} onClick={() => {
                  clearToasts()
                  go('client')
                }}>
                {t('quote.seeInClient')}
              </Button>
            )}
          </>
        )}
      </div>
    </Card>
  )
}
