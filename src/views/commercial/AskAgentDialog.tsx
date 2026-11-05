/*
 * « Demander à l'agent » : le gérant (ou le commercial) confie à l'agent une demande reçue directement par appel
 * ou par SMS. Il colle le SMS ou tape ses notes ; l'agent prépare le dossier et dit ce qu'il manque.
 */
import { useEffect, useState } from 'react'
import { translate, useI18n } from '../../i18n'
import { useDemo } from '../../store/demoStore'
import type { LeadChannel } from '../../data/types'
import { Modal } from '../../ui/Modal'
import { Button } from '../../ui/Button'
import { Field, TextArea } from '../../ui/Field'
import { Select } from '../../ui/Select'
import { go, useRoute } from '../../app/router'
import type { ViewId } from '../../app/views'

export function AskAgentDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { t, lang } = useI18n()
  const askAgent = useDemo((s) => s.askAgent)
  const view = useRoute().view as ViewId
  const [channel, setChannel] = useState<LeadChannel>('appel')
  const [leadLang, setLeadLang] = useState<'fr' | 'nl'>(lang)
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('+32 475 64 21 08')
  const [notes, setNotes] = useState('')
  // Exemple prérempli (modifiable), dans la langue choisie pour le prospect
  useEffect(() => {
    if (!open) return
    setName(translate(leadLang, 'ask.exampleName'))
    setNotes(translate(leadLang, 'ask.example'))
  }, [open, leadLang])
  const valid = name.trim() !== '' && notes.trim() !== ''

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={t('ask.title')}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            {t('common.cancel')}
          </Button>
          {!valid && (
            <p id="ask-hint" className="mr-auto self-center text-[13px] text-muted">
              {t('ask.hint')}
            </p>
          )}
          <Button
            disabled={!valid}
            aria-describedby={valid ? undefined : 'ask-hint'}
            onClick={() => {
              const id = askAgent({ channel, name, phone: phone.replace(/\s/g, ''), notes, lang: leadLang })
              onClose()
              go(view, 'demande', id)
            }}
          >
            {t('ask.submit')}
          </Button>
        </>
      }
    >
      <p className="mb-4 text-muted">{t('ask.intro')}</p>
      <div className="grid gap-3 sm:grid-cols-2">
        <Select
          label={t('ask.channel')}
          value={channel}
          onChange={(v) => setChannel(v as LeadChannel)}
          options={(['appel', 'sms'] as const).map((c) => ({ value: c, label: t(`channels.${c}`) }))}
        />
        <Select
          label={t('ask.lang')}
          value={leadLang}
          onChange={(v) => setLeadLang(v as 'fr' | 'nl')}
          options={[
            { value: 'fr', label: 'Français' },
            { value: 'nl', label: 'Nederlands' },
          ]}
        />
        <Field label={t('ask.name')} value={name} onChange={(e) => setName(e.target.value)} />
        <Field label={t('ask.phone')} value={phone} onChange={(e) => setPhone(e.target.value)} />
      </div>
      <p className="mt-3 text-[15px] font-medium text-ink" aria-live="polite">
        {t('ask.summary', { channel: t(`channels.${channel}`), name: name.trim() || '—', phone: phone.trim() || '—' })}
      </p>
      <TextArea label={t('ask.notes')} rows={4} className="mt-3" value={notes} onChange={(e) => setNotes(e.target.value)} />
    </Modal>
  )
}
