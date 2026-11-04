/*
 * Planificateur › Dossiers à planifier : les devis signés pas encore planifiés, triés par date souhaitée.
 * « Affecter » ouvre la fenêtre d'affectation (date, équipe, camion) avec l'aperçu des conflits.
 */
import { useState } from 'react'
import { useI18n } from '../../i18n'
import { fmtDate, fmtMoney } from '../../i18n/format'
import { useDemo } from '../../store/demoStore'
import { cityName, customerOf } from '../../data/selectors'
import { Card } from '../../ui/Card'
import { Button } from '../../ui/Button'
import { SimpleTable } from '../../ui/SimpleTable'
import { PageHeader } from '../shared/Page'
import { TYPE_COLORS } from '../shared/planning/planningKit'
import { AssignDialog } from './AssignDialog'

export function ToPlanScreen() {
  const { t, lang } = useI18n()
  const data = useDemo((s) => s.data)
  const [assigning, setAssigning] = useState<string | null>(null)
  const rows = data.moves.filter((m) => m.status === 'devisSigne').sort((a, b) => a.date.localeCompare(b.date))

  return (
    <>
      <PageHeader title={t('menu.aPlanifier')} subtitle={t('toPlan.subtitle')} />
      <Card padded={false}>
        <SimpleTable
          rows={rows}
          rowKey={(m) => m.id}
          empty={t('toPlan.empty')}
          columns={[
            { key: 'd', label: t('toPlan.wished'), render: (m) => <span className="whitespace-nowrap font-semibold">{fmtDate(m.date, lang, 'weekday')}</span> },
            {
              key: 'c',
              label: t('moves.colClient'),
              render: (m) => (
                <div className="whitespace-nowrap">
                  <p className="font-medium">{customerOf(data, m)?.name}</p>
                  <p className="text-[13px] text-muted">
                    {cityName(m.from.cityId, lang)} → {m.to ? cityName(m.to.cityId, lang) : t(m.type === 'debarras' ? 'common.recycling' : 'common.storage')}
                  </p>
                </div>
              ),
            },
            {
              key: 't',
              label: t('moves.colType'),
              render: (m) => (
                <span className="flex items-center gap-2 whitespace-nowrap">
                  <span className="size-2.5 rounded-full" style={{ background: TYPE_COLORS[m.type].dot }} aria-hidden="true" />
                  {t(`moveType.${m.type}`)} · {m.volumeM3} m³
                </span>
              ),
            },
            { key: 'a', label: t('moves.colAmount'), className: 'text-right', render: (m) => <span className="whitespace-nowrap">{fmtMoney(m.priceCents, lang, false)}</span> },
            {
              key: 'x',
              label: '',
              className: 'text-right',
              render: (m) => (
                <span data-crawl-sample>
                  <Button size="sm" onClick={() => setAssigning(m.id)}>
                    {t('planif.assign')}
                  </Button>
                </span>
              ),
            },
          ]}
        />
      </Card>
      <AssignDialog moveId={assigning} onClose={() => setAssigning(null)} />
    </>
  )
}
