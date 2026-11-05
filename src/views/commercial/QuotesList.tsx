/*
 * Commercial › Devis : les devis préparés par l'agent (à valider), envoyés et signés. Clic → la demande et son devis.
 */
import { useI18n } from '../../i18n'
import { fmtMoney } from '../../i18n/format'
import { useDemo } from '../../store/demoStore'
import { quoteTotal } from '../../data/quote'
import type { Lead } from '../../data/types'
import { Card } from '../../ui/Card'
import { SimpleTable } from '../../ui/SimpleTable'
import { StatusBadge } from '../../ui/StatusBadge'
import { PageHeader } from '../shared/Page'
import { ScreenLink } from '../shared/ScreenLink'
import { CHANNEL_ICON } from './leadText'

export function QuotesList() {
  const { t, lang } = useI18n()
  const leads = useDemo((s) => s.data.leads)
  const rows = leads.filter((l): l is Lead & { quote: NonNullable<Lead['quote']> } => !!l.quote)
  return (
    <>
      <PageHeader title={t('quote.listTitle')} subtitle={t('quote.listSubtitle')} />
      <Card padded={false}>
        <SimpleTable
          rows={rows}
          rowKey={(l) => l.id}
          empty={t('quote.empty')}
          columns={[
            {
              key: 'c',
              label: t('quote.colClient'),
              render: (l) => {
                const Icon = CHANNEL_ICON[l.channel]
                return (
                  <span className="flex items-center gap-2.5" data-crawl-sample>
                    <Icon size={17} className="text-accent" aria-hidden="true" />
                    <ScreenLink view="commercial" screen="demande" param={l.id} className="text-ink">
                      {l.name}
                    </ScreenLink>
                  </span>
                )
              },
            },
            {
              key: 's',
              label: t('quote.colStatus'),
              render: (l) =>
                l.quote.signedAt ? (
                  <StatusBadge tone="success">{t('quote.status.signed')}</StatusBadge>
                ) : l.quote.sentAt ? (
                  <StatusBadge tone="info">{t('quote.status.sent')}</StatusBadge>
                ) : (
                  <StatusBadge tone="accent">{t('quote.status.prepared')}</StatusBadge>
                ),
            },
            { key: 'a', label: t('quote.colAmount'), className: 'text-right', render: (l) => fmtMoney(quoteTotal(l.quote), lang) },
          ]}
        />
      </Card>
    </>
  )
}
