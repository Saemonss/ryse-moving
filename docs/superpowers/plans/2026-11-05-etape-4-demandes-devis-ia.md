# Étape 4 : demandes, devis et agents IA (simulés) — plan

> superpowers:executing-plans (CLAUDE.md). Lots 1 à 4 indispensables ; **point d'arrêt après le lot 4** (rapport
> `npm run check` + accord). Lots 5 à 7 seulement si tout est vert. Démo samedi.

**Spec :** `prompt-etape-4-demandes-devis-ia.md`. **Vérification :** `npm run check:rapide` pendant les lots,
`npm run check` complet (3 navigateurs) au point d'arrêt.

## Décisions
- Nouvel objet `Lead` (demande) : canal (`site | appel | vocal | mail | whatsapp | plateforme`), langue, message
  d'origine, reçue le, état (`nouvelle | traitement | attenteClient | dossierCree | atypique`), champs extraits,
  champs manquants, réponse envoyée (+ délai), lien vers le dossier créé. Jeu de départ : 10 demandes, dont 1
  atypique (coffre-fort) signalée à l'humain ; « sans réponse depuis plus de 24 h » = 1 (l'atypique).
- Traitement par l'agent = 5 étapes animées (0,8 à 2 s) : lecture/transcription → extraction (champs surlignés dans
  le message) → manquants → dossier créé (statut « demande ») → réponse rédigée dans la langue et sur le canal du
  client (« répondu en 2 min »). Textes des messages et réponses : modèles FR/NL dans `src/data/leads.ts`.
- « Simuler une nouvelle demande » (menu présentateur) : choix du canal et de la langue → notification → la demande
  s'ouvre et l'agent la traite sous les yeux du prospect. « Simuler la réponse du client » complète le dossier.
- Photos → inventaire : le client « envoie » 3 à 5 photos de démonstration ; l'agent produit des lignes par pièce
  (meuble, quantité, m³) + total + confiance (haute / moyenne / faible → visite technique proposée). Lignes
  modifiables ; « Valider le volume » = action humaine.
- Grille tarifaire (`Settings.pricing`) éditable dans Paramètres ; devis = lignes calculées + options proposées avec
  leur raison ; lignes modifiables, total et marge prévue en direct ; « Valider et envoyer » = action humaine →
  statut « devis envoyé » + PDF (pdf-lib + fontkit, Inter Tight embarquée ; repli police standard si échec,
  signalé).
- Vue Client : le dernier devis envoyé non signé (sinon le portail actuel) → signature au doigt → « devis signé »
  → visible dans « Dossiers à planifier ».
- `SCHEMA_VERSION = 6`. Toute action IA affiche « Préparé par l'IA » et attend une validation visible.

## Review Focus
1. Deux nouvelles demandes simulées coup sur coup → deux traitements indépendants, aucun mélange.
2. Ligne d'inventaire ou de devis vidée / négative / énorme → total borné, jamais NaN.
3. Devis validé deux fois (double clic) → un seul envoi, un seul PDF.
4. Signature côté client puis réinitialisation → tout revient au départ.
5. Textes NL longs (messages, réponses de l'agent, PDF) → rien ne déborde, PDF lisible.

---

### Lot 1 : vue Commercial, boîte de réception unifiée
`src/data/types.ts` (Lead), `src/data/leads.ts` (modèles FR/NL + seed), store, `src/views/commercial/{Inbox,LeadDetail}.tsx`,
menu Commercial (Demandes, Devis), indicateur « sans réponse > 24 h », icône par canal, « reçue il y a… ».
### Lot 2 : l'agent d'accueil omnicanal
Menu présentateur « Simuler une nouvelle demande » (canal + langue), notification, traitement animé en 5 étapes avec
surlignage, dossier créé (visible côté gérant), réponse au client, « Simuler la réponse du client ».
### Lot 2 bis (demandé par Ryan) : SMS + « Demander à l'agent » + rappel guidé
- Canal **SMS** ajouté (icône, modèles FR/NL, simulation).
- **« Demander à l'agent »** (Gérant et Commercial) : pour une demande reçue directement par appel ou SMS, le gérant
  colle le SMS ou tape ses notes d'appel, choisit le canal → l'agent traite la demande avec les mêmes étapes.
- **Demande incomplète** → l'agent ne devine pas : il crée une tâche « Rappeler le prospect » avec le numéro,
  « Appeler » (simulé) et la **liste précise des questions à poser** ; alerte sur l'accueil du gérant
  (« Rappel à faire : Pieter — 2 informations manquantes »).
- Après l'appel, le gérant note les réponses (un champ par question) → **« Renvoyer à l'agent »** → dossier complété
  → **le devis est préparé** → alerte « Devis prêt à valider » → validation humaine obligatoire (lot 4).
### Lot 3 : estimation du volume par photos
« Demander des photos au client » → photos de démo → inventaire par pièce + m³ + confiance → corrections →
« Valider le volume » (humain) ; confiance faible → visite technique proposée.
### Lot 4 : devis préparé par l'IA, validé par l'humain, PDF, signature client
Grille tarifaire (Paramètres), « Préparer le devis » (options + raisons), lignes modifiables, total et marge en direct,
« Valider et envoyer » (humain, anti double clic) → PDF FR/NL « Document de démonstration », vue Client → signature →
« devis signé » → « Dossiers à planifier ». Test de parcours complet (WhatsApp NL → … → planificateur → reset).
**Point d'arrêt : rapport `npm run check` + accord.**
### Lot 5 : relances et litiges préparés par l'IA (si vert)
### Lot 6 : résumé du soir et page Agents IA avec interrupteurs (si vert)
### Lot 7 : calculateur de gain (si vert)
