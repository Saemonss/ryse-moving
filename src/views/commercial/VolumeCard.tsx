/*
 * Volume par photos : lien envoyé au client → photos reçues (démo) → l'agent produit un inventaire par pièce, un
 * volume et un niveau de confiance. Le commercial corrige les quantités ; LE VOLUME FINAL EST VALIDÉ PAR L'HUMAIN.
 * Confiance faible → l'agent propose une visite technique plutôt qu'un chiffre au hasard.
 */
import { useEffect, useState } from 'react'
import { Camera, CircleCheck, ClipboardCheck, Minus, Plus, Send } from 'lucide-react'
import { useI18n } from '../../i18n'
import { fmtNumber } from '../../i18n/format'
import { useDemo } from '../../store/demoStore'
import { inventoryTotal } from '../../data/inventory'
import type { Lead, RoomKey } from '../../data/types'
import { Card } from '../../ui/Card'
import { Button } from '../../ui/Button'
import { StatusBadge } from '../../ui/StatusBadge'
import { PhotoView } from '../../ui/Photo'
import { AiProcessing } from '../../ui/AiProcessing'
import { toast } from '../../ui/Toast'

const ROOMS: RoomKey[] = ['salon', 'chambre', 'cuisine', 'bureau', 'cave']

export function VolumeCard({ lead }: { lead: Lead }) {
  const { t, lang } = useI18n()
  const s = useDemo()
  const [analyzing, setAnalyzing] = useState(false)
  useEffect(() => {
    if (!analyzing) return
    const id = window.setTimeout(() => setAnalyzing(false), 1500)
    return () => window.clearTimeout(id)
  }, [analyzing])

  const lines = lead.inventory ?? []
  const total = inventoryTotal(lines)
  const validated = !!lead.volumeValidatedAt
  const move = s.data.moves.find((m) => m.id === lead.moveId)

  return (
    <Card title={t('inv.title')} aside={lead.confidence && !analyzing && <StatusBadge tone={lead.confidence === 'faible' ? 'warning' : 'accent'}>{t(`inv.confidence.${lead.confidence}`)}</StatusBadge>}>
      <p className="mb-3 text-[15px] text-muted">{t('inv.intro')}</p>

      {!lead.photosRequestedAt && !lead.photos && (
        <Button
          icon={Camera}
          onClick={() => {
            s.requestPhotos(lead.id)
            toast(t('inv.requested', { channel: t(`channels.${lead.channel}`) }))
          }}
        >
          {t('inv.request')}
        </Button>
      )}

      {lead.photosRequestedAt && !lead.photos && (
        <div className="space-y-3">
          <p className="flex items-center gap-2 text-[15px] text-success">
            <Send size={17} aria-hidden="true" />
            {t('inv.requested', { channel: t(`channels.${lead.channel}`) })}
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="secondary"
              onClick={() => {
                s.clientSendPhotos(lead.id, 'full')
                setAnalyzing(true)
              }}
            >
              {t('inv.simulateFull')}
            </Button>
            <Button
              variant="ghost"
              onClick={() => {
                s.clientSendPhotos(lead.id, 'partial')
                setAnalyzing(true)
              }}
            >
              {t('inv.simulatePartial')}
            </Button>
            <StatusBadge tone="neutral">{t('lead.demo')}</StatusBadge>
          </div>
        </div>
      )}

      {lead.photos && (
        <>
          <p className="mb-2 text-sm font-semibold text-muted">{t('inv.received', { n: lead.photos.length })}</p>
          <ul className="mb-4 grid grid-cols-4 gap-2">
            {lead.photos.map((p) => (
              <li key={p}>
                <PhotoView photo={p} />
              </li>
            ))}
          </ul>
          {analyzing ? (
            <AiProcessing label={t('inv.analyzing')} />
          ) : (
            <>
              <table className="w-full text-[15px]">
                <thead>
                  <tr className="border-b border-line text-left text-[13px] text-muted">
                    <th className="py-2 font-medium">{t('inv.colItem')}</th>
                    <th className="py-2 text-center font-medium">{t('inv.colQty')}</th>
                    <th className="py-2 text-right font-medium">{t('inv.colM3')}</th>
                  </tr>
                </thead>
                {ROOMS.filter((r) => lines.some((l) => l.room === r)).map((room) => (
                  <tbody key={room} className="tabular">
                    <tr>
                      <th colSpan={3} className="pt-3 text-left text-[13px] font-semibold text-muted">
                        {t(`terrain.rooms.${room}`)}
                      </th>
                    </tr>
                    {lines
                      .filter((l) => l.room === room)
                      .map((l) => (
                        <tr key={l.id} className="border-b border-line/60" data-crawl-sample>
                          <td className="py-1.5">{t(`inv.items.${l.item as 'canape'}`)}</td>
                          <td className="py-1.5">
                            <span className="flex items-center justify-center gap-2">
                              <button
                                type="button"
                                disabled={validated || l.qty === 0}
                                aria-label={`${t('inv.less')} · ${t(`inv.items.${l.item as 'canape'}`)}`}
                                onClick={() => s.setInventoryQty(lead.id, l.id, l.qty - 1)}
                                className="grid size-8 place-items-center rounded-lg bg-surface disabled:opacity-40"
                                hidden={validated || l.qty === 0}
                              >
                                <Minus size={15} aria-hidden="true" />
                              </button>
                              <span className="w-6 text-center font-semibold">{l.qty}</span>
                              <button
                                type="button"
                                aria-label={`${t('inv.more')} · ${t(`inv.items.${l.item as 'canape'}`)}`}
                                onClick={() => s.setInventoryQty(lead.id, l.id, l.qty + 1)}
                                className="grid size-8 place-items-center rounded-lg bg-surface"
                                hidden={validated}
                              >
                                <Plus size={15} aria-hidden="true" />
                              </button>
                            </span>
                          </td>
                          <td className="py-1.5 text-right text-muted">{`${fmtNumber(l.qty * l.m3, lang, 1)} m³`}</td>
                        </tr>
                      ))}
                  </tbody>
                ))}
              </table>
              <p className="tabular mt-3 text-[17px] font-semibold">{t('inv.total', { n: fmtNumber(total, lang, 1) })}</p>

              {lead.confidence === 'faible' && !validated && (
                <div className="mt-3 rounded-xl bg-warning-soft px-4 py-3">
                  <p className="text-[15px] text-ink">{t('inv.lowText')}</p>
                  {move?.status !== 'visite' && (
                    <Button
                      className="mt-2"
                      size="sm"
                      variant="secondary"
                      icon={ClipboardCheck}
                      onClick={() => {
                        s.proposeVisit(lead.id)
                        toast(t('inv.visitDone'))
                      }}
                    >
                      {t('inv.proposeVisit')}
                    </Button>
                  )}
                </div>
              )}

              {validated ? (
                <p className="mt-3 flex items-center gap-2 font-semibold text-success">
                  <CircleCheck size={18} aria-hidden="true" />
                  {t('inv.validatedBy', { n: fmtNumber(Math.round(total), lang) })}
                </p>
              ) : (
                <Button
                  className="mt-3"
                  icon={CircleCheck}
                  onClick={() => {
                    s.validateVolume(lead.id)
                    toast(t('inv.validated', { n: Math.round(total) }))
                  }}
                >
                  {t('inv.validate')}
                </Button>
              )}
            </>
          )}
        </>
      )}
    </Card>
  )
}
