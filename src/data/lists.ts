/*
 * Listes de base pour fabriquer des données qui « sonnent vrai » tout en étant fictives :
 * rues génériques, prénoms/noms courants, raisons sociales inventées. Modifiez librement ces listes.
 */
import type { Country } from './types'

export interface City {
  id: string
  fr: string
  nl: string
  postcode: string
  country: Country
  /** Langue des noms de rue dans cette ville. */
  streets: 'fr' | 'nl'
  /** Position approximative (pour estimer les distances). */
  lat: number
  lon: number
}

export const CITIES: City[] = [
  { id: 'bruxelles', fr: 'Bruxelles', nl: 'Brussel', postcode: '1000', country: 'BE', streets: 'fr', lat: 50.85, lon: 4.35 },
  { id: 'ixelles', fr: 'Ixelles', nl: 'Elsene', postcode: '1050', country: 'BE', streets: 'fr', lat: 50.83, lon: 4.37 },
  { id: 'uccle', fr: 'Uccle', nl: 'Ukkel', postcode: '1180', country: 'BE', streets: 'fr', lat: 50.8, lon: 4.34 },
  { id: 'schaerbeek', fr: 'Schaerbeek', nl: 'Schaarbeek', postcode: '1030', country: 'BE', streets: 'fr', lat: 50.87, lon: 4.38 },
  { id: 'waterloo', fr: 'Waterloo', nl: 'Waterloo', postcode: '1410', country: 'BE', streets: 'fr', lat: 50.72, lon: 4.4 },
  { id: 'nivelles', fr: 'Nivelles', nl: 'Nijvel', postcode: '1400', country: 'BE', streets: 'fr', lat: 50.6, lon: 4.33 },
  { id: 'wavre', fr: 'Wavre', nl: 'Waver', postcode: '1300', country: 'BE', streets: 'fr', lat: 50.72, lon: 4.61 },
  { id: 'namur', fr: 'Namur', nl: 'Namen', postcode: '5000', country: 'BE', streets: 'fr', lat: 50.47, lon: 4.87 },
  { id: 'liege', fr: 'Liège', nl: 'Luik', postcode: '4000', country: 'BE', streets: 'fr', lat: 50.63, lon: 5.57 },
  { id: 'leuven', fr: 'Louvain', nl: 'Leuven', postcode: '3000', country: 'BE', streets: 'nl', lat: 50.88, lon: 4.7 },
  { id: 'mechelen', fr: 'Malines', nl: 'Mechelen', postcode: '2800', country: 'BE', streets: 'nl', lat: 51.03, lon: 4.48 },
  { id: 'lille', fr: 'Lille', nl: 'Rijsel', postcode: '59000', country: 'FR', streets: 'fr', lat: 50.63, lon: 3.06 },
  { id: 'roubaix', fr: 'Roubaix', nl: 'Roubaix', postcode: '59100', country: 'FR', streets: 'fr', lat: 50.69, lon: 3.18 },
  { id: 'paris11', fr: 'Paris', nl: 'Parijs', postcode: '75011', country: 'FR', streets: 'fr', lat: 48.86, lon: 2.38 },
  { id: 'paris15', fr: 'Paris', nl: 'Parijs', postcode: '75015', country: 'FR', streets: 'fr', lat: 48.84, lon: 2.3 },
]

export const STREETS = {
  fr: [
    'Rue des Tilleuls', 'Avenue des Acacias', 'Rue du Moulin', 'Rue de la Station', 'Avenue des Lilas',
    'Rue des Champs', 'Rue du Marché', 'Avenue du Parc', 'Rue des Écoles', 'Rue de la Fontaine',
    'Rue des Peupliers', 'Rue du Château', 'Avenue des Sorbiers', 'Rue des Glycines', 'Rue de la Paix',
  ],
  nl: ['Lindenstraat', 'Kerkstraat', 'Stationsstraat', 'Molenstraat', 'Schoolstraat', 'Beukenlaan', 'Populierenlaan', 'Dorpsstraat'],
} as const

export const FIRST_NAMES = {
  f: ['Claire', 'Sophie', 'Camille', 'Laura', 'Élise', 'Sarah', 'Inès', 'Lotte', 'An', 'Manon', 'Charlotte', 'Fatima'],
  m: ['Olivier', 'Pierre', 'Nicolas', 'Maxime', 'Hugo', 'Jonas', 'Wout', 'Samir', 'Arnaud', 'Benoît', 'Lucas', 'David'],
} as const

export const LAST_NAMES = [
  'Lambert', 'Dumont', 'Leroy', 'Willems', 'Maes', 'Jacobs', 'Mertens', 'Goossens', 'Renard', 'Hermans',
  'Fontaine', 'Collard', 'Simon', 'Laurent', 'Michel', 'Wouters', 'Petit', 'Girard', 'Martens', 'Delcourt',
] as const

/** Raisons sociales inventées (aucune entreprise réelle visée). */
export const COMPANY_NAMES = ['Nordal Conseil', 'Brixel Architectes', 'Optimea Assurances', 'Kalivo Médias', 'Verdane Ingénierie'] as const
