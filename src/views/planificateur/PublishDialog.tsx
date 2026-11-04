/*
 * « Publier le planning » : envoi SIMULÉ aux personnes qui travaillent dans les 7 prochains jours.
 * Pas de vraie messagerie : on mémorise l'heure d'envoi et la liste des personnes prévenues.
 */
import { useI18n } from '../../i18n'
import { fmtTime } from '../../i18n/format'
import { useDemo } from '../../store/demoStore'
import { addDays } from '../../data/dates'
import { byId, fullName } from '../../data/selectors'
import { Modal } from '../../ui/Modal'
import { Button } from '../../ui/Button'
import { Avatar } from '../../ui/Avatar'
import { toast } from '../../ui/Toast'

export function PublishDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { t, lang } = useI18n()
  const data = useDemo((s) => s.data)
  const today = useDemo((s) => s.seedDay)
  const publishPlanning = useDemo((s) => s.publishPlanning)

  const until = addDays(today, 6)
  const ids = [
    ...new Set(
      data.moves.filter((m) => m.date >= today && m.date <= until && ['planifie', 'enCours'].includes(m.status)).flatMap((m) => m.teamIds),
    ),
  ]
  const people = ids.map((id) => byId(data.staff, id)).filter((s) => !!s)

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={t('planif.publishTitle')}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            {t('common.cancel')}
          </Button>
          <Button
            onClick={() => {
              publishPlanning(ids)
              onClose()
              toast(t('planif.publishDone', { n: ids.length, time: fmtTime(new Date(), lang) }))
            }}
          >
            {t('planif.publishConfirm', { n: ids.length })}
          </Button>
        </>
      }
    >
      <p className="mb-3">{t('planif.publishText')}</p>
      <ul className="grid grid-cols-2 gap-x-4 gap-y-2">
        {people.map((s) => (
          <li key={s.id} className="flex items-center gap-2 text-[15px]">
            <Avatar name={fullName(s)} size={26} />
            <span className="truncate">{fullName(s)}</span>
          </li>
        ))}
      </ul>
    </Modal>
  )
}
