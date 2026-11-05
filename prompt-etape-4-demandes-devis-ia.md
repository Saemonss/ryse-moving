# Étape 4 : demandes, devis et agents IA (simulés)

Lis d'abord `CLAUDE.md`. Réutilise l'existant (composants, store, traductions, photos de démonstration, menu du
présentateur). Rappel : **l'IA est 100 % simulée**, aucun appel réseau.

## Contexte commercial (à respecter dans les écrans)

Cette étape rend montrable l'argument IA le plus fort : **l'agent d'accueil omnicanal**. Chez un déménageur, le temps
de bureau part dans la prise de demande, le devis et la coordination, pas dans le déménagement lui-même ; la première
réponse gagne souvent le client.

Règle d'or affichée partout : **l'agent prépare, l'humain valide ce qui engage l'entreprise** (prix, envoi du devis,
remise, réponse à un litige). Chaque action de l'IA montre ce qu'elle a fait et attend une validation visible.

La démo est présentée **samedi**. Les lots sont classés par priorité : les lots 1 à 4 sont indispensables, les lots 5
à 7 se font seulement si les précédents sont terminés et `npm run check` est vert. Ne commence jamais un lot en
laissant le précédent instable.

## Déroulé

1. Cadrage court si quelque chose bloque (3 questions maximum).
2. `writing-plans` : plan en lots dans l'ordre ci-dessous, montre-le-moi et attends mon accord.
3. `executing-plans`, lot par lot, une capture par lot, commit après chaque lot validé.
4. Polish et vérification selon `CLAUDE.md`.

## Lot 1 : la vue Commercial et la boîte de réception unifiée

Menu : Demandes, Devis, Relances, Agents IA.

- **Demandes** : une seule boîte de réception pour 5 canaux, chacun avec son icône : formulaire du site, appel
  téléphonique (transcription), message vocal (transcription), e-mail, WhatsApp, plateforme de mise en relation.
  Chaque demande montre le message d'origine (fictif, réaliste, en FR ou en NL) et un compteur « reçue il y a… ».
- Indicateur clé en haut : « Demandes sans réponse depuis plus de 24 h » (doit être à 0 grâce à l'agent, sauf une
  demande atypique volontairement laissée à l'humain).
- Jeu de départ : une dizaine de demandes à différents stades, dont une demande atypique (piano ou coffre-fort) que
  l'agent signale à l'humain au lieu de la traiter seul.

## Lot 2 : l'agent d'accueil omnicanal (le moment « waouh »)

- Dans le menu du présentateur : **« Simuler une nouvelle demande »**, avec le choix du canal (site, appel, vocal,
  mail, WhatsApp, plateforme) et de la langue (FR / NL).
- La demande arrive en direct avec une notification. L'agent la traite sous les yeux du prospect, étape par étape,
  avec une courte animation pour chacune (0,8 à 2 s) :
  1. lecture ou transcription du message ;
  2. extraction des informations (adresses de départ et d'arrivée, étages, ascenseur, date souhaitée, volume
     approximatif, objets particuliers), affichées sous forme de fiche avec les champs surlignés dans le message ;
  3. **ce qui manque** est identifié (par exemple l'étage d'arrivée) ;
  4. **dossier créé** automatiquement (visible ensuite dans la fiche dossier du gérant) ;
  5. **réponse au client** rédigée dans la langue du client et sur son canal, qui accuse réception et pose les
     questions manquantes ; elle part avec un indicateur « répondu en 2 min ».
- La réponse simulée du client arrive ensuite (bouton ou délai court) et complète le dossier.

## Lot 3 : estimation du volume par photos

- Depuis un dossier, « Demander des photos au client » simule l'envoi d'un lien. Le client « envoie » des photos de
  ses pièces (photos de démonstration embarquées).
- L'agent produit un **inventaire par pièce** (meubles, cartons estimés) et un **volume en m³**, avec un niveau de
  confiance. Si la confiance est faible, il propose une visite technique au lieu de trancher.
- Le commercial peut corriger chaque ligne de l'inventaire ; **le volume final est validé par l'humain**.

## Lot 4 : le devis préparé par l'IA, validé par l'humain

- **Grille tarifaire** dans Paramètres (gérant) : prix au m³, forfait de déplacement, prix au km, supplément par
  étage sans ascenseur, options (emballage, monte-meubles, garde-meuble au mois, débarras), acompte en %. Valeurs
  fictives mais crédibles, modifiables.
- **Préparer le devis** : l'agent calcule le prix avec la grille, propose les options pertinentes (avec la raison :
  « 4e étage sans ascenseur → monte-meubles conseillé ») et rédige un devis personnalisé. Chaque ligne est
  modifiable par le commercial, le total et la marge prévue se recalculent en direct.
- **Valider et envoyer** : action humaine obligatoire. Génère un **PDF de devis** aux couleurs de RySe Moving
  (`pdf-lib`, police embarquée), en FR ou en NL selon le client, avec la mention « Document de démonstration ».
- **Signature du devis** : dans la vue Client (cadre téléphone), le client voit son devis et le signe au doigt.
  Le dossier passe automatiquement à « devis signé » et apparaît dans les **dossiers à planifier** du planificateur.
  C'est la boucle complète : demande → devis → planning sans aucune ressaisie.

**Point d'arrêt** : à la fin du lot 4, montre-moi le rapport de `npm run check` et attends mon accord avant le lot 5.

## Lot 5 : relances et litiges préparés par l'IA

- **Relances** : liste des devis sans réponse, avec le moment conseillé pour relancer. L'agent rédige la relance
  (ton adapté, canal du client) ; le commercial valide l'envoi. Les remises ne sont jamais proposées par l'IA.
- **Litige** : sur un dossier litige existant (dégât signalé par le chauffeur), « Préparer avec l'IA » rassemble les
  photos avant / après et la signature, résume le cas, rédige une proposition de réponse au client et un brouillon
  de dossier assurance. La décision reste au gérant.

## Lot 6 : résumé du soir du gérant et page Agents IA

- **Résumé du soir** sur l'accueil gérant (bouton, ou automatique après 17 h) : ce qui s'est passé aujourd'hui, ce
  qui coince demain, dossiers à marge faible, demandes en attente. Court, en phrases simples, chaque point cliquable.
- **Page Agents IA** (vue Commercial et vue Gérant) : la liste des agents de la démo, chacun avec ce qu'il fait,
  ce sur quoi il serait branché chez le client (site, boîte mail, téléphonie, WhatsApp, logiciel existant), ce que
  l'humain garde, et un interrupteur actif / inactif qui change réellement le comportement de la démo. Mention claire
  « Simulé pour la démo ».

## Lot 7 : calculateur de gain (closing)

- Écran accessible depuis le menu du présentateur et la page Agents IA.
- Le prospect saisit **ses** chiffres : demandes par semaine, devis par semaine, dossiers par mois, heures de bureau,
  coût horaire. Hypothèses visibles et modifiables : minutes économisées par tâche automatisée.
- Calcul affiché en clair : temps gagné par semaine = tâches automatisées × minutes économisées ; valeur = ce temps ×
  coût horaire. Résultat par semaine, par mois et par an, avec le détail par agent activé.
- Libellé obligatoire : « Estimation basée sur vos chiffres et nos hypothèses, à affiner ensemble ». Aucun chiffre
  présenté comme un résultat constaté chez un client.

## Ce qui n'est PAS dans cette étape

Assistant planning, dictée vocale du chauffeur, facturation et relance des impayés, avis clients, portail client
complet (suivi du déménagement) : ils viendront plus tard. Aucun bouton menant à ces fonctions ne doit apparaître.

## Critères de validation

- `npm run build` sans erreur, console propre, aucune requête externe.
- `npm run check` étendu et **entièrement vert** (rapport à me montrer à chaque point d'arrêt).
- Test de parcours : nouvelle demande simulée par WhatsApp en NL → traitement par l'agent → réponse du client →
  photos → volume validé → devis préparé, modifié, validé, PDF généré → signature dans la vue Client → dossier
  visible dans « Dossiers à planifier » → réinitialisation.
- Captures FR et NL : boîte de réception, traitement d'une demande par l'agent, inventaire par photos, devis avec
  options, PDF, signature client, calculateur.

Termine par un résumé court, les captures et ce que je dois vérifier moi-même.
