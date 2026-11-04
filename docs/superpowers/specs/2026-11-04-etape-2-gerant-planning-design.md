# Étape 2 : vues Gérant et Planificateur — design

Sources : `CLAUDE.md`, `prompt-etape-2-gerant-planning.md`, spec de l'étape 1. Ce document fixe les décisions.

## Décisions
- Glisser-déposer : API native HTML5 (aucune dépendance). Alternative clavier : bouton « Affecter » → fenêtre
  (date, équipe, camion).
- `recharts` ajouté pour la rentabilité (3 graphiques max : marge par type, marge par mois, marge par dossier).
- Équipes types : `Team { id, name, leaderId, memberIds, defaultVehicleId, agencyId }` (A Didier, B Karim, C Youssef,
  L Jérôme). Un dossier garde `teamIds` (personnes) + `crewId` (équipe type) ; les conflits se calculent par personne.
- Paramètres (`Settings`, dans le store) : coût horaire chargé (3200 cts), coût/km par type de véhicule
  (camion20 38, camion40 52, porteurHayon 45, utilitaire 25, monteMeubles 30 cts), consommation L/100 km par type
  (18, 26, 22, 10, 14), prix carburant (175 cts/L), seuil de marge (25 %).
- Coût d'un dossier = heures (réelles si terminé, sinon prévues) × personnes × coût horaire
  + km × (coût/km + conso × carburant / 100) + matériel (emballage). `costCents` figé de l'étape 1 supprimé.
- Explications de marge faible, déduites des données : heures dépassées (> 15 % au-dessus du prévu), distance
  (> 150 km), monte-meubles utilisé non facturé. 3 dossiers terminés du jeu de départ les illustrent.
- Conflits de planning (`detectConflicts`), en direct : véhicule en double, personne en double, personne absente,
  compétence manquante (monte-meubles, international, permis C), volume > capacité, contrôle technique dépassé.
  Chacun a une phrase et une résolution en un clic (autre camion libre, remplaçant disponible avec la compétence,
  camion assez grand, autre véhicule). Le conflit de camion de l'étape 1 devient l'un d'eux. Les alertes du gérant
  incluent ces conflits.
- Navigation : sous-routes `#/gerant/<ecran>`, `#/gerant/dossier/<id>`, `#/planificateur/<ecran>` ; menu latéral
  de la vue (Gérant 7 entrées, Planificateur 3). Sous-route inconnue → accueil de la vue.
- Le planning (composant partagé) : lignes « équipes » puis « véhicules », 7 colonnes (lun.–dim.), semaine
  précédente/suivante, « Aujourd'hui », bloc par dossier coloré par type (6 teintes réservées aux types, distinctes des
  couleurs d'état), conflit = contour rouge + icône. Vue jour : horaires et trajets (ville → ville, km, durée).
  Gérant : lecture + ouverture de la fiche. Planificateur : glisser-déposer, Affecter, Résoudre.
- Publier le planning : simulation (liste des personnes prévenues + heure), mémorisé dans le store.
- Données sauvegardées : `SCHEMA_VERSION` passe à 3.
- Pas d'IA, pas de vue chauffeur détaillée, pas de PDF : aucun bouton vers ces fonctions.

## Vérification
`npm run check` : routes ajoutées au crawler ; les listes répétitives sont échantillonnées (attribut
`data-crawl-sample`, 3 premiers éléments). Parcours étendu : affecter un dossier au clic, créer une absence qui
crée un conflit, le résoudre, modifier un paramètre et constater le recalcul de la marge, réinitialiser.
Captures FR + NL : accueil gérant, fiche dossier, rentabilité, planning semaine avec conflit.
