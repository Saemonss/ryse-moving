/*
 * Gérant › Dossier litige : une fiche simple (description, photos, statut) ouverte suite à un dégât signalé.
 */
import { ArrowLeft } from 'lucide-react'
import { useI18n } from '../../i18n'
import { fmtDate } from '../../i18n/format'
import { useDemo } from '../../store/demoStore'
import { byId, customerOf, fullName } from '../../data/selectors'
import type { Claim } from '../../data/types'
import { Card } from '../../ui/Card'
import { Button } from '../../ui/Button'
import { StatusBadge, type Tone } from '../../ui/StatusBadge'
import { PhotoView } from '../../ui/Photo'
import { toast } from '../../ui/Toast'
import { go, hrefOf } from '../../app/router'
import { ScreenLink } from '../shared/ScreenLink'
import { ClaimAiCard } from './ClaimAiCard'

const STATUSES: Claim['status'][] = ['ouvert', 'enCours', 'clos']
const TONE: Record<Claim['status'], Tone> = { ouvert: 'warning', enCours: 'info', clos: 'success' }

export function ClaimScreen({ param }: { param?: string }) {
  const { t, lang } = useI18n()
  const data = useDemo((s) => s.data)
  const setClaimStatus = useDemo((s) => s.setClaimStatus)
  const claim = data.claims.find((c) => c.id === param)
  const back = (
    <a
      href={hrefOf('gerant')}
      onClick={(e) => {
        e.preventDefault()
        go('gerant')
      }}
      className="mb-4 inline-flex items-center gap-1.5 rounded-md text-sm font-medium text-muted hover:text-ink"
    >
      <ArrowLeft size={16} aria-hidden="true" />
      {t('claims.back')}
    </a>
  )
  if (!claim)
    return (
      <>
        {back}
        <Card title={t('claims.notFound')}>
          <p className="text-muted">{t('file.notFoundText')}</p>
        </Card>
      </>
    )
  const move = byId(data.moves, claim.moveId)
  const day = data.days.find((d) => d.id === claim.dayId)
  const staff = byId(data.staff, day?.staffId)
  const mission = day?.missions.find((m) => m.moveId === claim.moveId)
  const photos = [claim.damage.photo, ...(mission?.startPhotos.map((p) => p.photo) ?? [])]

  return (
    <>
      {back}
      <header className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-[28px] font-semibold leading-tight tracking-[-0.025em]">{t('claims.title', { id: claim.id.toUpperCase() })}</h1>
          <p className="mt-1 text-[15px] text-muted">
            {t('claims.reportedBy', { name: staff ? fullName(staff) : '', date: fmtDate(move?.date ?? claim.openedAt.slice(0, 10), lang, 'long') })}
          </p>
        </div>
        <StatusBadge tone={TONE[claim.status]} size="lg">
          {t(`claims.statuses.${claim.status}`)}
        </StatusBadge>
      </header>
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <Card title={t('claims.description')}>
          <p className="text-[17px]">
            {t('claims.descriptionText', {
              item: t(`terrain.items.${claim.damage.item}`),
              type: t(`terrain.damageTypes.${claim.damage.type}`),
              severity: t(`terrain.severity.${claim.damage.severity}`).toLowerCase(),
            })}
          </p>
          {move && (
            <p className="mt-3 text-[15px] text-muted">
              {t('claims.move')}{' '}
              <ScreenLink view="gerant" screen="dossier" param={move.id} fallback>
                {customerOf(data, move)?.name} · {move.ref}
              </ScreenLink>
            </p>
          )}
          <h2 className="mb-2 mt-5 text-sm font-semibold text-muted">{t('claims.photos')}</h2>
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {photos.map((p, i) => (
              <li key={i}>
                <PhotoView photo={p} />
              </li>
            ))}
          </ul>
        </Card>
        <Card title={t('claims.status')}>
          <div className="flex flex-col gap-2">
            {STATUSES.filter((s) => s !== claim.status).map((s) => (
              <Button
                key={s}
                variant="secondary"
                onClick={() => {
                  setClaimStatus(claim.id, s)
                  toast(t('claims.statusDone', { status: t(`claims.statuses.${s}`) }))
                }}
              >
                {t('claims.setStatus', { status: t(`claims.statuses.${s}`) })}
              </Button>
            ))}
          </div>
        </Card>
      </div>
      <ClaimAiCard key={claim.id} claim={claim} />
    </>
  )
}
