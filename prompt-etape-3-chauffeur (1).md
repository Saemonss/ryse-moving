# Étape 3 : la vue Chauffeur (et sa remontée chez le gérant)

Lis d'abord `CLAUDE.md`. Réutilise l'existant (composants, store, traductions). Cette démo sera présentée en rendez-vous
**samedi** : la priorité est un parcours chauffeur impeccable et sans accroc, pas le nombre de fonctions.

## Déroulé

1. Cadrage court si quelque chose bloque (3 questions maximum).
2. `writing-plans` : plan en lots, montre-le-moi et attends mon accord.
3. `executing-plans`, lot par lot, une capture par lot.
4. Polish (`impeccable`, `break-ui` : textes NL longs, gros texte) et vérification selon `CLAUDE.md`.

## Lot 0 : corrections issues de l'étape 2 (à faire en premier)

Ces points « non bloquants » peuvent se produire en direct devant un prospect :
- **Conflits sans solution** : aucun conflit ne doit rester bloqué à l'écran. Si aucune solution automatique
  n'existe (deux chantiers monte-meubles le même jour), propose une action utile : décaler un dossier, louer un
  monte-meubles (ligne de coût ajoutée au dossier), ou affecter un autre jour.
- **Solution qui crée un conflit** : avant de proposer une solution, vérifie qu'elle n'en crée pas un autre. Sinon,
  ne la propose pas.
- **Kilomètres** : quand l'équipe ou l'agence change, recalcule distance, coût et marge du dossier.
- **Compteurs cohérents** : les alertes du gérant et le panneau du planificateur utilisent la même période et
  affichent les mêmes chiffres.

## La journée du chauffeur (dans le cadre de téléphone)

Rappel : une seule action principale par écran, très gros boutons, « Maintenant : … » toujours visible,
progression visible, presque aucune saisie clavier.

1. **Connexion simple** : choisir son nom dans une liste avec photo d'initiales, puis un code à 4 chiffres (pavé
   numérique géant). Pas de mot de passe.
2. **Début de journée** : « Commencer ma journée » → position enregistrée (simulée, avec un message clair sur ce qui
   est enregistré et pourquoi) → **contrôle du véhicule** en 4 taps maximum (kilométrage par photo du compteur,
   carburant, état général oui/non, photo si problème).
3. **Mes missions du jour** : une carte par déménagement, dans l'ordre, avec l'adresse, l'heure, l'étage,
   l'ascenseur, le stationnement, le contact du client (bouton « Appeler », simulé) et les consignes du bureau.
   Bouton « Itinéraire » (simulé : ouvre un aperçu de trajet, pas de vraie carte en ligne).
4. **Déroulé guidé d'une mission**, étape par étape (« Étape 3 sur 7 ») :
   départ → arrivée chez le client → **état des lieux de départ** (photos par pièce, objets fragiles signalés en un
   tap, réserves du client en choix rapides) → chargement (nombre de colis et objets particuliers, cochés) → trajet
   → arrivée à destination → **état des lieux d'arrivée** → **signaler un dégât** si besoin (photo + type de dégât
   en choix rapides + gravité) → **signature du client au doigt** avec son nom → « Mission terminée ».
5. **Frais** : photo d'un ticket (péage, carburant, parking) et montant sur un pavé numérique géant.
6. **Pause** : un bouton pause / reprise ; les heures se calculent toutes seules.
7. **Fin de journée** : récapitulatif simple (heures, kilomètres, missions, frais, incidents), position de fin
   (simulée), « Envoyer ma journée au bureau ».

Les missions internationales suivent le même parcours ; la signature du CMR sera ajoutée à l'étape 4 (n'affiche rien
à ce sujet pour l'instant).

## Photos dans une démo sur PC

Il n'y a pas d'appareil photo : « Prendre une photo » ouvre un petit choix de **photos de démonstration embarquées**
(illustrations locales cohérentes : pièces, meubles, cartons, compteur, ticket, rayure sur un meuble), sans aucune
personne ni marque réelle, plus la possibilité de choisir un vrai fichier sur le PC. Aucune image téléchargée depuis
internet.

## Moment « waouh » : le mode hors ligne

Dans le menu du présentateur, ajoute **« Simuler une perte de réseau »**. La vue chauffeur affiche alors un bandeau
rassurant (« Pas de réseau : tout est gardé sur le téléphone ») et continue de fonctionner ; les actions s'empilent
dans une file d'attente visible (« 3 éléments à envoyer »). Quand le réseau revient, tout part avec une confirmation.
Côté gérant, les informations n'arrivent qu'au retour du réseau.

## Ce que voit le gérant

- **En direct** : l'avancement de chaque mission (étape en cours) sur l'accueil, le planning et la fiche dossier.
- **Journées à contrôler** : un bloc sur l'accueil gérant. Il ouvre la journée envoyée par un chauffeur : heures,
  kilomètres, photos, états des lieux, dégâts signalés, signature, frais. Boutons « Valider » ou « Corriger »
  (modifier une valeur, avec la trace de la correction). Une journée validée met à jour les coûts réels et la marge
  du dossier.
- Un dégât signalé crée une **alerte** chez le gérant, avec les photos et l'action « Ouvrir un dossier litige »
  (une fiche simple : description, photos, statut).

## Préparation de la démo

Le jeu de départ doit permettre de montrer en direct, sans préparation : une journée de chauffeur à commencer
(Karim), une mission déjà en cours chez un autre chauffeur, et une journée déjà envoyée à contrôler, avec un dégât
signalé. Pour passer vite d'une étape à l'autre en rendez-vous, ajoute dans le menu du présentateur
**« Avancer la mission à l'étape suivante »**.

## Critères de validation

- `npm run build` sans erreur, console propre, aucune requête externe.
- `npm run check` étendu et **entièrement vert** (rapport à me montrer).
- Test de parcours : journée complète de Karim (connexion → contrôle véhicule → mission avec dégât et signature →
  frais → fin de journée), contrôle et validation par le gérant, mise à jour de la marge ; puis la même mission avec
  perte de réseau simulée et retour du réseau ; puis réinitialisation.
- Captures FR et NL : écran de connexion, une étape de mission, signature, fin de journée, journée à contrôler
  côté gérant.

Termine par un résumé court, les captures et ce que je dois vérifier moi-même.
