# Nakama Run — mini-jeu du hero et classement du mois : spec de design

Date : 2026-09-08 · Statut : validé en deux sections par l'utilisateur (« oui fait tout »). Complète la spec du site (`2026-09-07-site-dailypopsociety-design.md`), dont elle lève l'exclusion « jeu en ligne » du §3.

## 1. Objectif

Donner au hero une couche interactive : une borne d'arcade légère, dans un univers pirates et manga inspiré (sans personnage sous licence), avec un classement des meilleurs scores du mois affiché directement. Le jeu reprend l'esprit du brief (« système de points pour avoir des consommations gratuites ») sans compte client ni admin : Rachel peut offrir une conso au top 3 de chaque mois.

## 2. Décisions

| Décision | Choix | Motif |
|---|---|---|
| Scores | **Partagés, sans base de données** : un fichier JSON par mois sur un volume | Décision utilisateur : « pas de base de donnée, ça doit être le plus simple ». |
| Serveur | **Un seul conteneur Node (Hono)** qui sert `dist/` et deux routes de scores, à la place de nginx | Un conteneur, un fichier, la stack Hono déjà connue. |
| Univers | **Inspiré, avatar du bar** : le chibi de Rachel, tonneaux, boulets, produits du bar, chapeau de paille en clin d'œil | Aucun personnage Toei/Shueisha sur un site commercial. |
| Place | **Dans le hero, après le générique** : bouton START avec la title card, borne en calque plein écran par-dessus la page | Le générique reste la signature ; le calque évite que la barre d'espace fasse défiler la page. |
| Affichage des scores | Top 3 du mois dans le pied du hero dès la fin du générique ; top 10 complet dans la borne | « Affichage des meilleures scores directement ». |
| Sprites | 6 images générées (Kie nano-banana-pro, ≈ 0,24 $) sur fond magenta uni puis détourées par chroma-key Pillow → WebP alpha 256 px | Même style sticker que les illustrations ; détourage gratuit et déterministe. Décor (ciel, mer, pont, nuages, mouettes) dessiné en canvas. |
| Bibliothèque | Aucune : canvas 2D et requestAnimationFrame | Léger, sans dépendance. |

## 3. Le jeu

- **Nom** : Nakama Run. Runner 2D à défilement horizontal, vue de côté, sur le pont d'un navire au large.
- **Commande unique** : saut (barre d'espace, flèche haut, touche W, ou tap/clic sur le canvas). Pas de double saut. Petite tolérance « coyote » de 80 ms après le bord d'un obstacle.
- **Entités** : le joueur (avatar chibi) ; deux obstacles au sol, tous deux à sauter : le tonneau (lent, large) et le boulet de canon (plus rapide, plus petit) ; bonus flottants à deux hauteurs : burger (+10), bubble tea (+20), cocktail (+30).
- **Rythme** : vitesse initiale 320 px/s, +8 px/s par seconde, plafond 760 px/s. Intervalle d'apparition des obstacles de 1,6 s décroissant jusqu'à 0,75 s, avec un jitter. Un bonus toutes les 1,2 à 2,5 s.
- **Score** : distance (1 point par 10 px parcourus) + bonus. Affiché en direct avec la durée. Une collision met fin à la partie (pas de vies).
- **Fin de partie** : écran de score, meilleur score personnel (localStorage), saisie d'un pseudo (2 à 12 caractères, lettres, chiffres, espace, tiret, souligné), envoi, puis classement du mois mis à jour avec le rang obtenu. Le pseudo est mémorisé localement pour la fois suivante.
- **Canvas** : résolution logique 960 × 540, mis à l'échelle au conteneur, DPR géré. Boucle rAF avec dt plafonné à 50 ms. Repli en formes pleines si un sprite ne charge pas.
- **Décor** : ciel en dégradé, nuages, mouettes, mer en bandes, pont de navire en planches ; parallaxe 3 couches (désactivée en reduced-motion).

## 4. La borne (calque)

- Markup dans un composant `Borne.astro` posé sur l'accueil : `<div role="dialog" aria-modal="true" aria-labelledby>` masqué par `hidden`, champ bordeaux et bandes de logos en fond, en-tête (titre, bouton Fermer), zone de jeu (canvas + HUD score/temps + message « Espace ou tap pour sauter »), panneau « Top 10 du mois » (liste ordonnée, pseudo + score, ton rang), formulaire de fin de partie.
- Ouverture : bouton START dans le pied du générique (masqué sans JS, révélé par le script après l'intro). Le calque est en `position: fixed`, verrouille le défilement (`overflow: hidden` + `inert` sur le reste), piège le focus, se ferme par Échap ou le bouton Fermer, rend le focus au bouton START.
- Layout : desktop = canvas à gauche (16:9), classement à droite ; mobile = canvas pleine largeur, classement dessous, tap pour sauter.
- Top 3 dans le hero : sous la title card, une ligne « Top du mois : 1. PSEUDO 1 240 · 2. … · 3. … » chargée après l'intro (`GET /api/scores`), sans rien si le service ne répond pas.
- Accessibilité : le jeu est optionnel ; le canvas porte `role="img"` et un `aria-label` ; le score et l'état de partie sont annoncés dans une zone `aria-live="polite"` ; reduced-motion : jeu jouable, parallaxe et secousses désactivées.

## 5. Les scores

- **API** (même origine que le site) :
  - `GET /api/scores[?mois=AAAA-MM]` → `{ mois, top: [{ pseudo, score, date }], total }` (top 10 ; mois par défaut = mois courant en Europe/Brussels).
  - `POST /api/scores` corps `{ pseudo, score, duree }` → `201 { rang, top, mois }` ; erreurs `400` (payload), `429` (trop fréquent).
  - `GET /health` → `200 ok`.
- **Stockage** : `DATA_DIR` (défaut `./data`, en production `/data` sur un volume Coolify), un fichier `scores-AAAA-MM.json` par mois : `{ "mois": "2026-10", "scores": [{ "pseudo", "score", "duree", "date" }] }` trié par score décroissant, 100 entrées max. Écriture atomique (fichier temporaire puis `rename`), écritures sérialisées par une file de promesses. Remise à zéro mensuelle automatique par le nom de fichier, historique conservé.
- **Garde-fous** : pseudo normalisé (espaces réduits, 2-12 caractères, `^[\p{L}\p{N} _-]+$`), liste courte de mots refusés ; `score` entier ≥ 0 ; `duree` entière entre 3 et 180 s ; plafond `score ≤ 110 × duree + 50` ; un envoi toutes les 20 s par adresse (mémoire, `x-forwarded-for` en tête sinon adresse du socket) ; corps ≤ 1 Ko ; JSON strict.
- **Vie privée** : pseudo, score, durée et date seulement ; aucune adresse conservée. Mentions légales complétées d'une phrase.

## 6. Le serveur

- `server/index.mjs` : Hono + `@hono/node-server`. Routes API, puis statique depuis `dist/` : `/_astro/*` immuable 1 an, `/media/*` 30 jours, HTML `no-cache`, en-têtes de sécurité (nosniff, referrer, frame, permissions) ; `X-Robots-Tag: noindex` si `MAQUETTE=1` ; redirection 301 des chemins sans slash final vers le dossier ; 404 réelle avec `dist/404.html`. Port `PORT` (80 dans l'image).
- `server/scores.mjs` : validation et stockage, fonctions pures testables ; `server/scores.test.mjs` en `node --test`.
- `server/package.json` (hono, @hono/node-server) avec son `package-lock.json` ; `pnpm dev:api` lance le serveur en local sur 4340 avec `DATA_DIR=./data` (gitignoré) ; en dev Astro, le proxy Vite envoie `/api` vers 4340.
- `Dockerfile` : étape build inchangée ; image finale `node:22-alpine`, `server/` + `dist/`, `npm ci --omit=dev` dans `server/`, `CMD node index.mjs`. `nginx.conf` supprimé (ses règles vivent dans le serveur).
- `pnpm test` = `astro check && astro build && node scripts/verifier.mjs && node --test server/`.

## 7. Vérification

- Tests unitaires du serveur : validation (pseudo, bornes, plafond), stockage (tri, plafond 100, mois, écriture atomique), rate-limit.
- Test d'intégration en local : serveur lancé, `POST` valide → 201 et rang, `POST` doublé → 429, `POST` invalide → 400, `GET` → top ; fichier JSON écrit ; 404 réelle ; en-têtes.
- Boucle visuelle browse : générique intact, bouton START visible après l'intro, top 3 dans le pied, borne ouverte (desktop/mobile), partie simulée par `js` (saut programmatique) jusqu'au game over, saisie du pseudo, classement mis à jour.
- Contrôleur : sprites présents, borne dans `dist/index.html`, aucun `/api/` dans le sitemap. Lighthouse relancé sur l'accueil (le calque masqué ne doit rien coûter au LCP).
- Déploiement : volume `/data` déclaré sur l'app Coolify, redéploiement, un score envoyé sur la maquette et retrouvé après un redéploiement (preuve de persistance).

## 8. Hors périmètre

Sons, plusieurs niveaux, comptes, anti-triche fort (un runner en client ne peut pas être fiable à 100 % : les garde-fous suffisent pour un bar), modération manuelle des pseudos (Rachel édite le fichier JSON si besoin).
