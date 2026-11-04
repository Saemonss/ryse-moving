# RySe Moving : démo commerciale

Démo 100 % locale (aucune connexion nécessaire) présentée par RySe Studio aux entreprises de déménagement.
Toutes les données sont fictives et calculées à partir de la date du jour.

## Lancer la démo (PowerShell)

```powershell
npm install          # une seule fois (ou après un changement de dépendances)
npm run dev          # puis ouvrir http://localhost:5173
```

Version « rendez-vous » (compilée, plus rapide) :

```powershell
npm run build; npx vite preview --port 4173   # puis ouvrir http://localhost:4173
```

## Pendant le rendez-vous

| Action | Comment |
| --- | --- |
| Changer de vue | Sélecteur en haut, ou touches `1` à `6` |
| Changer de langue | Boutons FR / NL, ou touche `L` |
| Réinitialiser la démo | Engrenage en haut à droite → « Réinitialiser la démo », ou `Ctrl + Maj + R` |
| Page de référence des composants | `http://localhost:5173/#/charte` (dans aucun menu) |

Les actions faites pendant la démo restent enregistrées dans le navigateur. Le lendemain, la démo repart
automatiquement des données de départ du jour.

## Vérifier que tout fonctionne

```powershell
npm run check
```

Compile la démo, puis clique sur **chaque** bouton, lien, onglet et champ de chaque vue, en français et en néerlandais,
contrôle la console et bloque tout accès réseau externe. Il joue aussi le parcours complet suivi d'une réinitialisation.
Le rapport affiche ✓ ou ✗ par écran. Une étape n'est terminée que si tout est vert.

Première fois sur une machine : `npx playwright install chromium` (télécharge le navigateur de test).

## Ajouter ou modifier un texte FR / NL

1. Ajoutez la clé et le texte français dans `src/i18n/fr.ts`.
2. Ajoutez la même clé en néerlandais dans `src/i18n/nl.ts` (sinon `npm run build` refuse de compiler).
3. Dans un composant : `const { t } = useI18n()` puis `t('section.cle')`, ou `t('section.cle', { name: 'Karim' })`
   pour un texte avec `{name}`.

Les textes néerlandais sont à faire relire par un locuteur natif (voir l'en-tête de `nl.ts`).

## Où est quoi

```
src/
  app/        coque : barre du haut, barre latérale, cadre téléphone, raccourcis, navigation (#/vue)
  views/      un dossier par vue (gerant, planificateur, chauffeur, commercial, client, comptabilite)
              + charte/ (page de référence) et shared/ (en-têtes et aperçus communs)
  ui/         composants de base : bouton, carte, badge, alerte, tableau, champ, fenêtre, onglets, IA simulée…
  i18n/       traductions fr.ts / nl.ts et formats (dates, €, téléphones)
  data/       données fictives : types, listes de noms et rues, générateur (seed.ts), alertes (scenarios.ts)
  store/      état de la démo, sauvegarde dans le navigateur, réinitialisation
  styles/     charte : couleurs, police Inter Tight
tests/        npm run check (Playwright)
```

Les données de départ se modifient dans `src/data/seed.ts` (personnel, flotte, et une ligne par dossier dans `PLAN`)
et `src/data/lists.ts` (prénoms, noms, rues, villes).
