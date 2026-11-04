/*
 * Accueil du chauffeur (dans le cadre de téléphone).
 * Règles : une seule action principale (très gros bouton), « Maintenant : … » toujours visible,
 * texte ≥ 17 px, aucune saisie clavier, confirmation rassurante après l'action.
 */
import { CircleCheck, MapPin, Play, Truck, Users } from 'lucide-react'
import { useI18n } from '../../i18n'
import { fmtDate, fmtTime } from '../../i18n/format'
import { useDemo } from '../../store/demoStore'
import { byId, customerOf, fmtAddress } from '../../data/selectors'
import type { Site } from '../../data/types'
import { Button } from '../../ui/Button'
import { Avatar } from '../../ui/Avatar'
import { toast } from '../../ui/Toast'
import { UpcomingPreview } from '../shared/Page'
import { useViewUser } from '../../app/shellState'

const KARIM = 's-karim'

export function ChauffeurHome() {
  const { t, lang } = useI18n()
  const data = useDemo((s) => s.data)
  const today = useDemo((s) => s.seedDay)
  const startDriverDay = useDemo((s) => s.startDriverDay)
  const user = useViewUser('chauffeur')
  const move = data.moves.find((m) => m.date === today && m.teamIds.includes(KARIM) && ['planifie', 'enCours'].includes(m.status))
  const started = move?.status === 'enCours'

  const floorText = (s: Site) =>
    `${s.floor === 0 ? t('common.groundFloor') : s.floor === 1 ? t('common.firstFloor') : t('common.floor', { n: s.floor })} · ${
      s.elevator ? t('common.elevator') : t('common.noElevator')
    }`

  return (
    <div className="flex min-h-full flex-col text-[17px] text-ink">
      <div className="flex-1 space-y-4 px-5 pb-4 pt-3">
        <header>
          <h1 className="text-[28px] font-bold leading-tight tracking-[-0.02em]">{t('chauffeur.hello', { name: user.firstName })}</h1>
          <p className="text-muted first-letter:uppercase">{fmtDate(today, lang, 'weekday')}</p>
        </header>

        <div role="status" className="rounded-2xl bg-ink px-4 py-3.5 text-white">
          <p className="text-[17px] leading-snug">
            <strong className="font-semibold text-accent-on-dark">{t('chauffeur.now')}</strong>{' '}
            {!move
              ? t('chauffeur.noMission')
              : started
                ? t('chauffeur.nowAfter', { address: fmtAddress(move.from, lang) })
                : t('chauffeur.nowBefore', { time: move.startTime })}
          </p>
        </div>

        {started && move?.startedAt && (
          <div className="flex items-start gap-3 rounded-2xl bg-success-soft px-4 py-3.5 text-success animate-[rm-fade-up_220ms_var(--ease-out)]">
            <CircleCheck size={26} className="mt-0.5 shrink-0" aria-hidden="true" />
            <div>
              <p className="font-semibold">{t('chauffeur.started', { time: fmtTime(move.startedAt, lang) })}</p>
              <p className="text-[17px] leading-snug text-ink/80">{t('chauffeur.startedHelp')}</p>
            </div>
          </div>
        )}

        {move ? (
          <section aria-labelledby="mission-title" className="rounded-2xl border border-line bg-white p-4 shadow-card">
            <div className="flex items-baseline justify-between gap-2">
              <h2 id="mission-title" className="text-[15px] font-medium text-muted">
                {t('chauffeur.missionTitle')}
              </h2>
              <span className="tabular text-lg font-bold">{move.startTime}</span>
            </div>
            <p className="mt-1 text-[22px] font-bold leading-tight">{customerOf(data, move)?.name}</p>
            <p className="text-muted">
              {t(`moveType.${move.type}`)} · {t('common.volume', { n: move.volumeM3 })}
            </p>

            <ol className="mt-4 space-y-3">
              {[
                { label: t('chauffeur.load'), site: move.from },
                ...(move.to ? [{ label: t('chauffeur.unload'), site: move.to }] : []),
              ].map(({ label, site }, i) => (
                <li key={label} className="flex gap-3">
                  <span className={`mt-0.5 grid size-8 shrink-0 place-items-center rounded-full ${i === 0 ? 'bg-accent text-white' : 'bg-surface-2 text-accent'}`}>
                    <MapPin size={17} aria-hidden="true" />
                  </span>
                  <div>
                    <p className="font-semibold">{label}</p>
                    <p className="leading-snug">{fmtAddress(site, lang)}</p>
                    <p className="text-muted">{floorText(site)}</p>
                  </div>
                </li>
              ))}
            </ol>

            {move.note && (
              <p className="mt-4 rounded-xl bg-warning-soft px-3.5 py-2.5 leading-snug text-ink">
                <strong className="font-semibold text-warning">{t('chauffeur.toKnow')}</strong> {t(`notes.${move.note}`, { n: move.from.number })}
              </p>
            )}

            <div className="mt-4 grid gap-3 border-t border-line pt-4">
              <div className="flex items-center gap-3">
                <Truck size={20} className="shrink-0 text-muted" aria-hidden="true" />
                <p>
                  <span className="text-muted">{t('chauffeur.truck')} </span>
                  <span className="font-semibold">{byId(data.vehicles, move.vehicleIds[0])?.plate}</span>
                </p>
              </div>
              <div className="flex items-center gap-3">
                <Users size={20} className="shrink-0 text-muted" aria-hidden="true" />
                <div className="flex items-center gap-2">
                  <span className="text-muted">{t('chauffeur.team')}</span>
                  {move.teamIds
                    .filter((id) => id !== KARIM)
                    .map((id) => {
                      const s = byId(data.staff, id)
                      return s ? (
                        <span key={id} className="flex items-center gap-1.5 font-semibold">
                          <Avatar name={`${s.firstName} ${s.lastName}`} size={26} />
                          {s.firstName}
                        </span>
                      ) : null
                    })}
                </div>
              </div>
            </div>
          </section>
        ) : null}

        <UpcomingPreview compact items={['chauffeur.previewItems.a', 'chauffeur.previewItems.b', 'chauffeur.previewItems.c']} />
      </div>

      {move && !started && (
        <div className="sticky bottom-0 bg-gradient-to-t from-[#f7f6fc] from-70% to-transparent px-5 pb-3 pt-6">
          <Button
            size="xl"
            icon={Play}
            onClick={() => {
              startDriverDay(move.id)
              toast(t('chauffeur.started', { time: fmtTime(new Date(), lang) }))
            }}
          >
            {t('chauffeur.start')}
          </Button>
        </div>
      )}
    </div>
  )
}
