/*
 * Modèle de données de la démo (100 % fictif).
 * Les libellés affichés ne sont jamais stockés ici : on stocke des codes (ex. status: 'planifie')
 * traduits à l'affichage via i18n. Les montants sont en centimes, les dates au format 'AAAA-MM-JJ'.
 */

export type ISODate = string
export type Country = 'BE' | 'FR'

export interface Address {
  street: string
  number: string
  postcode: string
  cityId: string
  country: Country
}

/** Adresse de chargement ou de livraison, avec les infos d'accès utiles au terrain. */
export interface Site extends Address {
  floor: number
  elevator: boolean
}

export interface Agency {
  id: string
  kind: 'siege' | 'agence'
  address: Address
}

export interface Company {
  name: string
  email: string
  agencies: Agency[]
}

export type StaffRole = 'gerant' | 'planificateur' | 'commercial' | 'comptable' | 'chefEquipe' | 'chauffeur' | 'demenageur'
export type Skill = 'permisC' | 'monteMeubles' | 'emballage' | 'international'
export type Gender = 'm' | 'f'

export interface Staff {
  id: string
  firstName: string
  lastName: string
  gender: Gender
  role: StaffRole
  skills: Skill[]
  agencyId: string
  phone: string
}

export type AbsenceKind = 'conge' | 'maladie' | 'formation'

export interface Absence {
  id: string
  staffId: string
  kind: AbsenceKind
  from: ISODate
  to: ISODate
}

export type VehicleKind = 'camion20' | 'camion40' | 'porteurHayon' | 'utilitaire' | 'monteMeubles'

export interface Vehicle {
  id: string
  kind: VehicleKind
  plate: string
  country: Country
  volumeM3: number
  agencyId: string
  nextService: ISODate
  nextInspection: ISODate
  /** Date de contrôle technique réservée (après résolution de l'alerte). */
  inspectionBookedOn?: ISODate
}

export interface Customer {
  id: string
  kind: 'particulier' | 'entreprise'
  /** Particulier : « Prénom Nom ». Entreprise : raison sociale fictive. */
  name: string
  /** Entreprise : personne de contact. */
  contact?: string
  gender: Gender
  phone: string
  email: string
}

export type MoveStatus = 'demande' | 'visite' | 'devisEnvoye' | 'devisSigne' | 'planifie' | 'enCours' | 'termine' | 'facture' | 'paye'
export type MoveType = 'appartement' | 'maison' | 'bureaux' | 'international' | 'gardeMeuble' | 'debarras'
export type MoveOption = 'emballage' | 'monteMeubles' | 'gardeMeuble'

export interface Damage {
  item: 'commode'
  reportedBy: string
  claimOpened: boolean
}

export interface Move {
  id: string
  ref: string
  customerId: string
  type: MoveType
  status: MoveStatus
  /** Jour du déménagement (souhaité ou planifié). */
  date: ISODate
  startTime: string
  from: Site
  /** Absent pour un débarras (destination : centre de tri) ou garde-meuble (destination : notre dépôt). */
  to?: Site
  volumeM3: number
  options: MoveOption[]
  priceCents: number
  depositCents: number
  costCents: number
  teamIds: string[]
  vehicleIds: string[]
  note?: 'piano' | 'parking'
  cmr?: string
  requestedOn: ISODate
  visitOn?: ISODate
  quoteSentOn?: ISODate
  quoteReminderOn?: ISODate
  signedOn?: ISODate
  startedAt?: string
  invoiceNumber?: string
  invoicedOn?: ISODate
  invoiceDueOn?: ISODate
  paymentReminderOn?: ISODate
  paidOn?: ISODate
  damage?: Damage
}

export interface DemoData {
  company: Company
  staff: Staff[]
  absences: Absence[]
  vehicles: Vehicle[]
  customers: Customer[]
  moves: Move[]
}

export type AlertKind = 'conflict' | 'quote' | 'damage' | 'invoice' | 'inspection'

/** Les alertes sont calculées à partir des données (jamais stockées) : régler le problème les fait disparaître. */
export interface Alert {
  id: string
  kind: AlertKind
  tone: 'danger' | 'warning' | 'info'
  moveId?: string
  otherMoveId?: string
  vehicleId?: string
  suggestedVehicleId?: string
  suggestedDate?: ISODate
  days?: number
}
