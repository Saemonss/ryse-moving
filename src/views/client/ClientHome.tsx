/*
 * Accueil du client (dans le cadre de téléphone) : son déménagement en une carte, et ce qui arrive ensuite.
 */
import { CalendarDays, MapPin, Phone } from 'lucide-react'
import { useI18n } from '../../i18n'
import { fmtDate } from '../../i18n/format'
import { useDemo } from '../../store/demoStore'
import { CLIENT_CUSTOMER_ID } from '../../data/seed'
import { STATUS_TONE, byId, fmtAddress, fullName } from '../../data/selectors'
import { StatusBadge } from '../../ui/StatusBadge'
import { UpcomingPreview } from '../shared/Page'
import { useViewUser } from '../../app/shellState'

export function ClientHome() {
  const { t, lang } = useI18n()
  const data = useDemo((s) => s.data)
  const user = useViewUser('client')
  const move = data.moves.find((m) => m.customerId === CLIENT_CUSTOMER_ID)
  const sales = byId(data.staff, 's-julie')

  return (
    <div className="space-y-4 px-5 pb-6 pt-3 text-[17px] text-ink">
      <header>
        <h1 className="text-[28px] font-bold leading-tight tracking-[-0.02em]">{t('client.hello', { name: user.firstName })}</h1>
      </header>

      {move && (
        <section aria-labelledby="client-move" className="rounded-2xl border border-line bg-white p-4 shadow-card">
          <div className="flex items-center justify-between gap-2">
            <h2 id="client-move" className="text-[15px] font-medium text-muted">
              {t('client.yourMove')}
            </h2>
            <StatusBadge tone={STATUS_TONE[move.status]}>{t(`status.${move.status}`)}</StatusBadge>
          </div>
          <p className="mt-2 flex items-center gap-2 text-[22px] font-bold leading-tight first-letter:uppercase">
            <CalendarDays size={22} className="shrink-0 text-accent" aria-hidden="true" />
            <span className="first-letter:uppercase">{fmtDate(move.date, lang, 'weekday')}</span>
          </p>
          <p className="text-muted">
            {t(`moveType.${move.type}`)} · {t('common.volume', { n: move.volumeM3 })} · {move.ref}
          </p>
          <dl className="mt-4 space-y-3">
            {[
              { label: t('client.from'), site: move.from },
              ...(move.to ? [{ label: t('client.to'), site: move.to }] : []),
            ].map(({ label, site }) => (
              <div key={label} className="flex gap-3">
                <MapPin size={20} className="mt-0.5 shrink-0 text-muted" aria-hidden="true" />
                <div>
                  <dt className="font-semibold">{label}</dt>
                  <dd className="leading-snug">{fmtAddress(site, lang)}</dd>
                </div>
              </div>
            ))}
          </dl>
          {sales && (
            <p className="mt-4 flex items-center gap-2 border-t border-line pt-3 text-muted">
              <Phone size={18} className="shrink-0" aria-hidden="true" />
              {t('client.contact', { name: fullName(sales) })}
            </p>
          )}
        </section>
      )}

      <UpcomingPreview compact items={['client.previewItems.a', 'client.previewItems.b', 'client.previewItems.c']} />
    </div>
  )
}
