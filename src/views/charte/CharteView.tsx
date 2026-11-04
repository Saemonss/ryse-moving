/*
 * Page interne #/charte : référence visuelle de tous les composants de base.
 * Elle n'apparaît dans aucun menu. Chaque exemple est fonctionnel (pas de bouton mort, même ici).
 */
import { useState } from 'react'
import { Camera, Pencil, Save, Trash2, Sparkles } from 'lucide-react'
import { useI18n } from '../../i18n'
import { fmtMoney } from '../../i18n/format'
import { Logo } from '../../ui/Logo'
import { Button } from '../../ui/Button'
import { Card } from '../../ui/Card'
import { StatusBadge } from '../../ui/StatusBadge'
import { STATUS_TONE } from '../../data/selectors'
import { ActionAlert } from '../../ui/ActionAlert'
import { SimpleTable } from '../../ui/SimpleTable'
import { Field } from '../../ui/Field'
import { Modal } from '../../ui/Modal'
import { Tabs } from '../../ui/Tabs'
import { AiProcessing, useFakeAi } from '../../ui/AiProcessing'
import { toast } from '../../ui/Toast'
import { Avatar } from '../../ui/Avatar'
import { CharteDemoPhone } from './CharteDemoPhone'

const SWATCHES = ['--ink', '--accent', '--accent-soft', '--accent-pale', '--surface', '--surface-2', '--line', '--muted', '--success', '--warning', '--danger', '--info']
const SAMPLE_NAMES = ['Nathalie Verhaegen', 'Karim Benali', 'Julie Desmet', 'Thomas Lemaire', 'Marc Janssens', 'Claire Vandamme']

type TabId = 'a' | 'b' | 'c'

export function CharteView() {
  const { t, lang } = useI18n()
  const [query, setQuery] = useState('')
  const [modal, setModal] = useState(false)
  const [tab, setTab] = useState<TabId>('a')
  const ai = useFakeAi(t('charte.aiResult'), 1400)

  const STATUSES = ['paye', 'enCours', 'facture', 'planifie', 'devisEnvoye', 'demande'] as const
  const rows = SAMPLE_NAMES.map((name, i) => ({ name, amount: 98000 + i * 41250, status: STATUSES[i % STATUSES.length] ?? 'demande' }))
  const filtered = rows.filter((r) => r.name.toLowerCase().includes(query.trim().toLowerCase()))
  const tabs = [
    { id: 'a' as const, label: t('charte.tabA') },
    { id: 'b' as const, label: t('charte.tabB') },
    { id: 'c' as const, label: t('charte.tabC') },
  ]
  const tabLabel = tabs.find((x) => x.id === tab)?.label ?? ''
  const clicked = (label: string) => () => toast(t('charte.clicked', { label }), 'info')

  return (
    <div className="mx-auto max-w-5xl space-y-8 px-6 py-10">
      <header className="space-y-3">
        <Logo size="md" />
        <h1 className="text-3xl font-semibold tracking-[-0.025em]">{t('charte.title')}</h1>
        <p className="text-muted">{t('charte.intro')}</p>
      </header>

      <Card title={t('charte.colors')}>
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
          {SWATCHES.map((v) => (
            <div key={v}>
              <div className="h-14 rounded-xl border border-line" style={{ background: `var(${v})` }} />
              <p className="mt-1.5 font-mono text-xs text-muted">{v}</p>
            </div>
          ))}
        </div>
      </Card>

      <Card title={t('charte.buttons')}>
        <div className="flex flex-wrap items-center gap-3">
          <Button icon={Save} onClick={clicked(t('charte.primary'))}>{t('charte.primary')}</Button>
          <Button variant="secondary" icon={Pencil} onClick={clicked(t('charte.secondary'))}>{t('charte.secondary')}</Button>
          <Button variant="ghost" onClick={clicked(t('charte.ghost'))}>{t('charte.ghost')}</Button>
          <Button variant="danger" icon={Trash2} onClick={() => toast(t('charte.deleted'), 'info')}>{t('charte.danger')}</Button>
        </div>
        <div className="mt-5 max-w-sm">
          <Button size="xl" icon={Camera} onClick={() => toast(t('charte.photoSaved'))}>{t('charte.xl')}</Button>
        </div>
      </Card>

      <div className="grid gap-8 md:grid-cols-2">
        <Card title={t('charte.badges')}>
          <div className="flex flex-wrap gap-2">
            {(['demande', 'devisEnvoye', 'planifie', 'enCours', 'termine', 'paye'] as const).map((s) => (
              <StatusBadge key={s} tone={STATUS_TONE[s]}>
                {t(`status.${s}`)}
              </StatusBadge>
            ))}
          </div>
          <div className="mt-4 flex -space-x-2">
            {SAMPLE_NAMES.map((n) => (
              <Avatar key={n} name={n} className="ring-2 ring-white" />
            ))}
          </div>
        </Card>

        <Card title={t('charte.alerts')}>
          <ActionAlert
            tone="warning"
            title={t('charte.sampleAlert')}
            text={t('charte.sampleAlertText')}
            actionLabel={t('charte.sampleAlertAction')}
            onAction={clicked(t('charte.sampleAlertAction'))}
          />
        </Card>
      </div>

      <Card title={t('charte.table')} padded={false}>
        <div className="border-b border-line px-5 py-4">
          <Field
            label={t('charte.fieldLabel')}
            placeholder={t('charte.fieldPlaceholder')}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            hint={t('charte.fieldHint', { n: filtered.length })}
            className="max-w-sm"
            data-testid="charte-field"
          />
        </div>
        <SimpleTable
          rows={filtered}
          rowKey={(r) => r.name}
          empty={t('charte.fieldHint', { n: 0 })}
          columns={[
            { key: 'n', label: t('commercial.colClient'), render: (r) => <span className="flex items-center gap-2.5"><Avatar name={r.name} size={28} />{r.name}</span> },
            { key: 's', label: t('commercial.colStatus'), render: (r) => <StatusBadge tone={STATUS_TONE[r.status]}>{t(`status.${r.status}`)}</StatusBadge> },
            { key: 'a', label: t('commercial.colAmount'), render: (r) => fmtMoney(r.amount, lang), className: 'text-right' },
          ]}
        />
      </Card>

      <div className="grid gap-8 md:grid-cols-2">
        <Card title={t('charte.tabs')}>
          <Tabs tabs={tabs} value={tab} onChange={setTab} label={t('charte.tabs')} />
          <p className="mt-4 text-[15px]" role="tabpanel">{t('charte.tabContent', { name: tabLabel })}</p>
        </Card>
        <Card title={t('charte.modal')}>
          <Button variant="secondary" onClick={() => setModal(true)}>{t('charte.openModal')}</Button>
        </Card>
      </div>

      <Card title={t('charte.ai')}>
        <div className="space-y-4">
          <Button icon={Sparkles} onClick={ai.run} disabled={ai.status === 'running'}>{t('charte.aiRun')}</Button>
          {ai.status === 'running' && <AiProcessing />}
          {ai.data && (
            <div className="flex items-start gap-3 rounded-xl bg-surface-2/60 px-4 py-3 animate-[rm-fade-up_200ms_var(--ease-out)]">
              <StatusBadge tone="accent">{t('ai.tag')}</StatusBadge>
              <p className="text-[15px]">{ai.data}</p>
            </div>
          )}
        </div>
      </Card>

      <Card title={t('charte.phone')}>
        <CharteDemoPhone />
      </Card>

      <Modal
        open={modal}
        onClose={() => setModal(false)}
        title={t('charte.modalTitle')}
        footer={<Button onClick={() => setModal(false)}>{t('charte.modalOk')}</Button>}
      >
        <p>{t('charte.modalText')}</p>
      </Modal>
    </div>
  )
}
