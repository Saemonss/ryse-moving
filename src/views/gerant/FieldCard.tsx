/*
 * Fiche dossier › « Sur le terrain » : ce que le téléphone du chauffeur a envoyé pour ce dossier
 * (étape en cours, photos des états des lieux, dégât, signature). Rien n'apparaît tant que rien n'est reçu.
 */
import { useI18n } from '../../i18n'
import { fmtTime } from '../../i18n/format'
import { useDemo } from '../../store/demoStore'
import { byId, fullName } from '../../data/selectors'
import { MISSION_DONE, MISSION_STEPS } from '../../data/field'
import { Card } from '../../ui/Card'
import { StatusBadge } from '../../ui/StatusBadge'
import { PhotoView } from '../../ui/Photo'
import { ScreenLink } from '../shared/ScreenLink'

export function FieldCard({ moveId }: { moveId: string }) {
  const { t, lang } = useI18n()
  const data = useDemo((s) => s.data)
  const day = data.days.find((d) => d.missions.some((m) => m.moveId === moveId))
  const log = day?.missions.find((m) => m.moveId === moveId)
  if (!day || !log || log.step === 0) return null
  const staff = byId(data.staff, day.staffId)
  const done = log.step >= MISSION_DONE
  const photos = [...log.startPhotos, ...log.endPhotos]
  return (
    <Card
      title={t('live.title')}
      className="mb-6"
      aside={
        done ? (
          <StatusBadge tone="success">{t('terrain.missions.done')}</StatusBadge>
        ) : (
          <StatusBadge tone="warning">{t('live.step', { n: log.step + 1, label: t(`terrain.mission.steps.${MISSION_STEPS[log.step]!}`) })}</StatusBadge>
        )
      }
    >
      <p className="mb-3 text-sm text-muted">{t('live.syncNote', { name: staff ? fullName(staff) : '' })}</p>
      <ol className="mb-3 flex flex-wrap gap-x-4 gap-y-1 text-[13px] text-muted">
        {log.times.map((tm, i) => (
          <li key={i}>
            <span className="tabular font-semibold text-ink">{fmtTime(tm, lang)}</span> {t(`terrain.mission.steps.${MISSION_STEPS[i]!}`)}
          </li>
        ))}
      </ol>
      {photos.length > 0 && (
        <ul className="mb-3 grid grid-cols-4 gap-2 sm:grid-cols-6">
          {photos.map((p, i) => (
            <li key={i}>
              <PhotoView photo={p.photo} />
            </li>
          ))}
        </ul>
      )}
      <div className="flex flex-wrap items-center gap-4">
        {log.damage && <StatusBadge tone="warning">{t('terrain.mission.damageDone', { item: t(`terrain.items.${log.damage.item}`) })}</StatusBadge>}
        {log.signature && <img src={log.signature.image} alt={t('review.signedBy', { name: log.signature.name, time: fmtTime(log.signature.at, lang) })} className="h-12 rounded-lg bg-white p-1 ring-1 ring-line" />}
        {['sent', 'validated'].includes(day.status) && (
          <ScreenLink view="gerant" screen="journee" param={day.id} arrow className="text-sm">
            {t('review.open')}
          </ScreenLink>
        )}
      </div>
    </Card>
  )
}
