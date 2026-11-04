/*
 * « Prendre une photo » sur PC : choix parmi les photos de démonstration embarquées,
 * ou un fichier du PC (réduit à ~320 px avant d'être gardé). Aucune image téléchargée depuis internet.
 */
import { useRef, useState } from 'react'
import { Camera, FolderOpen } from 'lucide-react'
import { useI18n } from '../../i18n'
import { DEMO_PHOTOS, PhotoView, shrinkImage, type DemoPhotoKey } from '../Photo'
import { Sheet } from './PhoneKit'

interface PhotoPickerProps {
  open: boolean
  onClose: () => void
  onPick: (photo: string) => void
  /** Photos proposées en premier (les plus probables pour cette étape). */
  suggested?: DemoPhotoKey[]
  title?: string
}

export function PhotoPicker({ open, onClose, onPick, suggested, title }: PhotoPickerProps) {
  const { t } = useI18n()
  const input = useRef<HTMLInputElement>(null)
  const [error, setError] = useState(false)
  const order = [...(suggested ?? []), ...DEMO_PHOTOS.filter((p) => !suggested?.includes(p))]
  return (
    <Sheet open={open} onClose={onClose} title={title ?? t('terrain.picker.title')}>
      <p className="mb-2 text-[15px] font-semibold text-muted">{t('terrain.picker.demo')}</p>
      <div className="grid grid-cols-2 gap-2">
        {order.map((key) => (
          <button
            key={key}
            type="button"
            onClick={() => {
              onPick(`demo:${key}`)
              onClose()
            }}
            className="overflow-hidden rounded-xl text-left ring-1 ring-line transition-transform active:scale-[0.97]"
          >
            <PhotoView photo={`demo:${key}`} className="rounded-none" />
            <span className="block px-2 py-1.5 text-[14px] font-medium leading-tight">{t(`photos.${key}`)}</span>
          </button>
        ))}
      </div>
      <input
        ref={input}
        type="file"
        accept="image/*"
        className="sr-only"
        tabIndex={-1}
        aria-hidden="true"
        onChange={async (e) => {
          const file = e.target.files?.[0]
          e.target.value = ''
          if (!file) return
          try {
            setError(false)
            onPick(await shrinkImage(file))
            onClose()
          } catch {
            setError(true)
          }
        }}
      />
      <button
        type="button"
        onClick={() => input.current?.click()}
        className="mt-3 flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-line text-[16px] font-semibold text-ink"
      >
        <FolderOpen size={20} aria-hidden="true" className="text-accent" />
        {t('terrain.picker.file')}
      </button>
      {error && <p className="mt-2 text-[15px] font-medium text-danger">{t('terrain.picker.error')}</p>}
      <p className="mt-3 flex items-center gap-2 text-[14px] text-muted">
        <Camera size={16} aria-hidden="true" />
        {t('terrain.picker.note')}
      </p>
    </Sheet>
  )
}
