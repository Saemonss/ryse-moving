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
  /** Équipe type choisie au planning (les personnes réellement affectées sont dans teamIds). */
  crewId?: string
  teamIds: string[]
  vehicleIds: string[]
  note?: 'piano' | 'parking'
  cmr?: string
  /** Durée prévue sur place + trajets, en heures. */
  plannedHours: number
  /** Durée réelle (dossiers terminés). */
  actualHours?: number
  /** Kilomètres parcourus : dépôt → départ → arrivée → dépôt. */
  distanceKm: number
  /** Monte-meubles utilisé (facturé seulement si l'option 'monteMeubles' figure au devis). */
  liftUsed?: boolean
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

/** Équipe type : un chef, ses équipiers, son camion habituel. */
export interface Team {
  id: string
  leaderId: string
  memberIds: string[]
  defaultVehicleId: string
  agencyId: string
}

/** Paramètres de calcul de la marge (modifiables par le gérant). Montants en centimes. */
export interface Settings {
  hourlyCostCents: number
  kmCostCents: Record<VehicleKind, number>
  fuelCentsPerLitre: number
  marginThresholdPct: number
}

export interface DemoData {
  company: Company
  settings: Settings
  teams: Team[]
  /** Dernière publication du planning aux équipes. */
  published?: { at: string; staffIds: string[] }
  staff: Staff[]
  absences: Absence[]
  vehicles: Vehicle[]
  customers: Customer[]
  moves: Move[]
}

export type AlertKind = 'conflict' | 'quote' | 'damage' | 'invoice' | 'inspection' | 'lowMargin'

/** Les alertes sont calculées à partir des données (jamais stockées) : régler le problème les fait disparaître. */
export interface Alert {
  id: string
  kind: AlertKind
  tone: 'danger' | 'warning' | 'info'
  moveId?: string
  vehicleId?: string
  suggestedDate?: ISODate
  days?: number
  /** Nombre d'éléments concernés (ex. dossiers à marge faible). */
  count?: number
  /** Conflit de planning à l'origine de l'alerte (kind 'conflict'). */
  conflict?: PlanConflict
}

export type ConflictKind = 'vehicleDouble' | 'personDouble' | 'personAbsent' | 'skillMissing' | 'overCapacity' | 'inspectionOverdue'

/** Solution en un clic : remplacer (ou ajouter) une personne, ou remplacer un véhicule. */
export type ConflictFix =
  | { type: 'vehicle'; from: string; to: string }
  | { type: 'staff'; from?: string; to: string }

export interface PlanConflict {
  id: string
  kind: ConflictKind
  moveId: string
  date: ISODate
  staffId?: string
  vehicleId?: string
  otherMoveId?: string
  skill?: Skill
  fix?: ConflictFix
}
