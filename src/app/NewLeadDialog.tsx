/*
 * Menu présentateur › « Simuler une nouvelle demande » : on choisit le canal et la langue du client,
 * la demande arrive avec une notification et s'ouvre : l'agent la traite sous les yeux du prospect.
 */
import { useState } from 'react'
import { useI18n } from '../i18n'
import { useDemo } from '../store/demoStore'
import { LEAD_CHANNELS } from '../data/leads'
import type { LeadChannel } from '../data/types'
import { Modal } from '../ui/Modal'
import { Button } from '../ui/Button'
import { Select } from '../ui/Select'
import { toast } from '../ui/Toast'
import { go } from './router'
import { useShell } from './shellState'

export function NewLeadDialog() {
  const { t, lang } = useI18n()
  const open = useShell((s) => s.newLeadOpen)
  const setOpen = useShell((s) => s.setNewLeadOpen)
  const simulateLead = useDemo((s) => s.simulateLead)
  const [channel, setChannel] = useState<LeadChannel>('whatsapp')
  const [leadLang, setLeadLang] = useState<'fr' | 'nl'>(lang)
  return (
    <Modal
      open={open}
      onClose={() => setOpen(false)}
      title={t('newLead.title')}
      footer={
        <>
          <Button variant="secondary" onClick={() => setOpen(false)}>
            {t('common.cancel')}
          </Button>
          <Button
            onClick={() => {
              const id = simulateLead(channel, leadLang)
              const name = useDemo.getState().data.leads.find((l) => l.id === id)?.name ?? ''
              setOpen(false)
              toast(t('newLead.arrived', { channel: t(`channels.${channel}`), name }), 'info')
              go('commercial', 'demande', id)
            }}
          >
            {t('newLead.send')}
          </Button>
        </>
      }
    >
      <div className="grid gap-3 sm:grid-cols-2">
        <Select label={t('newLead.channel')} value={channel} onChange={(v) => setChannel(v as LeadChannel)} options={LEAD_CHANNELS.map((c) => ({ value: c, label: t(`channels.${c}`) }))} />
        <Select
          label={t('newLead.lang')}
          value={leadLang}
          onChange={(v) => setLeadLang(v as 'fr' | 'nl')}
          options={[
            { value: 'fr', label: 'Français' },
            { value: 'nl', label: 'Nederlands' },
          ]}
        />
      </div>
    </Modal>
  )
}
