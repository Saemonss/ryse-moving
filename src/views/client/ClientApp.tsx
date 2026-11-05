/*
 * Le téléphone du client : un devis à signer s'il y en a un, sinon son portail de suivi.
 */
import { useState } from 'react'
import { useDemo } from '../../store/demoStore'
import { ClientHome } from './ClientHome'
import { ClientQuote, ClientQuoteDone, pendingQuoteLead } from './ClientQuote'

export function ClientApp() {
  const leads = useDemo((s) => s.data.leads)
  const [doneId, setDoneId] = useState<string | null>(null)
  const done = leads.find((l) => l.id === doneId && l.quote?.signedAt)
  if (done) return <ClientQuoteDone lead={done} />
  const pending = pendingQuoteLead(leads)
  if (pending) return <ClientQuote key={pending.id} lead={pending} onDone={() => setDoneId(pending.id)} />
  return <ClientHome />
}
