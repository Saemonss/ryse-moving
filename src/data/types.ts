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
export type Access = 'facile' | 'rueEtroite' | 'escalierEtroit' | 'cour'
export type Parking = 'libre' | 'autorisation' | 'difficile'

export interface Site extends Address {
  floor: number
  elevator: boolean
  access: Access
  parking: Parking
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
  /** Monte-meubles loué (notre monte-meubles était déjà pris ce jour-là). */
  liftRented?: boolean
  /** Coûts supplémentaires (en centimes), ex. location d'un monte-meubles. */
  extraCosts?: { kind: 'liftRental' | 'expenses'; cents: number }[]
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
/** Grille tarifaire (prix de vente) utilisée par l'agent pour préparer les devis. Montants en centimes. */
export interface Pricing {
  perM3Cents: number
  travelFlatCents: number
  perKmCents: number
  stairsPerFloorCents: number
  packingPerM3Cents: number
  liftCents: number
  storagePerMonthCents: number
  clearanceCents: number
  pianoCents: number
  depositPct: number
}

export interface Settings {
  pricing: Pricing
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
  /** Journées des chauffeurs telles que le BUREAU les a reçues (dernière synchronisation). */
  days: DriverDay[]
  /** Dossiers litige ouverts suite à un dégât. */
  claims: Claim[]
  /** Demandes entrantes (tous canaux) et leur traitement par l'agent d'accueil. */
  leads: Lead[]
  staff: Staff[]
  absences: Absence[]
  vehicles: Vehicle[]
  customers: Customer[]
  moves: Move[]
}

export type AlertKind = 'conflict' | 'quote' | 'damage' | 'invoice' | 'inspection' | 'lowMargin' | 'callback' | 'quoteReady'

// ─── Terrain : journée du chauffeur ───────────────────────────────────────────────────────────

/** Photo : illustration de démonstration (« demo:salon ») ou image choisie sur le PC (data URL réduite). */
export type PhotoRef = string
export type RoomKey = 'salon' | 'chambre' | 'cuisine' | 'bureau' | 'cave'
export type FragileKey = 'miroir' | 'vaisselle' | 'tableau' | 'ecran' | 'piano'
export type ReserveKey = 'rayuresExistantes' | 'meubleDemonte' | 'cartonsClient' | 'accesDifficile'
export type SpecialKey = 'piano' | 'frigo' | 'armoire' | 'coffre' | 'aquarium'
export type DamageType = 'rayure' | 'casse' | 'tache' | 'bosse'
export type Severity = 'leger' | 'moyen' | 'grave'
export type FuelLevel = 'quart' | 'demi' | 'troisQuarts' | 'plein'
export type ExpenseKind = 'peage' | 'carburant' | 'parking'

export interface Damage {
  item: FragileKey | SpecialKey | 'meuble'
  type: DamageType
  severity: Severity
  photo: PhotoRef
}

/** Une mission (= un déménagement) vue du terrain. step = nombre d'étapes faites (0 à 7, 7 = terminée). */
export interface MissionLog {
  moveId: string
  step: number
  /** Heure de chaque étape franchie (ISO). */
  times: string[]
  startPhotos: { room: RoomKey; photo: PhotoRef }[]
  fragile: FragileKey[]
  reservesStart: ReserveKey[]
  parcels: number
  specialItems: SpecialKey[]
  endPhotos: { room: RoomKey; photo: PhotoRef }[]
  reservesEnd: ReserveKey[]
  damage?: Damage
  signature?: { name: string; image: string; at: string }
}

export interface Expense {
  id: string
  kind: ExpenseKind
  cents: number
  photo: PhotoRef
  at: string
  /** Mission en cours au moment de la saisie (le coût lui est rattaché). */
  moveId?: string
}

export interface DriverDay {
  id: string
  staffId: string
  date: ISODate
  status: 'started' | 'ended' | 'sent' | 'validated'
  startedAt: string
  startPlace: string
  vehicleId: string
  check?: { km: number; odometerPhoto: PhotoRef; fuel: FuelLevel; ok: boolean; problemPhoto?: PhotoRef }
  pauses: { start: string; end?: string }[]
  expenses: Expense[]
  missions: MissionLog[]
  endedAt?: string
  endKm?: number
  endPlace?: string
  sentAt?: string
  /** Corrections faites par le gérant (trace). */
  corrections: { field: 'hours' | 'km' | 'expenses'; from: number; to: number; at: string }[]
  validatedAt?: string
}

export interface Claim {
  id: string
  moveId: string
  dayId: string
  openedAt: string
  status: 'ouvert' | 'enCours' | 'clos'
  damage: Damage
}

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
  /** Journée chauffeur concernée (kind 'damage'). */
  dayId?: string
  /** Demande concernée (kind 'callback'). */
  leadId?: string
}

export type ConflictKind = 'vehicleDouble' | 'personDouble' | 'personAbsent' | 'skillMissing' | 'overCapacity' | 'inspectionOverdue'

/** Solution en un clic : remplacer (ou ajouter) une personne, ou remplacer un véhicule. */
export type ConflictFix =
  | { type: 'vehicle'; from: string; to: string }
  | { type: 'staff'; from?: string; to: string }
  /** Décaler le dossier au premier jour sans conflit. */
  | { type: 'postpone'; to: ISODate }
  /** Louer un monte-meubles pour ce chantier (coût ajouté au dossier). */
  | { type: 'rentLift' }

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

// ─── Demandes entrantes et agent d'accueil ────────────────────────────────────────────────────

export type LeadChannel = 'site' | 'appel' | 'vocal' | 'mail' | 'whatsapp' | 'sms' | 'plateforme'
/** Informations qu'il faut pour préparer un devis. */
export type LeadField = 'fromCity' | 'fromFloor' | 'fromElevator' | 'toCity' | 'toFloor' | 'toElevator' | 'date' | 'volume'

/** Ce que le client a dit (ou que l'agent a compris). Absent = pas encore connu. */
export interface LeadFacts {
  fromCity?: string
  fromFloor?: number
  fromElevator?: boolean
  toCity?: string
  toFloor?: number
  toElevator?: boolean
  date?: ISODate
  volume?: number
  special?: 'piano' | 'coffre'
}

export type LeadStatus = 'nouvelle' | 'attenteClient' | 'rappel' | 'complete' | 'atypique'

export interface InventoryLine {
  id: string
  room: RoomKey
  item: string
  qty: number
  m3: number
}

export interface QuoteLine {
  id: string
  kind: 'volume' | 'deplacement' | 'km' | 'etages' | 'emballage' | 'monteMeubles' | 'gardeMeuble' | 'debarras' | 'special' | 'libre'
  qty: number
  unitCents: number
  /** Raison donnée par l'agent pour une option proposée. */
  reason?: 'stairs' | 'fragile' | 'storage' | 'special'
}

export interface Quote {
  lines: QuoteLine[]
  depositPct: number
  preparedAt: string
  sentAt?: string
  signedAt?: string
  signature?: { name: string; image: string }
}

export interface Lead {
  id: string
  channel: LeadChannel
  lang: 'fr' | 'nl'
  name: string
  phone: string
  receivedAt: string
  /** Qui a saisi la demande : le client lui-même, ou le gérant (appel / SMS reçu directement). */
  origin: 'client' | 'gerant'
  /** Texte libre saisi par le gérant (notes d'appel, SMS collé). */
  notes?: string
  /** Ce que dit le message d'origine. */
  facts: LeadFacts
  /** Compléments apportés ensuite (réponse du client, rappel du gérant). */
  added: LeadFacts
  status: LeadStatus
  moveId?: string
  replyAt?: string
  clientReplyAt?: string
  callback?: { questions: LeadField[]; doneAt?: string }
  photosRequestedAt?: string
  photosAt?: string
  photos?: string[]
  inventory?: InventoryLine[]
  confidence?: 'haute' | 'moyenne' | 'faible'
  volumeValidatedAt?: string
  quote?: Quote
}
