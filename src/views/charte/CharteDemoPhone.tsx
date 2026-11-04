/*
 * Charte : démonstrateurs des briques du téléphone (pavé, choix en un tap, signature, photo).
 */
import { useState } from 'react'
import { Camera } from 'lucide-react'
import { useI18n } from '../../i18n'
import { BigChoice, Keypad } from '../../ui/phone/PhoneKit'
import { SignaturePad } from '../../ui/phone/SignaturePad'
import { PhotoPicker } from '../../ui/phone/PhotoPicker'
import { PhotoView } from '../../ui/Photo'
import { Button } from '../../ui/Button'

export function CharteDemoPhone() {
  const { t } = useI18n()
  const [code, setCode] = useState('')
  const [fuel, setFuel] = useState<'quart' | 'demi' | 'troisQuarts' | 'plein'>('demi')
  const [signed, setSigned] = useState(false)
  const [photo, setPhoto] = useState<string | null>(null)
  const [picking, setPicking] = useState(false)
  return (
    <div className="relative grid gap-6 overflow-hidden rounded-2xl bg-[#f7f6fc] p-5 md:grid-cols-3">
      <div className="space-y-3">
        <p className="tabular text-center text-[28px] font-bold tracking-[0.3em]" aria-live="polite">{code.padEnd(4, '·')}</p>
        <Keypad value={code} onChange={setCode} maxLength={4} />
      </div>
      <div className="space-y-3">
        <BigChoice
          label={t('terrain.check.fuelTitle')}
          value={fuel}
          onChange={setFuel}
          options={(['quart', 'demi', 'troisQuarts', 'plein'] as const).map((v) => ({ value: v, label: t(`terrain.check.fuel.${v}`) }))}
        />
        {photo ? <PhotoView photo={photo} /> : null}
        <Button variant="secondary" icon={Camera} onClick={() => setPicking(true)}>
          {t('terrain.picker.title')}
        </Button>
      </div>
      <div>
        <SignaturePad onChange={(img) => setSigned(!!img)} />
        <p className="mt-1 text-sm text-muted" aria-live="polite">{signed ? t('terrain.mission.signature' as never) : ''}</p>
      </div>
      <PhotoPicker open={picking} onClose={() => setPicking(false)} onPick={setPhoto} />
    </div>
  )
}
