/*
 * Fenêtre de détail d'une alerte : explique la situation et propose UNE solution en un clic.
 * Pour un conflit de camion, la solution est « cherchée par l'IA » (simulée, ~1,3 s).
 */
import { useEffect, useState } from 'react'
import { useI18n, type Lang } from '../../i18n'
import { fmtDate, fmtMoney } from '../../i18n/format'
import { byId, fullName } from '../../data/selectors'
import type { Alert, DemoData } from '../../data/types'
import { useDemo } from '../../store/demoStore'
import { Modal } from '../../ui/Modal'
import { Button } from '../../ui/Button'
import { TextArea } from '../../ui/Field'
import { StatusBadge } from '../../ui/StatusBadge'
import { AiProcessing, useFakeAi } from '../../ui/AiProcessing'
import { toast } from '../../ui/Toast'

export function AlertDialog({ alert, onClose }: { alert: Alert | null; onClose: () => void }) {
  const { t, lang } = useI18n()
  const data = useDemo((s) => s.data)
  const resolveAlert = useDemo((s) => s.resolveAlert)
  // On garde la dernière alerte affichée pendant la fermeture de la fenêtre.
  const [shown, setShown] = useState<Alert | null>(alert)
  const ai = useFakeAi(true, 1300)
  const { run, reset } = ai
  useEffect(() => {
    if (!alert) {
      reset() // évite d'afficher un instant l'ancienne suggestion au prochain conflit
      return
    }
    setShown(alert)
    if (alert.kind === 'conflict') run()
    else reset()
  }, [alert, run, reset])
  if (!shown) return null

  const { title, apply, done } = labels(shown, data, t, lang)
  // Pas de solution trouvée (aucun camion libre) : on n'affiche pas de bouton qui ne ferait rien.
  const canApply = shown.kind !== 'conflict' || !!shown.suggestedVehicleId
  const aiReady = (shown.kind !== 'conflict' || ai.status === 'done') && canApply
  return (
    <Modal
      open={!!alert}
      onClose={onClose}
      title={title}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            {t('common.cancel')}
          </Button>
          {aiReady && (
            <Button
              onClick={() => {
                resolveAlert(shown)
                onClose()
                toast(done)
              }}
            >
              {apply}
            </Button>
          )}
        </>
      }
    >
      <AlertBody alert={shown} data={data} aiReady={aiReady} />
    </Modal>
  )
}

function labels(alert: Alert, data: DemoData, t: ReturnType<typeof useI18n>['t'], lang: Lang) {
  const move = byId(data.moves, alert.moveId)
  const other = byId(data.moves, alert.otherMoveId)
  const client = byId(data.customers, (alert.kind === 'conflict' ? other : move)?.customerId)?.name ?? ''
  const plate = byId(data.vehicles, alert.suggestedVehicleId)?.plate ?? ''
  const date = alert.suggestedDate ? fmtDate(alert.suggestedDate, lang, 'weekday') : ''
  const k = alert.kind
  if (k === 'conflict') return { title: t('alerts.conflict.modalTitle'), apply: t('alerts.conflict.apply', { plate }), done: t('alerts.conflict.done', { plate, client }) }
  if (k === 'inspection') return { title: t('alerts.inspection.modalTitle'), apply: t('alerts.inspection.apply', { date }), done: t('alerts.inspection.done', { date }) }
  return { title: t(`alerts.${k}.modalTitle`), apply: t(`alerts.${k}.apply`), done: t(`alerts.${k}.done`, { client }) }
}

function AlertBody({ alert, data, aiReady }: { alert: Alert; data: DemoData; aiReady: boolean }) {
  const { t, lang } = useI18n()
  const move = byId(data.moves, alert.moveId)
  const customer = move ? byId(data.customers, move.customerId) : undefined
  const client = customer?.name ?? ''
  const vehicle = byId(data.vehicles, alert.vehicleId)
  switch (alert.kind) {
    case 'conflict': {
      const other = byId(data.moves, alert.otherMoveId)
      const suggested = byId(data.vehicles, alert.suggestedVehicleId)
      const rows = [move, other].filter((m): m is NonNullable<typeof m> => !!m)
      return (
        <div className="space-y-4">
          <p>
            {t('alerts.conflict.explain', {
              plate: vehicle?.plate ?? '',
              kind: vehicle ? t(`vehicleKind.${vehicle.kind}`) : '',
              date: move ? fmtDate(move.date, lang, 'weekday') : '',
            })}
          </p>
          <ul className="divide-y divide-line rounded-xl border border-line">
            {rows.map((m) => {
              const chief = byId(data.staff, m.teamIds[0])
              return (
                <li key={m.id} className="flex items-center justify-between gap-3 px-4 py-3">
                  <div>
                    <p className="font-semibold">{byId(data.customers, m.customerId)?.name}</p>
                    <p className="text-sm text-muted">
                      {m.startTime} · {t(`moveType.${m.type}`)} · {t('common.volume', { n: m.volumeM3 })}
                    </p>
                  </div>
                  {chief && <span className="text-sm text-muted">{fullName(chief)}</span>}
                </li>
              )
            })}
          </ul>
          {!aiReady ? (
            <AiProcessing label={t('alerts.conflict.aiLoading')} />
          ) : (
            suggested && (
              <div className="rounded-xl bg-surface-2/60 px-4 py-3 animate-[rm-fade-up_200ms_var(--ease-out)]">
                <StatusBadge tone="accent">{t('ai.tag')}</StatusBadge>
                <p className="mt-2">
                  {t('alerts.conflict.suggestion', {
                    plate: suggested.plate,
                    kind: t(`vehicleKind.${suggested.kind}`),
                    client: byId(data.customers, other?.customerId ?? '')?.name ?? '',
                  })}
                </p>
              </div>
            )
          )}
        </div>
      )
    }
    case 'quote':
      return (
        <div className="space-y-4">
          <p>
            {t('alerts.quote.explain', {
              ref: move?.ref ?? '',
              date: move?.quoteSentOn ? fmtDate(move.quoteSentOn, lang, 'long') : '',
              client,
              amount: fmtMoney(move?.priceCents ?? 0, lang),
            })}
          </p>
          <TextArea
            label={t('alerts.quote.draftLabel')}
            rows={7}
            defaultValue={t('alerts.quote.draft', { date: move ? fmtDate(move.date, lang, 'long') : '' })}
          />
        </div>
      )
    case 'damage': {
      const staff = byId(data.staff, move?.damage?.reportedBy)
      return (
        <div className="space-y-4">
          <p>
            {t('alerts.damage.explain', { staff: staff ? fullName(staff) : '', date: move ? fmtDate(move.date, lang, 'long') : '', ref: move?.ref ?? '' })}
          </p>
          <div className="rounded-xl border border-line px-4 py-3">
            <p className="text-sm font-medium text-muted">{t('alerts.damage.noteLabel')}</p>
            <p className="mt-1">
              <strong className="font-semibold">{t('items.commode')}</strong> — {t('notes.damage')}
            </p>
          </div>
        </div>
      )
    }
    case 'invoice':
      return (
        <p>
          {t('alerts.invoice.explain', {
            number: move?.invoiceNumber ?? '',
            date: move?.invoicedOn ? fmtDate(move.invoicedOn, lang, 'long') : '',
            client,
            due: move?.invoiceDueOn ? fmtDate(move.invoiceDueOn, lang, 'long') : '',
          })}{' '}
          <strong className="font-semibold tabular">{fmtMoney(move?.priceCents ?? 0, lang)}</strong>
        </p>
      )
    case 'inspection':
      return (
        <div className="space-y-2">
          <p>
            {t('alerts.inspection.explain', {
              date: vehicle ? fmtDate(vehicle.nextInspection, lang, 'long') : '',
              vehicle: vehicle ? t(`vehicleKind.${vehicle.kind}`) : '',
              plate: vehicle?.plate ?? '',
            })}
          </p>
          <p className="text-muted">{t('alerts.inspection.free', { date: alert.suggestedDate ? fmtDate(alert.suggestedDate, lang, 'weekday') : '' })}</p>
        </div>
      )
  }
}
