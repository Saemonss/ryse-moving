/*
 * Vue Client (téléphone) : le client reçoit son devis, le lit, le signe au doigt. Le dossier passe alors à
 * « devis signé » et arrive dans les dossiers à planifier : demande → devis → planning, sans ressaisie.
 */
import { useState } from 'react'
import { CircleCheck, PenLine } from 'lucide-react'
import { translate, type TKey } from '../../i18n'
import { fmtDate, fmtMoney } from '../../i18n/format'
import { useDemo } from '../../store/demoStore'
import { cityLabel } from '../../data/leads'
import { quoteDeposit, quoteTotal } from '../../data/quote'
import type { Lead } from '../../data/types'
import { PhoneScreen } from '../../ui/phone/PhoneKit'
import { SignaturePad } from '../../ui/phone/SignaturePad'

/** Le devis envoyé le plus récent, pas encore signé. */
export const pendingQuoteLead = (leads: Lead[]) => leads.filter((l) => l.quote?.sentAt && !l.quote.signedAt).sort((a, b) => (b.quote!.sentAt! > a.quote!.sentAt! ? 1 : -1))[0]

export function ClientQuote({ lead, onDone }: { lead: Lead; onDone: () => void }) {
  // Le client lit SON devis dans SA langue (pas celle de l'écran du présentateur)
  const l = lead.lang
  const t = (k: TKey, v?: Record<string, string | number>) => translate(l, k, v)
  const data = useDemo((s) => s.data)
  const signQuote = useDemo((s) => s.signQuote)
  const [phase, setPhase] = useState<'read' | 'sign'>('read')
  const [image, setImage] = useState<string | null>(null)
  const move = data.moves.find((m) => m.id === lead.moveId)
  const q = lead.quote!
  const first = lead.name.split(' ')[0] ?? lead.name

  if (phase === 'sign')
    return (
      <PhoneScreen
        now={t('clientQuote.now.sign')}
        title={t('clientQuote.signTitle')}
        onBack={() => setPhase('read')}
        action={{
          label: t('clientQuote.validate'),
          icon: CircleCheck,
          disabled: !image,
          hint: t('clientQuote.needSign'),
          onClick: () => {
            if (!image) return
            signQuote(lead.id, lead.name, image)
            onDone()
          },
        }}
      >
        <p className="text-[19px] font-bold">{lead.name}</p>
        <SignaturePad onChange={setImage} />
      </PhoneScreen>
    )

  return (
    <PhoneScreen now={t('clientQuote.now.read')} title={t('clientQuote.hello', { name: first })} action={{ label: t('clientQuote.sign'), icon: PenLine, onClick: () => setPhase('sign') }}>
      <p className="-mt-1 leading-snug text-muted">{t('clientQuote.intro')}</p>
      <section className="rounded-2xl bg-white p-4 shadow-card ring-1 ring-line">
        <p className="text-[15px] font-medium text-muted">
          {t('clientQuote.title')} · {move?.ref}
        </p>
        {move && (
          <p className="mt-1 font-semibold leading-snug">
            {cityLabel(move.from.cityId, l)} → {move.to ? cityLabel(move.to.cityId, l) : ''} · {fmtDate(move.date, l, 'dayMonth')}
          </p>
        )}
        <ul className="mt-3 space-y-1.5 text-[16px]">
          {q.lines.map((line) => (
            <li key={line.id} className="flex justify-between gap-3">
              <span>{t(`quote.lines.${line.kind}`)}</span>
              <span className="tabular whitespace-nowrap">{fmtMoney(line.qty * line.unitCents, l)}</span>
            </li>
          ))}
        </ul>
        <div className="tabular mt-3 space-y-1 border-t border-line pt-3">
          <p className="flex justify-between text-[20px] font-bold">
            <span>{t('clientQuote.total')}</span>
            <span>{fmtMoney(quoteTotal(q), l)}</span>
          </p>
          <p className="flex justify-between text-muted">
            <span>{t('clientQuote.deposit')}</span>
            <span>{fmtMoney(quoteDeposit(q), l)}</span>
          </p>
        </div>
      </section>
    </PhoneScreen>
  )
}

export function ClientQuoteDone({ lead }: { lead: Lead }) {
  const t = (k: TKey) => translate(lead.lang, k)
  return (
    <PhoneScreen now={t('clientQuote.now.done')}>
      <div className="flex flex-col items-center gap-3 py-8 text-center">
        <span className="grid size-20 place-items-center rounded-full bg-success-soft text-success animate-[rm-scale-in_240ms_var(--ease-out)]">
          <CircleCheck size={44} aria-hidden="true" />
        </span>
        <p className="text-[24px] font-bold">{t('clientQuote.done')}</p>
        <p className="text-muted">{t('clientQuote.doneHelp')}</p>
      </div>
    </PhoneScreen>
  )
}
