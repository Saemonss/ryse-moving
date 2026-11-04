/*
 * Accueil provisoire du commercial : les dossiers en cours (demande → devis signé), aperçu de l'étape « Ventes ».
 */
import { useI18n } from '../../i18n'
import { fmtDate, fmtMoney } from '../../i18n/format'
import { useDemo } from '../../store/demoStore'
import { STATUS_TONE, customerOf } from '../../data/selectors'
import type { MoveStatus } from '../../data/types'
import { Card } from '../../ui/Card'
import { SimpleTable } from '../../ui/SimpleTable'
import { StatusBadge } from '../../ui/StatusBadge'
import { FactStrip, PageHeader, UpcomingPreview } from '../shared/Page'

const PIPELINE: MoveStatus[] = ['demande', 'visite', 'devisEnvoye', 'devisSigne']

export function CommercialHome() {
  const { t, lang } = useI18n()
  const data = useDemo((s) => s.data)
  const rows = data.moves
    .filter((m) => PIPELINE.includes(m.status))
    .sort((a, b) => PIPELINE.indexOf(a.status) - PIPELINE.indexOf(b.status) || a.date.localeCompare(b.date))
  const count = (s: MoveStatus) => rows.filter((m) => m.status === s).length

  return (
    <>
      <PageHeader title={t('commercial.title')} subtitle={t('commercial.subtitle')} />
      <FactStrip facts={PIPELINE.map((s) => ({ label: t(`status.${s}`), value: count(s) }))} />
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
        <Card title={t('commercial.pipelineTitle')} padded={false}>
          <SimpleTable
            rows={rows}
            rowKey={(m) => m.id}
            empty={t('commercial.empty')}
            columns={[
              { key: 'ref', label: t('commercial.colRef'), render: (m) => <span className="whitespace-nowrap text-muted">{m.ref}</span> },
              { key: 'c', label: t('commercial.colClient'), render: (m) => <span className="font-medium">{customerOf(data, m)?.name}</span> },
              { key: 'ty', label: t('commercial.colType'), render: (m) => t(`moveType.${m.type}`) },
              { key: 'd', label: t('commercial.colDate'), render: (m) => <span className="whitespace-nowrap">{fmtDate(m.date, lang, 'dayMonth')}</span> },
              { key: 's', label: t('commercial.colStatus'), render: (m) => <StatusBadge tone={STATUS_TONE[m.status]}>{t(`status.${m.status}`)}</StatusBadge> },
              {
                key: 'a',
                label: t('commercial.colAmount'),
                className: 'text-right',
                render: (m) => (['devisEnvoye', 'devisSigne'].includes(m.status) ? <span className="whitespace-nowrap">{fmtMoney(m.priceCents, lang, false)}</span> : <span className="text-subtle">–</span>),
              },
            ]}
          />
        </Card>
        <UpcomingPreview items={['commercial.previewItems.a', 'commercial.previewItems.b', 'commercial.previewItems.c']} />
      </div>
    </>
  )
}
