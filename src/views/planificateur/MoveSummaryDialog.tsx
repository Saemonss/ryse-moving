/*
 * Résumé en lecture seule d'un dossier qui ne peut plus être replanifié (en cours, terminé, facturé, payé).
 * Évite qu'un clic sur un bloc passé du planning modifie un dossier déjà réalisé.
 */
import { Lock } from 'lucide-react'
import { useI18n } from '../../i18n'
import { fmtDate } from '../../i18n/format'
import { useDemo } from '../../store/demoStore'
import { STATUS_TONE, byId, cityName, customerOf, fullName } from '../../data/selectors'
import { Modal } from '../../ui/Modal'
import { Button } from '../../ui/Button'
import { StatusBadge } from '../../ui/StatusBadge'

export function MoveSummaryDialog({ moveId, onClose }: { moveId: string | null; onClose: () => void }) {
  const { t, lang } = useI18n()
  const data = useDemo((s) => s.data)
  const move = byId(data.moves, moveId ?? undefined)
  return (
    <Modal
      open={!!move}
      onClose={onClose}
      title={move ? (customerOf(data, move)?.name ?? '') : ''}
      footer={<Button onClick={onClose}>{t('common.close')}</Button>}
    >
      {move && (
        <div className="space-y-3">
          <p className="flex flex-wrap items-center gap-2">
            <StatusBadge tone={STATUS_TONE[move.status]}>{t(`status.${move.status}`)}</StatusBadge>
            <span className="text-muted">
              {move.ref} · {t(`moveType.${move.type}`)} · {t('common.volume', { n: move.volumeM3 })}
            </span>
          </p>
          <p>
            <span className="first-letter:uppercase">{fmtDate(move.date, lang, 'weekday')}</span> · {move.startTime} · {cityName(move.from.cityId, lang)}
            {move.to ? ` → ${cityName(move.to.cityId, lang)}` : ''}
          </p>
          <p className="text-muted">
            {move.teamIds.map((id) => byId(data.staff, id)).filter((s) => !!s).map((s) => fullName(s)).join(', ')} ·{' '}
            {move.vehicleIds.map((id) => byId(data.vehicles, id)?.plate).join(' + ')}
          </p>
          <p className="flex items-center gap-2 rounded-xl bg-surface px-4 py-3 text-ink">
            <Lock size={16} className="shrink-0 text-muted" aria-hidden="true" />
            {t('planif.locked')}
          </p>
        </div>
      )}
    </Modal>
  )
}
