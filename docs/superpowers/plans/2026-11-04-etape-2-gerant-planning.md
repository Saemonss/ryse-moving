# Étape 2 : Gérant et Planificateur — plan d'implémentation

> **For agentic workers:** superpowers:executing-plans (CLAUDE.md). Lot par lot, capture par lot, commit par lot.

**Goal :** vues Gérant (7 écrans) et Planificateur (3 écrans) fonctionnelles, reliées au store, `npm run check` vert.
**Architecture :** logique métier pure dans `src/data/` (marge, conflits, planning), actions dans le store, écrans
dans `src/views/<vue>/`, composant planning partagé dans `src/views/shared/planning/`.
**Tech :** existant + `recharts`.
**Spec :** `docs/superpowers/specs/2026-11-04-etape-2-gerant-planning-design.md`

## Global Constraints
- Réutiliser les composants de `src/ui/` ; un nouveau composant seulement s'il manque (ex. Select, Popover menu).
- Aucun texte en dur ; FR + NL ; formats via `format.ts`.
- Aucun élément non fonctionnel affiché ; pas d'IA, PDF ni chauffeur détaillé.
- Toute modification passe par le store et survit au rechargement.

## Review Focus
1. Glisser un dossier sur une case déjà occupée / un jour passé → conflit visible ou refus clair, jamais d'état cassé.
2. Absence créée à cheval sur plusieurs dossiers → tous les conflits apparaissent, chacun résoluble.
3. Paramètre vide, négatif ou énorme → valeur bornée, aucune marge NaN/Infinity affichée.
4. Résolution impossible (aucun camion/remplaçant libre) → pas de bouton « Résoudre » mort : explication à la place.
5. Navigation semaine très loin (± 10 semaines) → planning vide propre, « Aujourd'hui » ramène.

---

### Lot 1 : modèle v2, marge, conflits, store
Files : `src/data/{types,seed,margin,conflicts,planning}.ts`, `src/data/scenarios.ts`, `src/store/demoStore.ts`, i18n.
- Types : `Team`, `Settings`, `Move` + `crewId?`, `plannedHours`, `actualHours?`, `distanceKm`, `liftUsed?`,
  `liftBilled?` (retrait de `costCents`) ; `DemoData` + `teams`, `settings`, `publishedAt?`.
- `margin.ts` : `moveCost(move, data) → { labour, transport, material, total }`, `moveMargin(move, data) →
  { cents, rate }`, `marginReasons(move, data) → ('hours'|'distance'|'liftUnbilled')[]`, `isLowMargin`.
- `conflicts.ts` : `detectConflicts(data, from, to) → PlanConflict[]` (`kind`: vehicleDouble | personDouble |
  personAbsent | skillMissing | overCapacity | inspectionOverdue ; `moveId`, `staffId?`, `vehicleId?`, `fix?`) ;
  `applyFix(data, conflict) → DemoData`. `deriveAlerts` réutilise `detectConflicts` pour les conflits.
- Store : `assignMove(moveId, {date, crewId, vehicleId})`, `addAbsence(a)`, `removeAbsence(id)`,
  `updateSettings(patch)` (valeurs bornées), `resolveConflict(c)`, `publishPlanning()` ; `SCHEMA_VERSION = 3`.
- Vérif : tsc + `npm run check` existant vert (aucune régression), commit.

### Lot 2 : navigation par menus + accueil gérant v2
Files : `src/app/{router,views,Sidebar}.ts(x)`, `src/views/gerant/GerantHome.tsx`.
- `useRoute() → { view, screen, param }` ; menus par vue ; Accueil : avancement du jour (étape en cours par dossier),
  CA + marge du mois, alertes (« Résoudre », « Relancer », « Voir »), à faire ; chaque bloc mène à son écran.
- Capture accueil FR ; commit.

### Lot 3 : Déménagements + fiche dossier
Files : `src/views/gerant/{MovesList,MoveFile,Timeline}.tsx`, `src/ui/Select.tsx`.
- Liste : filtres statut, type, pays, période + recherche (client, ville, n° dossier) ; ligne → fiche.
- Fiche : client, adresses (étage, ascenseur, accès), volume, équipe, camion, prix, acompte, coûts détaillés, marge
  (+ explications), frise demande → payé.
- Capture fiche FR ; commit.

### Lot 4 : planning partagé (semaine + jour)
Files : `src/views/shared/planning/{WeekPlanning,DayPlanning,MoveBlock,planningColors}.tsx`.
- Lignes équipes + véhicules, 7 jours, navigation, « Aujourd'hui », blocs colorés par type, conflits signalés,
  vue jour. Gérant : écran Planning en lecture, clic bloc → fiche.
- Capture planning avec conflit ; commit.

### Lot 5 : Planificateur
Files : `src/views/planificateur/{PlanningScreen,AssignDialog,ConflictPanel,AbsencesScreen,ToPlanScreen,
PublishDialog}.tsx`.
- Glisser-déposer (dossier à planifier ou bloc existant → case équipe/jour), bouton « Affecter » (fenêtre),
  panneau de conflits avec « Résoudre », absences (ajout/suppression), dossiers à planifier, publier.
- Capture ; commit.

### Lot 6 : Équipe, Flotte, Rentabilité, Paramètres
Files : `src/views/gerant/{TeamScreen,FleetScreen,ProfitScreen,SettingsScreen}.tsx`.
- Flotte : alerte à 30 jours (entretien/CT). Rentabilité : 3 graphiques recharts + dossiers à marge faible avec
  explication. Paramètres : champs numériques bornés, recalcul immédiat partout.
- Captures ; commit.

### Lot 7 : vérification et polish
- Crawler : nouvelles routes, échantillonnage `data-crawl-sample`, test drag-drop ; parcours étendu ; tests Review
  Focus 1–5 ; NL 1280 px sans débordement sur les nouveaux écrans.
- Polish impeccable / break-ui ; captures FR + NL demandées ; revue de code ; commit.
