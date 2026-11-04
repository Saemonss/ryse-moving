ta # Étape 2 : vues Gérant et Planificateur

Lis d'abord `CLAUDE.md` (brief permanent), puis regarde rapidement ce que l'étape 1 a mis en place (structure,
composants de `#/charte`, modèle de données, traductions). **Réutilise l'existant** : pas de nouveau composant si un
composant de la charte fait l'affaire.

## Pourquoi cette étape maintenant

Le planning est la colonne vertébrale de la démo : la vue chauffeur (étape 3), les documents (étape 4) et la
rentabilité en dépendent. C'est aussi ce qu'un gérant de déménagement regarde en premier.

## Déroulé

1. Cadrage court (`brainstorming`, 3 questions maximum, seulement si quelque chose bloque).
2. `writing-plans` : plan découpé en lots, montre-le-moi et attends mon accord.
3. `executing-plans`, lot par lot, une capture par lot.
4. Polish et vérification selon `CLAUDE.md`.

## Vue Gérant (complète mais simplifiée au maximum)

Menu (7 entrées maximum) : Accueil, Déménagements, Planning, Équipe, Flotte, Rentabilité, Paramètres.

- **Accueil** : remplace l'accueil provisoire. 4 à 5 blocs seulement : les déménagements du jour (avec leur
  avancement), les alertes avec leur action (« Résoudre », « Relancer », « Voir »), le chiffre d'affaires et la
  marge du mois, les actions à faire. Chaque bloc mène à l'écran détaillé.
- **Déménagements** : liste filtrable (statut, type, pays, date) et recherche. Clic → **fiche dossier** : client,
  adresses de départ et d'arrivée (étage, ascenseur, accès), volume, équipe et camion affectés, prix, acompte, coûts,
  marge, et une **frise du fil rouge** (demande → devis → planifié → en cours → terminé → facturé → payé) qui montre
  où en est le dossier. Les étapes futures de la démo enrichiront cette fiche.
- **Planning** : le même planning que le planificateur, en lecture avec la possibilité d'ouvrir un dossier.
- **Équipe** : personnes, rôles, compétences (permis C, monte-meubles, emballage, international), absences.
- **Flotte** : véhicules, capacité, disponibilité, prochains entretiens et contrôles techniques (alerte à 30 jours).
- **Rentabilité** : marge par déménagement, par type de déménagement et par mois (graphiques `recharts` simples,
  2 ou 3 maximum). Les dossiers à marge faible sont mis en avant, avec leur explication (heures dépassées, distance,
  monte-meubles non facturé…).
- **Paramètres** : coût horaire chargé d'un déménageur, coût au kilomètre par type de véhicule, prix du carburant,
  seuil d'alerte de marge. Modifier un paramètre recalcule immédiatement les marges partout.

## Vue Planificateur

Menu : Planning, Absences, Dossiers à planifier.

- **Planning de la semaine** : une ligne par équipe et par véhicule, une colonne par jour, navigation semaine
  précédente / suivante et un bouton « Aujourd'hui ». Chaque déménagement est un bloc coloré par type, lisible
  d'un coup d'œil (client, ville, volume, horaire).
- **Vue jour** : le détail d'une journée, avec les horaires et les trajets.
- **Affecter un déménagement** : par **glisser-déposer** d'un dossier vers une case du planning, avec toujours une
  alternative au clic (bouton « Affecter » → choix de la date, de l'équipe et du camion) pour la navigation au
  clavier.
- **Détection des conflits**, en direct, avec une explication en une phrase et une action « Résoudre » :
  véhicule ou personne affecté deux fois, personne absente, compétence manquante (monte-meubles, international,
  permis C), volume supérieur à la capacité du camion, contrôle technique dépassé.
- **Absences** : ajout en quelques clics (personne, dates, motif : congé, maladie, formation). Les conflits créés
  apparaissent immédiatement dans le planning.
- **Dossiers à planifier** : les devis signés pas encore planifiés, triés par date souhaitée.
- **Publier le planning** : bouton qui simule l'envoi du planning aux équipes (message de confirmation, liste des
  personnes prévenues et heure d'envoi). Pas de vraie messagerie.

## Ce qui n'est PAS dans cette étape

Pas d'IA (suggestions de planning, résumé du soir : étape IA), pas de vue chauffeur détaillée (étape 3), pas de
documents PDF (étape 4). Aucun bouton menant à ces fonctions ne doit être affiché pour l'instant.

## Cohérence de la démo

- Tout passe par le store existant : une affectation, une absence ou un paramètre modifié se répercute partout
  (accueil gérant, fiche dossier, alertes) et survit au rechargement, jusqu'à « Réinitialiser la démo ».
- Les situations préparées à l'étape 1 (conflit de camion, contrôle technique proche, marge faible) doivent être
  visibles et résolubles en démo.
- Tout en FR et en NL, formats de dates et montants selon la langue.

## Critères de validation

- `npm run build` sans erreur, console propre, aucune requête externe.
- `npm run check` étendu aux nouveaux écrans et **entièrement vert** (rapport à me montrer).
- Ajoute au test de parcours : affecter un dossier par clic, créer une absence qui provoque un conflit, résoudre ce
  conflit, modifier un paramètre et vérifier le recalcul de la marge, puis réinitialiser.
- Captures : accueil gérant, fiche dossier, rentabilité, planning semaine avec un conflit, en FR et en NL.

Termine par un résumé court, les captures et ce que je dois vérifier moi-même.
