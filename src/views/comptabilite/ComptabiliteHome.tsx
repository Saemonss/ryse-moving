/*
 * Accueil provisoire de la comptabilité : montants à suivre et dernières factures, aperçu de l'étape « Factures ».
 */
import { useI18n } from '../../i18n'
import { fmtDate, fmtMoney } from '../../i18n/format'
import { useDemo } from '../../store/demoStore'
import { STATUS_TONE, customerOf } from '../../data/selectors'
import type { Move } from '../../data/types'
import { Card } from '../../ui/Card'
import { SimpleTable } from '../../ui/SimpleTable'
import { StatusBadge } from '../../ui/StatusBadge'
import { FactStrip, PageHeader, UpcomingPreview } from '../shared/Page'

export function ComptabiliteHome() {
  const { t, lang } = useI18n()
  const data = useDemo((s) => s.data)
  const today = useDemo((s) => s.seedDay)

  const isLate = (m: Move) => m.status === 'facture' && !!m.invoiceDueOn && m.invoiceDueOn < today
  const invoices = data.moves.filter((m) => m.invoiceNumber).sort((a, b) => (b.invoiceNumber ?? '').localeCompare(a.invoiceNumber ?? ''))
  const sum = (list: Move[]) => list.reduce((s, m) => s + m.priceCents, 0)
  const waiting = invoices.filter((m) => m.status === 'facture')

  return (
    <>
      <PageHeader title={t('comptabilite.title')} subtitle={t('comptabilite.subtitle')} />
      <FactStrip
        facts={[
          { label: t('comptabilite.toInvoice'), value: data.moves.filter((m) => m.status === 'termine').length },
          { label: t('comptabilite.waiting'), value: fmtMoney(sum(waiting), lang, false) },
          { label: t('comptabilite.late'), value: fmtMoney(sum(waiting.filter(isLate)), lang, false), tone: 'danger' },
        ]}
      />
      <div className="grid gap-6 min-[1400px]:grid-cols-[minmax(0,1fr)_340px]">
        <Card title={t('comptabilite.invoicesTitle')} padded={false}>
          <SimpleTable
            rows={invoices}
            rowKey={(m) => m.id}
            empty={t('comptabilite.empty')}
            columns={[
              { key: 'n', label: t('comptabilite.colNumber'), render: (m) => <span className="whitespace-nowrap font-medium">{m.invoiceNumber}</span> },
              { key: 'c', label: t('comptabilite.colClient'), render: (m) => <span className="whitespace-nowrap">{customerOf(data, m)?.name}</span> },
              { key: 'd', label: t('comptabilite.colDue'), render: (m) => <span className="whitespace-nowrap">{m.invoiceDueOn ? fmtDate(m.invoiceDueOn, lang, 'short') : ''}</span> },
              { key: 'a', label: t('comptabilite.colAmount'), className: 'text-right', render: (m) => <span className="whitespace-nowrap">{fmtMoney(m.priceCents, lang)}</span> },
              {
                key: 's',
                label: t('comptabilite.colStatus'),
                render: (m) =>
                  isLate(m) ? <StatusBadge tone="danger">{t('comptabilite.lateBadge')}</StatusBadge> : <StatusBadge tone={STATUS_TONE[m.status]}>{t(`status.${m.status}`)}</StatusBadge>,
              },
            ]}
          />
        </Card>
        <UpcomingPreview items={['comptabilite.previewItems.a', 'comptabilite.previewItems.b', 'comptabilite.previewItems.c']} />
      </div>
    </>
  )
}
