# RySe Moving : démo commerciale pour les entreprises de déménagement

Ce fichier est le brief permanent du projet. Relis-le au début de chaque session et respecte-le à chaque étape.

## Ce que c'est

**RySe Moving** est un outil de **démonstration** présenté par RySe Studio (agence d'intégration IA & ERP) lors de
rendez-vous commerciaux avec des entreprises de déménagement en **Belgique et en France**, de l'artisan avec 2 camions
à la société de 20+ camions.

Son seul objectif : qu'un gérant de déménagement se dise en 15 minutes « c'est exactement ce qu'il me faut » et
signe. La démo montre ce que RySe Studio construit : une base RySe Moving, adaptée ensuite à chaque entreprise et
intégrée à ses outils (ERP, comptabilité).

Le présentateur (Ryan) déroule la démo lui-même sur **son PC portable**, en **navigation libre** selon l'intérêt du
prospect. Le prospect ne la manipule pas seul.

## Contraintes absolues

1. **100 % local, aucune connexion réseau.** Aucun CDN, aucune API, aucun backend, aucune police en ligne. Tout est
   embarqué dans le projet (`npm install`). La démo doit fonctionner en Wi-Fi coupé.
2. **Données 100 % fictives.** Noms, adresses, clients, plaques, montants : tout est inventé et clairement fictif.
   Aucune entreprise réelle, aucune donnée réelle. Ne jamais reprendre de nom, de donnée ou de code métier d'un
   autre projet client.
3. **IA 100 % simulée.** Toutes les fonctions « IA » renvoient des résultats préparés à l'avance, avec un court délai
   réaliste (0,8 à 2 s) et une animation de traitement. Jamais d'appel à une API.
4. **Rien d'inventé côté RySe Studio.** Pas de faux clients, témoignages, certifications ou statistiques. Les gains
   affichés par le calculateur sont des **estimations** calculées à partir des chiffres du prospect et d'hypothèses
   visibles et modifiables.
5. **Ne jamais planter en rendez-vous.** Aucun écran vide, aucune erreur visible, aucun bouton mort : tout bouton
   affiché fait quelque chose de crédible. Un bandeau discret « Démo – données fictives » est toujours visible.

## Principe n°1 : la simplicité (le plus important)

La cible a souvent du mal avec la technologie. **Chaque écran doit se comprendre sans explication.**

### Vue chauffeur (le test : un chauffeur réticent réussit sa journée sans aide)
- **Une seule action principale par écran**, en très gros bouton (hauteur ≥ 56 px), avec icône **et** mot.
- Une zone toujours visible : **« Maintenant : … »** (l'étape en cours, en une phrase).
- **Presque aucune saisie clavier** : photo, choix en un tap, oui/non, signature au doigt. Si une saisie est
  inévitable, un seul champ à la fois.
- Texte grand (≥ 17 px), contraste fort, vocabulaire du terrain (pas de jargon informatique).
- Progression visible (étape 3 sur 6) et retour en arrière toujours possible.
- Confirmation claire et rassurante après chaque action (« Photo enregistrée »).

### Vue gérant (complète mais simplifiée au maximum)
- **Divulgation progressive** : l'accueil ne montre que 4 à 5 informations (la journée du jour, les alertes, un
  chiffre clé, les actions à faire). Le détail s'ouvre seulement au clic.
- Les alertes disent quoi faire, pas seulement ce qui ne va pas (« 2 équipes sur le même camion jeudi →
  Résoudre »).
- Pas plus de 7 entrées de menu par vue. Tableaux courts, filtres simples, recherche partout.

### Partout
- Vocabulaire métier du déménagement, compréhensible par un dirigeant de PME.
- Une couleur = un sens, utilisée de façon cohérente (statuts, alertes).
- États vides, chargements et erreurs prévus et soignés.

## Les 6 vues (sélecteur « Voir en tant que… » toujours accessible)

1. **Gérant** : tableau de bord, alertes, rentabilité, résumé du soir.
2. **Planificateur** : planning équipes / camions / absences, conflits, suggestions.
3. **Chauffeur** : journée guidée, affichée dans un **cadre de téléphone** au centre de l'écran du PC.
4. **Commercial** : demandes entrantes, visites techniques, devis, relances.
5. **Client** : portail de suivi, devis à signer, état des lieux.
6. **Comptabilité** : factures, acomptes, export (simulé) vers un ERP / logiciel comptable.

Activités de l'entreprise fictive : déménagements de particuliers, d'entreprises et de bureaux, international
Belgique ↔ France (CMR), garde-meuble, monte-meubles, emballage, débarras.

Fil rouge de la démo : **la vie d'un déménagement, du devis à la facture** (demande → devis → planning → exécution
terrain → documents → facture → marge).

## Identité visuelle (identique au site RySe Studio)

- Nom affiché : **RySe Moving**. Wordmark « RySe » (gras) + « Moving » (light, dégradé violet). Logo : 3 barres
  montantes, refait en SVG inline. Fichiers de référence : `assets/logo-clair.png`, `assets/logo-sombre.png`.
- Police unique : **Inter Tight** (300 à 700), embarquée via `@fontsource-variable/inter-tight`.
- Couleurs (variables CSS) :
  - `--background:#ffffff` `--foreground:#0b1026` `--ink:#0b1026` (panneaux sombres, barre latérale)
  - `--muted:#6b7090` `--subtle:#9aa0bf` `--line:#e4e5ee`
  - `--surface:#f4f3fb` `--surface-2:#e9e6fa`
  - `--accent:#5b3bea` `--accent-from:#6a4dff` `--accent-to:#4427d7`
  - `--accent-soft:#9c85ff` `--accent-pale:#d3ccf7` `--accent-on-dark:#a07cff`
  - Ajoute des couleurs d'état sobres et accessibles (succès, attention, danger, info).
- Pas de clichés « générique IA » : pas de dégradés violets partout, pas d'emojis, pas de cartes toutes identiques.
- Contraste WCAG AA minimum, navigation clavier, `prefers-reduced-motion` respecté.

## Langues

Français (langue source) + néerlandais, avec un sélecteur de langue. Néerlandais standard, vouvoiement (« u »).
Tous les textes passent par le système de traduction, aucun texte en dur dans les composants. Les textes NL seront
relus par un natif : signale-les comme tels dans le fichier de traduction.

## Stack technique (simple et maintenable)

- **Vite + React + TypeScript** (strict). Une seule page, navigation par `#` (hash).
- **Tailwind CSS v4** pour la mise en page, variables CSS pour la charte.
- Icônes : `lucide-react`. Graphiques : `recharts`. PDF : `pdf-lib`.
- État de la démo : un store simple (React context ou Zustand) sauvegardé dans `localStorage`, avec un bouton
  **« Réinitialiser la démo »** qui recharge les données de départ.
- **Les dates des données fictives sont calculées par rapport à la date du jour** : la démo est toujours « à jour »,
  quel que soit le jour du rendez-vous.
- Pas de dépendance inutile. Chaque nouvelle bibliothèque doit être justifiée en une phrase.

## Environnement

Le développeur est sous **Windows**, avec PowerShell et VS Code, et c'est un de ses premiers projets avec Claude
Code. Explique brièvement chaque choix technique en français simple. Toute commande que tu me donnes doit être en
**PowerShell**.

## Skills et MCP à utiliser

Utilise les skills et MCP installés aux étapes indiquées. Au début de chaque étape, annonce en une ligne lesquels tu
utilises. Si une skill est introuvable (vérifie avec `/skills`), dis-le au lieu de l'ignorer.

- **Cadrage** : `brainstorming` (Superpowers), version courte, **3 questions maximum**, seulement sur ce qui bloque.
  `impeccable` : `/impeccable init` au tout début du projet (marque RySe, audience : gérants et chauffeurs de
  déménagement, ton : expert, accessible, très simple).
- **Plan** : `writing-plans` (Superpowers). Montre le plan avant de coder.
  `using-git-worktrees` : **ignore** (projet simple, une seule branche).
  `test-driven-development` : **ignore**, remplacée par la vérification Playwright.
- **Construction** : `executing-plans` (Superpowers), lot par lot, une capture Playwright après chaque lot.
  `design-taste-frontend` actif en permanence (hiérarchie, espacements, typographie).
  `emil-design-eng` comme philosophie d'interface et de mouvement.
  `animate` et `animation-vocabulary` pour les transitions (sobres et rapides : c'est un outil de travail).
  `systematic-debugging` (Superpowers) dès qu'un bug résiste.
- **Polish** (en fin d'étape) : `impeccable` (`/impeccable critique`, `/impeccable audit`, `/impeccable polish`),
  `review-animations` puis `improve-animations`, `animation-performance`, `break-ui` (textes NL longs, petits écrans,
  zoom 200 %, clavier). `find-animation-opportunities` : propose, n'ajoute rien sans mon accord.
- **Vérification** : **MCP Playwright** pour les captures et les tests ; `verification-before-completion` : ne dis
  jamais « c'est fini » sans preuves (captures, console sans erreur) ; `requesting-code-review` avant de me rendre
  la main.

## Vérification « zéro bouton mort » (obligatoire à chaque étape)

La démo est montrée en direct à des prospects : un seul bouton qui ne fait rien suffit à casser la crédibilité.

- Maintiens un script de test Playwright, lancé par `npm run check`, qui pour **chaque vue et chaque langue** :
  1. ouvre chaque écran accessible ;
  2. clique sur **chaque bouton, lien, onglet et entrée de menu visible** ;
  3. vérifie qu'il se passe quelque chose de visible (changement d'écran, fenêtre, message, donnée modifiée) ;
  4. vérifie qu'aucune erreur n'apparaît dans la console et qu'aucune requête réseau externe n'est faite.
- Le script affiche un rapport lisible : ✓ ou ✗ par écran, avec la liste des éléments en échec.
- Ajoute aussi un test « parcours complet » qui joue le fil rouge de bout en bout (demande → devis → planning →
  journée chauffeur → documents → facture), puis réinitialise la démo et vérifie que tout revient à l'état de départ.
- **Une étape n'est terminée que si `npm run check` est entièrement vert.** Montre-moi le rapport.
- Pendant la construction, un élément pas encore développé n'est **jamais affiché** (pas de bouton grisé, pas de
  « bientôt disponible ») : il apparaît seulement quand il fonctionne.

## Économie de tokens (sans baisse de qualité)

L'objectif : dépenser les tokens dans le travail utile (code, vérification), pas dans la lecture inutile ou le
bavardage. Ces règles ne doivent jamais servir d'excuse pour sauter une vérification.

- **Lire juste ce qu'il faut** : cherche d'abord (recherche de fichiers, recherche de texte), puis lis uniquement
  les fichiers ou passages concernés. Ne relis pas un fichier déjà lu et inchangé dans la session.
- **Modifier par petites retouches** : édite les lignes concernées, ne réécris jamais un fichier entier pour un
  petit changement. Ne recopie pas de code dans tes réponses : indique le fichier et ce qui a changé.
- **Générer plutôt qu'écrire en dur** : les données fictives sont produites par de petites fonctions (listes de
  prénoms, rues, types de déménagements combinés de façon déterministe), pas par d'énormes fichiers écrits à la main.
- **Vérifier avec le script, pas à la main** : `npm run check` fait les clics et les contrôles. N'utilise le MCP
  Playwright que pour les captures demandées (une par lot) et pour comprendre un échec précis. Pour inspecter une
  page, préfère l'instantané texte à la capture d'écran quand il suffit.
- **Sorties de commandes courtes** : lance les commandes en mode silencieux quand c'est possible et n'affiche que
  la fin des journaux ou les lignes d'erreur. N'affiche jamais un journal complet.
- **Pas de commandes répétées** : `npm install` seulement si les dépendances changent, pas de build complet après
  chaque micro-retouche (le serveur de développement suffit ; build et `npm run check` en fin de lot).
- **Réponses courtes** : annonces en une ligne, résumés de fin de lot en quelques points. Pas de reformulation de
  ma demande, pas d'explication de ce qui est évident.
- **Pas de travail hors périmètre** : ne commence rien qui n'est pas dans l'étape en cours, même si c'est « rapide ».

## Méthode

- On avance **étape par étape** (une étape = un prompt). Ne commence jamais l'étape suivante sans mon accord.
- À la fin de chaque étape : résumé court de ce qui est fait, captures, commande pour lancer la démo, et les points à
  vérifier par moi.
- Si une demande est ambiguë, pose une seule question ou énonce l'hypothèse retenue.
- Fais un commit Git clair à la fin de chaque lot validé.
