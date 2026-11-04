# Étape 1 : le socle de RySe Moving

Lis d'abord `CLAUDE.md` en entier : c'est le brief permanent du projet, il s'applique à toute cette étape.

## Objectif de l'étape

Poser les fondations sur lesquelles toutes les vues seront construites ensuite : le projet, la charte, la navigation
entre les 6 vues, les langues et des données fictives réalistes. **Les écrans métier détaillés ne sont pas dans cette
étape** : chaque vue affiche pour l'instant un écran d'accueil soigné qui prouve que la structure fonctionne.

## Déroulé

1. **Cadrage** : `brainstorming` (3 questions maximum), puis `/impeccable init`.
2. **Plan** : `writing-plans`, découpé en lots. Montre-le-moi et attends mon accord.
3. **Construction** : `executing-plans`, lot par lot, avec une capture Playwright après chaque lot.
4. **Polish et vérification** selon `CLAUDE.md`.

## Ce que l'étape doit livrer

### 1. Le projet
- Projet Vite + React + TypeScript dans le dossier courant, Tailwind v4, Inter Tight embarquée, `lucide-react`.
- Arborescence claire et commentée en français (où sont les vues, les données, les traductions, les composants).
- Un `README.md` court : lancer la démo, réinitialiser, ajouter un texte FR/NL. Commandes en PowerShell.
- `git init` et un premier commit.

### 2. La charte et les composants de base
- Variables CSS de la charte (voir `CLAUDE.md`) et logo RySe Moving en SVG inline (3 barres montantes).
- Composants réutilisables, pensés pour la simplicité : bouton (dont une **très grande** variante pour le chauffeur),
  carte, badge de statut, alerte avec action, tableau simple, champ, fenêtre modale, onglets, indicateur
  « traitement IA en cours… ».
- Une page interne `#/charte` (non visible dans les menus) qui affiche tous ces composants : elle servira de
  référence pour les étapes suivantes.

### 3. La coque de l'application
- Barre latérale sombre (`--ink`) avec le logo, le menu de la vue en cours (pour l'instant, seulement
  « Accueil » : les autres entrées apparaîtront aux étapes suivantes, une fois fonctionnelles), et en bas le nom et le rôle de l'utilisateur fictif.
- **Sélecteur « Voir en tant que… »** toujours accessible en haut : Gérant, Planificateur, Chauffeur, Commercial,
  Client, Comptabilité. Changement de vue en un clic, sans rechargement. Chaque vue a un utilisateur fictif
  différent (nom, photo d'avatar en initiales).
- **Vue chauffeur** affichée dans un **cadre de téléphone réaliste** centré sur l'écran du PC, avec ses propres
  règles de taille (gros boutons, gros texte). Les vues Client peut aussi utiliser ce cadre si c'est plus parlant :
  propose-le-moi.
- **Sélecteur FR / NL** toujours accessible.
- Bandeau discret et permanent « Démo – données fictives ».
- Menu discret pour le présentateur (icône engrenage) avec **« Réinitialiser la démo »** et la liste des
  raccourcis clavier :
  - `1` à `6` : changer de vue
  - `L` : changer de langue
  - `Ctrl + Maj + R` : réinitialiser la démo (avec confirmation)

### 4. Les langues
- Système de traduction simple, maison (un fichier FR, un fichier NL, mêmes clés), sans bibliothèque si possible.
- Typage TypeScript qui empêche d'oublier une traduction.
- Dates, heures, montants (€) et numéros formatés selon la langue (`fr-BE`, `fr-FR`, `nl-BE`).

### 5. Les données fictives (le cœur de la crédibilité)
Un modèle de données typé et un jeu de données de départ **réaliste**, généré **par rapport à la date du jour**
(la semaine en cours, la précédente et la suivante sont toujours remplies). Il doit contenir au minimum :

- **L'entreprise** : RySe Moving, adresse fictive en Belgique, une agence secondaire fictive dans le nord de la France.
- **Le personnel** : environ 14 personnes (chauffeurs, déménageurs, chef d'équipe, planificateur, commercial,
  comptable), avec compétences (permis C, monte-meubles, emballage, international) et quelques absences (congé,
  maladie, formation).
- **La flotte** : environ 8 véhicules (camions 20 m³ et 40 m³, porteur avec hayon, utilitaire, monte-meubles),
  plaques fictives belges et françaises, entretiens et contrôles techniques à venir.
- **Les clients** : particuliers et entreprises, en Belgique et en France, avec adresses fictives, étage, ascenseur
  ou non, accès, stationnement.
- **Les déménagements** : environ 30 dossiers à tous les stades (demande, visite technique, devis envoyé, devis
  signé, planifié, en cours, terminé, facturé, payé), de types variés : appartement, maison, bureaux, international
  Bruxelles ↔ Paris ou Lille ↔ Liège (avec CMR), garde-meuble, débarras. Volumes en m³, prix, acomptes, coûts
  estimés pour calculer la marge.
- **Quelques situations à montrer en démo** : un conflit de planning (2 équipes sur un même camion), un devis sans
  réponse depuis 6 jours, un déménagement avec un objet signalé abîmé, une facture en retard de paiement, un
  contrôle technique qui arrive à échéance.

Tous les noms et adresses doivent sonner vrais tout en étant fictifs (rues génériques, aucune entreprise réelle).
Les données de départ sont isolées dans un seul dossier, faciles à modifier.

### 6. Les écrans d'accueil provisoires
Pour chaque vue, un accueil simple qui montre déjà le bon esprit, à partir des vraies données fictives :
- **Gérant** : 4 ou 5 informations clés (déménagements du jour, alertes, chiffre d'affaires du mois, actions à faire).
- **Chauffeur** : « Bonjour Karim », la mission du jour en une carte, un très grand bouton « Commencer ma journée ».
- **Les autres vues** : le titre, l'utilisateur, et un aperçu de ce qui arrivera à l'étape concernée.

## Critères de validation (à prouver avant de me rendre la main)

- `npm run dev` lance la démo sans erreur, et `npm run build` passe sans erreur TypeScript.
- La démo fonctionne avec le **réseau coupé** (vérifie qu'aucune requête externe n'est faite).
- Les 6 vues, les 2 langues, les raccourcis et la réinitialisation fonctionnent. Captures Playwright des 6 vues en
  FR et en NL, et du cadre téléphone.
- Le script `npm run check` (voir « Vérification zéro bouton mort » dans `CLAUDE.md`) existe, teste tout ce qui est
  affiché dans les 6 vues en FR et en NL, et il est **entièrement vert**. Montre-moi son rapport.
- Console du navigateur sans erreur ni avertissement.
- Aucun texte en dur hors des fichiers de traduction.

Termine par : un résumé court, les captures, la commande pour lancer la démo, et ce que je dois vérifier moi-même.
