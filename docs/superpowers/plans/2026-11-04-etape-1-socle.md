# Étape 1 : socle RySe Moving — plan d'implémentation

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:executing-plans (choisi dans CLAUDE.md). Lot par lot,
> capture Playwright après chaque lot, commit après chaque lot validé.

**Goal :** poser projet, charte, coque à 6 vues, i18n FR/NL, données fictives et `npm run check` vert.
**Architecture :** SPA Vite/React, routeur hash maison, store Zustand persistant, i18n maison typée, générateur de
données déterministe relatif à aujourd'hui.
**Tech Stack :** Vite, React 19, TypeScript strict, Tailwind v4 (`@tailwindcss/vite`), `@fontsource-variable/inter-tight`,
`lucide-react`, `zustand`, `@playwright/test` (dev). recharts/pdf-lib : pas avant l'étape qui les utilise.
**Spec :** `docs/superpowers/specs/2026-11-04-etape-1-socle-design.md`

## Global Constraints
- Aucun accès réseau à l'exécution (pas de CDN, police embarquée).
- Aucun texte visible en dur : tout passe par `t()` ; `nl.ts` typé `Dictionary` (même forme que `fr.ts`).
- Couleurs uniquement via variables CSS de CLAUDE.md + 4 états (`--success`, `--warning`, `--danger`, `--info`, chacun
  avec variante `-soft`), contraste AA.
- Chauffeur/Client : boutons principaux ≥ 56 px, texte ≥ 17 px, icône + mot.
- Pas d'élément non fonctionnel affiché. Pas d'emoji. `prefers-reduced-motion` respecté (transitions ≤ 200 ms).
- Commentaires d'en-tête de fichiers en français.

## Review Focus
1. Données persistées d'un autre jour → réinitialisation automatique (test : injecter un état `seedDay` d'hier).
2. Raccourcis 1–6 / L tapés dans un champ de saisie → ne doivent PAS changer de vue (test sur la page charte).
3. Textes NL plus longs → aucun débordement dans la barre du haut et le cadre téléphone (capture NL).
4. Route hash inconnue (`#/xyz`) → redirige vers Gérant, jamais d'écran vide (test).
5. `localStorage` corrompu (JSON invalide) → démarre sur les données de départ sans erreur console (test).

---

### Lot 1 : projet, charte, i18n de base
**Files :** `package.json`, `vite.config.ts`, `tsconfig*.json`, `index.html`, `src/main.tsx`, `src/styles/theme.css`,
`src/i18n/{fr,nl,index,format}.ts`, `src/ui/Logo.tsx`, `.gitignore`.
**Interfaces (produit) :**
- `type Dictionary` = forme profonde de `fr` (feuilles `string`) ; `type TKey` = chemins pointés de `Dictionary`.
- `useI18n(): { lang: 'fr'|'nl', t(key: TKey, vars?: Record<string,string|number>): string, setLang, toggleLang }`
  (interpolation `{nom}`).
- `format.ts` : `fmtDate(d, lang, style?)`, `fmtTime`, `fmtMoney(cents|euros, lang)`, `fmtNumber`, `fmtPhone` —
  locales `fr-BE` / `nl-BE`.
- `<Logo variant="light"|"dark" />` : 3 barres montantes SVG + wordmark « RySe » 700 / « Moving » 300 dégradé.
- [ ] Scaffold Vite React-TS dans le dossier courant, installer deps, Tailwind v4 via plugin Vite.
- [ ] `theme.css` : tokens CLAUDE.md + états, `@theme` Tailwind mappé, Inter Tight, reduced-motion.
- [ ] i18n + format ; vérif : `npx tsc --noEmit` échoue si une clé manque dans `nl.ts` (essai manuel puis retrait).
- [ ] `npm run build` vert ; capture du logo clair/sombre ; commit « Lot 1 : socle projet, charte, i18n ».

### Lot 2 : composants de base + page `#/charte`
**Files :** `src/ui/{Button,Card,StatusBadge,ActionAlert,SimpleTable,Field,Modal,Tabs,AiProcessing,Toast,Avatar}.tsx`,
`src/views/charte/CharteView.tsx`.
**Interfaces :**
- `Button({variant:'primary'|'secondary'|'ghost'|'danger', size:'sm'|'md'|'lg'|'xl', icon?, children, onClick})` ;
  `xl` = hauteur ≥ 64 px, texte 20 px, pleine largeur.
- `StatusBadge({tone:'success'|'warning'|'danger'|'info'|'neutral'|'accent', children})`.
- `ActionAlert({tone, title, text, actionLabel, onAction})`.
- `SimpleTable<T>({columns:{key,label,render?}[], rows:T[], empty:string})`.
- `Modal({open, onClose, title, children, footer})` : focus piégé, Échap, retour du focus.
- `Tabs({tabs:{id,label}[], value, onChange})` ; `Field({label, ...input})` ; `Avatar({name, tone?})` (initiales).
- `AiProcessing({label})` + hook `useFakeAi<T>(result:T, ms?:number)` → `{run, status, data}` (délai 800–2000 ms).
- `toast(message, tone?)` + `<Toaster/>` (région `aria-live`).
- [ ] Composants ; page charte interactive (chaque démonstrateur fait quelque chose : modale s'ouvre, onglet change,
  IA simulée produit un résultat, toast s'affiche).
- [ ] Test Review Focus 2 sur le champ de la charte (vérifié au Lot 6).
- [ ] Capture `#/charte` ; commit.

### Lot 3 : modèle de données, générateur, store
**Files :** `src/data/{types,lists,random,seed,scenarios}.ts`, `src/store/demoStore.ts`.
**Interfaces :**
- `types.ts` : `Company`, `Agency`, `Staff` (role, skills: `'permisC'|'monteMeubles'|'emballage'|'international'`),
  `Absence` (`'conge'|'maladie'|'formation'`), `Vehicle` (kind, plate, country, nextService, nextInspection),
  `Customer` (kind particulier/entreprise, address, floor, elevator, access, parking), `Move` (status
  `'demande'|'visite'|'devisEnvoye'|'devisSigne'|'planifie'|'enCours'|'termine'|'facture'|'paye'`, type
  `'appartement'|'maison'|'bureaux'|'international'|'gardeMeuble'|'debarras'`, date, from, to, volumeM3, priceCents,
  depositCents, costCents, teamIds, vehicleId, cmr?, damages?, quoteSentAt?, invoiceDueAt?), `Alert` (kind
  `'conflitCamion'|'devisSansReponse'|'objetAbime'|'factureRetard'|'controleTechnique'`, refs, resolved).
- `random.ts` : `mulberry32(seed)` + `pick`, `int`. `seed.ts` : `createSeed(today: Date): DemoData` (déterministe
  pour un jour donné ; semaines −1/0/+1 remplies). `scenarios.ts` : injecte les 5 situations, `deriveAlerts(data)`.
- `demoStore` (Zustand persist, clé `ryse-moving-demo`) : `{data, seedDay, startDriverDay(moveId), resolveAlert(id),
  resetDemo()}` ; `onRehydrate` : `seedDay !== today` ou JSON invalide → `createSeed(today)`.
- Données texte visibles (types, statuts, compétences) traduites via clés i18n, jamais stockées en libellé.
- [ ] Implémenter ; script de contrôle rapide `npx tsx` non requis : vérif par `tsc` + affichage au Lot 5.
- [ ] Commit.

### Lot 4 : coque de l'application
**Files :** `src/app/{App,router,views,TopBar,ViewSwitcher,LangSwitch,PresenterMenu,DemoBanner,Sidebar,PhoneFrame,
useShortcuts}.tsx`.
**Interfaces :**
- `views.ts` : `VIEWS = [{id:'gerant',key:'1',layout:'desktop',user}, … chauffeur/client layout:'phone']`.
- `useRoute(): {view: ViewId|'charte', go(view)}` ; route inconnue → `gerant` (Review Focus 4).
- Raccourcis : `1`–`6`, `L`, `Ctrl+Shift+R` (confirmation via `Modal`) ; ignorés si focus dans input/textarea/select.
- `PresenterMenu` : réinitialiser (confirmation + toast) et liste des raccourcis.
- `PhoneFrame` : cadre neutre ~390×780, barre d'état fictive (heure réelle formatée), contenu scrollable.
- [ ] Implémenter ; captures desktop + cadre téléphone, FR et NL ; commit.

### Lot 5 : accueils provisoires
**Files :** `src/views/{gerant,planificateur,chauffeur,commercial,client,comptabilite}/*Home.tsx`.
- Gérant : 4 blocs (déménagements du jour, CA du mois, alertes avec action, actions à faire). Action d'alerte →
  `Modal` détail + solution en un clic → `resolveAlert` + toast.
- Chauffeur : « Bonjour Karim », zone « Maintenant : … », carte mission, `Button size="xl"` « Commencer ma journée »
  → `startDriverDay` + confirmation ; étape suivante affichée « Maintenant : En route vers … ».
- Planificateur, Commercial, Client, Comptabilité : titre, utilisateur, aperçu chiffré tiré des données (lecture
  seule, aucun bouton).
- [ ] Implémenter ; captures des 6 vues FR + NL ; commit.

### Lot 6 : `npm run check` + README
**Files :** `playwright.config.ts`, `tests/crawl.spec.ts`, `tests/journey.spec.ts`, `tests/robustness.spec.ts`,
`tests/reporter.ts`, `README.md`, scripts `package.json` (`check`: build + playwright avec `webServer` vite preview).
- Crawl : pour chaque vue × langue, lister les éléments interactifs visibles (`button, a, [role=tab],
  [role=menuitem]`), pour chacun : recharger l'état de départ, ouvrir la vue (et l'élément parent si dans un menu),
  cliquer, exiger un changement (hash, DOM `main`/dialog/toast, ou `localStorage`). Inclut `#/charte`.
- Garde-fous globaux : `page.on('console')` erreur/warning → échec ; `context.route('**')` hors localhost → abort +
  échec.
- Journey : résoudre une alerte + commencer la journée → reset → `data` égal au seed du jour.
- Robustness : Review Focus 1, 2, 4, 5 ; raccourcis 1–6, L, Ctrl+Shift+R.
- Reporter : ✓/✗ par écran + éléments en échec.
- [ ] Implémenter ; `npm run check` vert ; README (PowerShell) ; commit.

### Lot 7 : polish et vérification finale
- [ ] `/impeccable critique`, `audit`, `polish` ; `review-animations` ; `break-ui` (NL longs, 200 %, clavier) ;
  détecteur impeccable sur `src/`.
- [ ] Corriger ; `npm run build` + `npm run check` verts ; captures finales 6 vues × FR/NL + cadre téléphone.
- [ ] `requesting-code-review` ; commit final.
