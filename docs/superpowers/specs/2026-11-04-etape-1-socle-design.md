# Étape 1 : socle RySe Moving — design

Sources : `CLAUDE.md` (brief permanent), `prompt-etape-1-socle.md` (périmètre de l'étape), `PRODUCT.md`.
Ce document ne fixe que les décisions prises pendant le cadrage.

## Décisions de cadrage
- Langues : **FR (fr-BE) et NL (nl-BE)** seulement. Pas de format fr-FR.
- Vues **Chauffeur et Client** dans un cadre de téléphone neutre (sans marque) centré ; pas de barre latérale.
- Vues bureau (Gérant, Planificateur, Commercial, Comptabilité) : barre latérale `--ink`, menu « Accueil » seul.

## Architecture
- `src/app/` coque : barre du haut (sélecteur de vue, FR/NL, engrenage présentateur), bandeau démo, barre latérale,
  cadre téléphone, raccourcis clavier, routeur hash.
- `src/ui/` composants de base : Button (dont `size="xl"` ≥ 56 px), Card, StatusBadge, ActionAlert, SimpleTable,
  Field, Modal, Tabs, AiProcessing, Toast, Avatar, Logo (SVG inline).
- `src/views/<vue>/` un dossier par vue ; `src/views/charte/` page interne `#/charte` (hors menus).
- `src/i18n/` `fr.ts` (référence), `nl.ts` (typé `Dictionary` = même forme que FR ; textes marqués à relire),
  `t()` à clés typées, `format.ts` (dates, heures, €, nombres, téléphones via `Intl`).
- `src/data/` modèle typé (`types.ts`), listes de base (`lists.ts`), générateur déterministe (`seed.ts`, PRNG à
  graine fixe, dates relatives à aujourd'hui), situations de démo (`scenarios.ts`).
- `src/store/` Zustand + `persist` (`localStorage`). L'état mémorise son jour de création : un autre jour →
  réinitialisation automatique. Action `resetDemo()`.
- Routes : `#/gerant`, `#/planificateur`, `#/chauffeur`, `#/commercial`, `#/client`, `#/comptabilite`, `#/charte`.
  Route inconnue → `#/gerant`.

## Données de départ (minimum)
Entreprise (siège BE + agence nord de la France), ~14 personnes avec compétences et absences, ~8 véhicules (plaques
fictives BE/FR, entretiens/CT), ~20 clients particuliers/entreprises BE/FR (étage, ascenseur, accès, stationnement),
~30 dossiers à tous les statuts (demande → payé), types variés dont international avec CMR, garde-meuble, débarras ;
volumes, prix, acomptes, coûts estimés. Situations : conflit camion, devis sans réponse depuis 6 jours, objet abîmé,
facture en retard, contrôle technique proche. Semaines précédente, en cours et suivante toujours remplies.

## Accueils provisoires
- Gérant : déménagements du jour, CA du mois, alertes avec action, actions à faire. Une alerte → fenêtre de détail →
  solution en un clic → donnée modifiée, alerte retirée, message de confirmation.
- Chauffeur (Karim) : « Maintenant : … », mission du jour en une carte, bouton XL « Commencer ma journée » →
  statut en cours + confirmation.
- Autres vues : titre, utilisateur, aperçu de l'étape à venir, sans bouton factice.

## Vérification
`npm run check` = build + `vite preview` + Playwright Test (Chromium) :
- crawler : pour chaque vue × langue, clique chaque élément interactif visible et exige un effet visible ; état
  remis à zéro entre clics (rechargement avec données de départ) ;
- garde-fous : console sans erreur/avertissement, toute requête hors `localhost` bloquée et signalée ;
- parcours : modifications (alerte résolue, journée commencée) → réinitialisation → état identique au départ ;
- raccourcis : 1–6, L, Ctrl+Maj+R ;
- rapport lisible ✓/✗ par écran.

## Hors périmètre
Écrans métier détaillés (planning, devis, factures, PDF, graphiques) : étapes suivantes.
