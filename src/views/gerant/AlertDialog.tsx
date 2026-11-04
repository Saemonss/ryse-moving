/*
 * Fenêtre de détail d'une alerte : explique la situation et propose UNE solution en un clic.
 * S'il n'existe aucune solution automatique (ex. aucun camion libre), on l'explique au lieu d'afficher un bouton inutile.
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
import { toast } from '../../ui/Toast'
import { ConflictDetail } from '../shared/ConflictDetail'
import { go } from '../../app/router'
import { PhotoView } from '../../ui/Photo'

export function AlertDialog({ alert, onClose }: { alert: Alert | null; onClose: () => void }) {
  const { t, lang } = useI18n()
  const data = useDemo((s) => s.data)
  const resolveAlert = useDemo((s) => s.resolveAlert)
  // On garde la dernière alerte affichée pendant la fermeture de la fenêtre.
  const [shown, setShown] = useState<Alert | null>(alert)
  useEffect(() => {
    if (alert) setShown(alert)
  }, [alert])
  if (!shown) return null

  const { title, apply, done } = labels(shown, data, t, lang)
  const canApply = shown.kind !== 'conflict' || !!shown.conflict?.fix
  return (
    <Modal
      open={!!alert}
      onClose={onClose}
      title={title}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            {t(canApply ? 'common.cancel' : 'common.close')}
          </Button>
          {canApply && (
            <Button
              onClick={() => {
                const ok = resolveAlert(shown)
                onClose()
                toast(ok ? done : t('conflicts.stale'), ok ? 'success' : 'info')
                if (ok && shown.kind === 'damage') {
                  const claim = useDemo.getState().data.claims.find((c) => c.moveId === shown.moveId)
                  if (claim) go('gerant', 'litige', claim.id)
                }
              }}
            >
              {apply}
            </Button>
          )}
        </>
      }
    >
      <AlertBody alert={shown} data={data} />
    </Modal>
  )
}

function labels(alert: Alert, data: DemoData, t: ReturnType<typeof useI18n>['t'], lang: Lang) {
  const date = alert.suggestedDate ? fmtDate(alert.suggestedDate, lang, 'weekday') : ''
  const move = byId(data.moves, alert.moveId)
  const client = byId(data.customers, move?.customerId)?.name ?? ''
  const k = alert.kind
  if (k === 'conflict' || k === 'lowMargin')
    return { title: alert.conflict ? t(`conflicts.title.${alert.conflict.kind}`) : '', apply: t('conflicts.apply'), done: t('conflicts.done') }
  if (k === 'inspection') return { title: t('alerts.inspection.modalTitle'), apply: t('alerts.inspection.apply', { date }), done: t('alerts.inspection.done', { date }) }
  return { title: t(`alerts.${k}.modalTitle`), apply: t(`alerts.${k}.apply`), done: t(`alerts.${k}.done`, { client }) }
}

function AlertBody({ alert, data }: { alert: Alert; data: DemoData }) {
  const { t, lang } = useI18n()
  const move = byId(data.moves, alert.moveId)
  const customer = move ? byId(data.customers, move.customerId) : undefined
  const client = customer?.name ?? ''
  const vehicle = byId(data.vehicles, alert.vehicleId)
  switch (alert.kind) {
    case 'conflict':
      return alert.conflict ? <ConflictDetail conflict={alert.conflict} /> : null
    case 'lowMargin':
      return null
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
      const day = data.days.find((d) => d.id === alert.dayId)
      const damage = day?.missions.find((m) => m.moveId === alert.moveId)?.damage
      const staff = byId(data.staff, day?.staffId)
      if (!damage) return null
      return (
        <div className="space-y-4">
          <p>
            {t('alerts.damage.explain', { staff: staff ? fullName(staff) : '', date: move ? fmtDate(move.date, lang, 'long') : '', ref: move?.ref ?? '' })}
          </p>
          <div className="grid grid-cols-[140px_1fr] items-start gap-4 rounded-xl border border-line p-3">
            <PhotoView photo={damage.photo} />
            <div>
              <p className="text-sm font-medium text-muted">{t('alerts.damage.noteLabel')}</p>
              <p className="mt-1 font-semibold">{t(`terrain.items.${damage.item}`)}</p>
              <p className="text-[15px]">
                {t(`terrain.damageTypes.${damage.type}`)} · {t(`terrain.severity.${damage.severity}`)}
              </p>
            </div>
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
