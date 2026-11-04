# Étape 3 : vue Chauffeur et remontée chez le gérant — plan

> superpowers:executing-plans (CLAUDE.md). Lot par lot, capture par lot, commit par lot. Démo samedi : la priorité
> est un parcours chauffeur sans accroc.

**Spec :** `prompt-etape-3-chauffeur (1).md` + décisions ci-dessous (pas de spec séparée : le brief est précis).
**Vérification :** `npm run check` à **3 navigateurs** (6 saturent la mémoire du PC).

## Décisions
- PIN de démo `1234` (rappel discret sous le pavé). Photos : 8 illustrations SVG locales + fichier du PC réduit
  à ~320 px (JPEG) avant stockage.
- Mission en 7 étapes : départ · arrivée client · état des lieux départ · chargement · trajet/arrivée destination ·
  état des lieux arrivée (+ « Signaler un dégât ») · signature → « Mission terminée ».
- Synchronisation : `phone` (journée côté téléphone) et `office` (copie vue par le bureau). En ligne, chaque action
  synchronise aussitôt ; hors ligne, elle s'ajoute à la file (`queue`) ; au retour du réseau, `office ← phone` +
  confirmation. Le gérant lit uniquement `office`.
- Jeu de départ : Karim (journée à commencer, m-15), Didier (m-14 en cours, étape Chargement), Youssef (journée
  d'il y a 3 jours envoyée avec un dégât « miroir rayé », m-11). Le dégât commode de l'étape 1 est remplacé.
- Dégât → alerte « Ouvrir un dossier litige » → fiche litige (description, photos, statut ouvert/en cours/clos).
- Journée validée → `actualHours` (durée réelle des missions) et frais ajoutés aux coûts du dossier → marge recalculée.
- Menu présentateur : « Simuler une perte de réseau » / « Rétablir le réseau », « Avancer la mission à l'étape
  suivante » (mission en cours de Karim, sinon de Didier).

## Review Focus
1. Double clic rapide sur « Étape suivante » / « Valider » → jamais deux étapes sautées.
2. Hors ligne puis réinitialisation → file vidée, réseau rétabli, rien de bloqué.
3. Signature vide → bouton de validation inactif avec explication (« Signez dans le cadre »), jamais une signature vide.
4. Photo de fichier très lourde → réduite, aucune erreur de stockage.
5. Textes NL longs et gros texte (zoom 200 %) dans le téléphone → rien ne déborde, boutons ≥ 56 px.

---

### Lot 0 : corrections de l'étape 2
- `conflicts.ts` : une solution n'est proposée que si elle ne crée aucun nouveau conflit sur le dossier ; sinon
  alternative : `postpone` (premier jour libre sans conflit, ≤ 14 j) ou `rentLift` (monte-meubles en double →
  location, ligne de coût 18 000 cts ajoutée au dossier). Planificateur : bouton secondaire « Autre jour… ».
- `planning.ts` : affecter recalcule `distanceKm` (dépôt de l'agence de l'équipe) et `plannedHours`.
- Horizon commun `CONFLICT_HORIZON_DAYS = 14` pour alertes gérant et panneau planificateur.
- Tests : conflit monte-meubles double → action proposée ; aucune solution ne crée de conflit ; km recalculés.

### Lot 1 : modèle « journée chauffeur », synchro, menu présentateur
- Types `DriverDay`, `MissionLog`, `Expense`, `Claim`, `Photo` ; store : `phone`/`office`, `online`, `queue`,
  actions (login, startDay, vehicleCheck, pause/resume, mission step, inventory, damage, signature, expense, endDay,
  send, validateDay, correctDay, openClaim, setClaimStatus, setOnline, advanceMission). `SCHEMA_VERSION = 5`.
- Seed : journées Didier (en cours) et Youssef (envoyée + dégât).

### Lot 2 : briques réutilisables (+ #/charte)
- `DemoPhoto` (8 SVG), `PhotoPicker` (choix démo + fichier PC réduit), `Keypad` (géant), `SignaturePad` (doigt/souris),
  `BigChoice` (choix en un tap), `PhoneScreen` (« Maintenant : … », progression, retour, action principale XL).

### Lot 3 : chauffeur — connexion, début de journée, missions, pause, frais
### Lot 4 : chauffeur — mission guidée en 7 étapes (états des lieux, chargement, dégât, signature)
### Lot 5 : chauffeur — fin de journée, envoi ; bandeau hors ligne et file d'attente
### Lot 6 : gérant — avancement en direct (accueil, planning, fiche), Journées à contrôler (Valider / Corriger avec
trace → coûts réels et marge), alerte dégât → dossier litige
### Lot 7 : vérification
- Crawler sur les nouveaux écrans (le téléphone : chaque écran du parcours atteint via l'état), parcours complet
  demandé (journée Karim → contrôle gérant → marge ; même mission hors ligne ; réinitialisation), tests Review Focus,
  NL + zoom, captures FR/NL demandées, revue de code.
