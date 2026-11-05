/*
 * État de la coque (non sauvegardé) : fenêtre de réinitialisation ouverte ou non,
 * et utilisateur fictif de la vue en cours.
 */
import { create } from 'zustand'
import { useI18n } from '../i18n'
import { useDemo } from '../store/demoStore'
import { byId, fullName } from '../data/selectors'
import { viewDef, type ViewId } from './views'

interface ShellState {
  resetOpen: boolean
  setResetOpen: (open: boolean) => void
  newLeadOpen: boolean
  setNewLeadOpen: (open: boolean) => void
}

export const useShell = create<ShellState>()((set) => ({
  resetOpen: false,
  setResetOpen: (resetOpen) => set({ resetOpen }),
  newLeadOpen: false,
  setNewLeadOpen: (newLeadOpen) => set({ newLeadOpen }),
}))

/** Nom, prénom et rôle traduit de la personne qui « utilise » la vue. */
export function useViewUser(view: ViewId) {
  const { t } = useI18n()
  const data = useDemo((s) => s.data)
  const def = viewDef(view)
  if (def.user.kind === 'customer') {
    const pending = data.leads.filter((l) => l.quote?.sentAt && !l.quote.signedAt).sort((a, b) => (b.quote!.sentAt! > a.quote!.sentAt! ? 1 : -1))[0]
    if (pending) return { name: pending.name, firstName: pending.name.split(' ')[0] ?? '', role: t('roles.client.m') }
    const c = byId(data.customers, def.user.id)
    const name = c?.name ?? ''
    return { name, firstName: name.split(' ')[0] ?? '', role: t(`roles.client.${c?.gender ?? 'f'}`) }
  }
  const s = byId(data.staff, def.user.id)
  if (!s) return { name: '', firstName: '', role: '' }
  return { name: fullName(s), firstName: s.firstName, role: t(`roles.${s.role}.${s.gender}`) }
}
