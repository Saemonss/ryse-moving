/*
 * Les 6 vues de la démo et leurs écrans.
 * - Vue : identifiant (= adresse #/vue), raccourci clavier, mise en page, utilisateur fictif.
 * - Écran : identifiant (= adresse #/vue/ecran), icône, libellé du menu, visible dans le menu ou non.
 *   ready: false = pas encore développé → jamais affiché (ni menu, ni lien).
 */
import {
  CalendarDays, CalendarOff, CalendarRange, ChartColumn, ClipboardList, FileText, Handshake, House, LayoutDashboard, Receipt,
  Settings2, Smartphone, Truck, Users, type LucideIcon,
} from 'lucide-react'
import { CLIENT_CUSTOMER_ID } from '../data/seed'
import type { TKey } from '../i18n'

export const VIEW_IDS = ['gerant', 'planificateur', 'chauffeur', 'commercial', 'client', 'comptabilite'] as const
export type ViewId = (typeof VIEW_IDS)[number]

export interface ScreenDef {
  id: string
  icon: LucideIcon
  label: TKey
  menu: boolean
  ready: boolean
}

export interface ViewDef {
  id: ViewId
  key: string
  layout: 'desktop' | 'phone'
  icon: LucideIcon
  user: { kind: 'staff'; id: string } | { kind: 'customer'; id: string }
  screens: ScreenDef[]
}

const home: ScreenDef = { id: 'accueil', icon: House, label: 'menu.accueil', menu: true, ready: true }

export const VIEWS: ViewDef[] = [
  {
    id: 'gerant', key: '1', layout: 'desktop', icon: LayoutDashboard, user: { kind: 'staff', id: 's-nathalie' },
    screens: [
      home,
      { id: 'demenagements', icon: ClipboardList, label: 'menu.demenagements', menu: true, ready: false },
      { id: 'dossier', icon: FileText, label: 'menu.dossier', menu: false, ready: false },
      { id: 'planning', icon: CalendarRange, label: 'menu.planning', menu: true, ready: false },
      { id: 'equipe', icon: Users, label: 'menu.equipe', menu: true, ready: false },
      { id: 'flotte', icon: Truck, label: 'menu.flotte', menu: true, ready: false },
      { id: 'rentabilite', icon: ChartColumn, label: 'menu.rentabilite', menu: true, ready: false },
      { id: 'parametres', icon: Settings2, label: 'menu.parametres', menu: true, ready: false },
    ],
  },
  {
    id: 'planificateur', key: '2', layout: 'desktop', icon: CalendarRange, user: { kind: 'staff', id: 's-thomas' },
    screens: [
      home,
      { id: 'planning', icon: CalendarDays, label: 'menu.planning', menu: true, ready: false },
      { id: 'absences', icon: CalendarOff, label: 'menu.absences', menu: true, ready: false },
      { id: 'a-planifier', icon: ClipboardList, label: 'menu.aPlanifier', menu: true, ready: false },
    ],
  },
  { id: 'chauffeur', key: '3', layout: 'phone', icon: Truck, user: { kind: 'staff', id: 's-karim' }, screens: [home] },
  { id: 'commercial', key: '4', layout: 'desktop', icon: Handshake, user: { kind: 'staff', id: 's-julie' }, screens: [home] },
  { id: 'client', key: '5', layout: 'phone', icon: Smartphone, user: { kind: 'customer', id: CLIENT_CUSTOMER_ID }, screens: [home] },
  { id: 'comptabilite', key: '6', layout: 'desktop', icon: Receipt, user: { kind: 'staff', id: 's-marc' }, screens: [home] },
]

export const viewDef = (id: ViewId): ViewDef => VIEWS.find((v) => v.id === id) ?? VIEWS[0]!

/** Écrans prêts d'une vue (le premier est l'écran par défaut). */
export const readyScreens = (view: ViewId) => viewDef(view).screens.filter((s) => s.ready)

export const defaultScreen = (view: ViewId) => readyScreens(view)[0]?.id ?? 'accueil'

export const isScreenReady = (view: ViewId, screen: string) => readyScreens(view).some((s) => s.id === screen)
