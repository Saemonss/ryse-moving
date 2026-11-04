/*
 * Les 6 vues de la démo : identifiant (= adresse #/...), raccourci clavier, mise en page et utilisateur fictif.
 * layout 'phone' = affichée dans le cadre de téléphone (Chauffeur, Client).
 */
import { CalendarRange, Handshake, LayoutDashboard, Receipt, Smartphone, Truck, type LucideIcon } from 'lucide-react'
import { CLIENT_CUSTOMER_ID } from '../data/seed'

export const VIEW_IDS = ['gerant', 'planificateur', 'chauffeur', 'commercial', 'client', 'comptabilite'] as const
export type ViewId = (typeof VIEW_IDS)[number]

export interface ViewDef {
  id: ViewId
  key: string
  layout: 'desktop' | 'phone'
  icon: LucideIcon
  user: { kind: 'staff'; id: string } | { kind: 'customer'; id: string }
}

export const VIEWS: ViewDef[] = [
  { id: 'gerant', key: '1', layout: 'desktop', icon: LayoutDashboard, user: { kind: 'staff', id: 's-nathalie' } },
  { id: 'planificateur', key: '2', layout: 'desktop', icon: CalendarRange, user: { kind: 'staff', id: 's-thomas' } },
  { id: 'chauffeur', key: '3', layout: 'phone', icon: Truck, user: { kind: 'staff', id: 's-karim' } },
  { id: 'commercial', key: '4', layout: 'desktop', icon: Handshake, user: { kind: 'staff', id: 's-julie' } },
  { id: 'client', key: '5', layout: 'phone', icon: Smartphone, user: { kind: 'customer', id: CLIENT_CUSTOMER_ID } },
  { id: 'comptabilite', key: '6', layout: 'desktop', icon: Receipt, user: { kind: 'staff', id: 's-marc' } },
]

export const viewDef = (id: ViewId): ViewDef => VIEWS.find((v) => v.id === id) ?? VIEWS[0]!
