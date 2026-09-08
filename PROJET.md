# Daily Pop Society — site vitrine
> Site statique du bar pop culture de Charleroi : générique façon Marvel Studios formé par les vrais logos mensuels, carte, events, galerie, histoire du nom, contact.

## Stack technique
| Catégorie | Technologie |
|-----------|-------------|
| Framework | Astro 5 (sortie 100 % statique, `site: https://dailypopsociety.be`) |
| Animation | GSAP 3 + ScrollTrigger, import différé (idle/scroll), scrub réservé au desktop (≥ 1024 px) |
| Fontes | Anton, Inter Variable, Caveat, Bangers (`@fontsource`, auto-hébergées, `font-display: swap`) |
| Images | Illustrations : WebP 3 tailles (480/960/1440, sharp) · Logos mensuels : WebP 160/256 px + montage en 2 résolutions, réduite au mobile et HD au-delà de 1024 px (Pillow) |
| Illustrations | Kie.ai `nano-banana-pro`, style cel-shadé sticker (démo, à remplacer par des photos) |
| SEO | `@astrojs/sitemap`, JSON-LD `BarOrPub` + `Event`, Open Graph, canonical |
| Serveur | Hono 4 + `@hono/node-server` (`server/index.mjs`, Node 22) — sert `dist/` avec les en-têtes de l'ancien `nginx.conf` (retiré) et l'API du jeu `GET/POST /api/scores` ; Docker 2 étages, image finale Node ; Coolify maquettes (`*.chris-ia.com`) |
| Mini-jeu | Nakama Run — moteur canvas 2D sans dépendance (`src/lib/jeu/moteur.ts`), borne en calque (`Borne.astro` + `borne.ts`), classement mensuel stocké en JSON (`server/scores.mjs`, aucune base de données) |
| Tests | `pnpm test` = `astro check` && `astro build` && `node scripts/verifier.mjs` sur `dist/` && `node --test` (serveur, dans `server/`) |

## Démarrage rapide
```bash
pnpm install
pnpm dev          # http://localhost:4332 (site Astro)
pnpm dev:api      # http://localhost:4340 (serveur Hono — API du jeu ; le proxy Vite envoie /api dessus)
pnpm build        # dist/
pnpm test         # check + build + contrôle de dist/ + tests du serveur (node --test)
python scripts/logos.py            # regénère les logos + src/data/logos.ts (planches dans brief/, gitignoré)
KIE_API_KEY=... bash scripts/illustrations.sh && node scripts/webp.mjs   # illustrations manquantes (payant : ~0,04 $/image)
KIE_API_KEY=... bash scripts/sprites.sh && python3 scripts/chromakey.py  # sprites du jeu (payant : ~0,04 $/sprite)
PROD=1 pnpm verifier   # contrôle de mise en production (refuse tant que `DEMO` vaut true dans src/data/carte.ts)
```

## Architecture
- `src/data/` — la seule source de contenu : `site.ts` (identité, nav, licence du mois), `horaires.ts` (créneaux + conversion JSON-LD), `carte.ts` (la carte **reprise de l'ancien site** le 2026-09-08, drapeau `DEMO` désormais `false`), `events.ts` (une seule liste d'événements datée, jamais trois listes séparées), `galerie.ts` (thèmes), `logos.ts` (**généré**, ne pas éditer à la main), `histoire.ts` (les trois étapes + le sens du nom)
- `src/lib/` — `illu.ts` (résolution des illustrations et des logos en visuels : src/srcset/alt, une seule implémentation), `jsonld.ts` (schéma `BarOrPub`), `motion.ts` (socle GSAP partagé aux sites vitrines : garde `prefers-reduced-motion`, seuil desktop 1024, chargement différé), `dates.ts` (`moisLisible`, une seule implémentation pour la frise et la galerie), `jeu/` (mini-jeu Nakama Run : `moteur.ts` — moteur canvas 2D sans dépendance, `borne.ts` — ouverture/fermeture de la borne, HUD, envoi du score, classement)
- `src/components/` — `Generique` (hero signature : épinglé et scrubé au scroll sur desktop, intro courte sur mobile, statique sans JS/reduced-motion ; + bouton START et ligne « Top du mois »), `Borne.astro` (calque plein écran du jeu, déplacé dans `<body>` au boot pour rendre le reste `inert`), `TitleCard` (ouverture de page), `Case` (case de comics), `EventCard`, `FriseLogos` (frise horizontale des logos par année, scroll natif), `Horaires`, `Header`, `Footer`, `LienExterne` (lien externe accessible : `noopener noreferrer` + mention lecteur d'écran)
- `src/layouts/Base.astro` — SEO, Open Graph, JSON-LD, boot des reveals
- `src/pages/` — `index`, `la-carte`, `events`, `galerie`, `a-propos`, `contact`, `mentions-legales`, `404` (8 pages, cf. `PAGES` de `scripts/verifier.mjs`)
- `scripts/` — `verifier.mjs` (contrôle `dist/` après build), `logos.py` (découpe les planches de la cliente en vignettes WebP 160/256 px + montage, écrit `src/data/logos.ts`), `illustrations.sh` + `illustrations.txt` (génération Kie), `webp.mjs` (PNG Kie → WebP 3 tailles), `sprites.sh` + `sprites.txt` (génération Kie des 6 sprites du jeu sur fond magenta), `chromakey.py` (détourage HSV des sprites → `public/media/jeu/*.webp` RGBA)
- `public/` — `favicon.svg`, `media/og.png`, `media/logos/`, `media/illu/`, `media/jeu/` (sprites du jeu), `robots.txt`
- `server/` — serveur unique qui remplace nginx : `index.mjs` (Hono, sert `dist/` avec les en-têtes ex-`nginx.conf` + monte l'API, et lance la purge de rétention au démarrage puis toutes les 24 h), `scores.mjs` (validation `validerEnvoi`, `moisCourant`, `moisIlYA`, classe `Stockage` — un fichier JSON par mois, écriture atomique, top 100, `purger(moisLimite)` — et `LimiteurDebit`), `index.test.mjs` + `scores.test.mjs` (tests `node --test`, **hors image** : le Dockerfile ne copie que `index.mjs` et `scores.mjs`), `package.json`/`package-lock.json` (dépendances du serveur seul), `.env.dev` (committé, sans secret : `PORT=4340`, `DATA_DIR=./data`, `DIST_DIR=./dist`)
- `docs/superpowers/` — specs et plans d'implémentation qui ont guidé cette session : le site (17 tâches) et le mini-jeu Nakama Run (5 tâches)
- `brief/` (gitignoré) — moodboard, `info.txt`, planches de logos, PNG sources des illustrations et des sprites (`sprites-src/`)
- Flux : données TS → pages Astro → HTML statique → serveur Hono (`server/`), qui sert `dist/` ET l'API `/api/scores` du jeu (fichier JSON sur le volume `/data`).

### Procédure mensuelle
1. `src/data/site.ts` — `LICENCE_DU_MOIS` (nom, dates, accroche). Tout ce qui est *dérivé* suit : la title card des events, le bandeau de l'accueil, le titre de la carte éphémère.
2. `src/data/events.ts` — les dates ISO de l'event de la licence (`debut`, `fin`, et `periodes` si le mois n'est pas d'un seul tenant), et le passage des events du mois écoulé dans le passé se fait **tout seul** au build.
3. `src/data/carte.ts` — ⚠️ **la carte éphémère est à RÉÉCRIRE à la main** : seul son *titre* est dérivé de `LICENCE_DU_MOIS`. L'`intro` et les `items` de `EPHEMERE` (noms, descriptions, prix) sont du contenu, pas une dérivation — les laisser tels quels, c'est afficher la carte du mois précédent sous le nom du mois en cours.
4. `pnpm test`, puis pousser : le site étant statique, c'est la date de **build** qui fait basculer les events dans le passé. Republier chaque mois est donc obligatoire.
- ℹ️ L'image Open Graph (`public/media/og.png`) est **intemporelle** depuis le 2026-09-08 (« DAILY POP / SOCIETY » seul, sans la title card du mois) : plus rien à regénérer mensuellement.

## Variables d'environnement
| Variable | Description | Requis |
|----------|-------------|--------|
| `KIE_API_KEY` | Génération des illustrations et des sprites (`scripts/illustrations.sh`, `scripts/sprites.sh` uniquement, jamais au build ni au run) | ❌ |
| `PORT` | Port d'écoute du serveur `server/index.mjs` (**8080** dans l'image Docker — le conteneur tourne en non-root, un port < 1024 lui est interdit ; 4340 en dev via `server/.env.dev`) | ❌ (défaut 80) |
| `DATA_DIR` | Dossier des fichiers `scores-AAAA-MM.json` du jeu (`/data` en prod, volume Coolify ; `./data` en dev, gitignoré) | ❌ (défaut `./data`) |
| `DIST_DIR` | Dossier du site compilé servi par le serveur (`/app/dist` dans l'image) | ❌ (défaut `./dist`) |
| `MAQUETTE` | `1` ajoute l'en-tête `X-Robots-Tag: noindex` (site non indexable) — **à retirer à la mise en production** | ❌ |

## Roadmap & Features
| Feature | Statut | Date |
|---------|--------|------|
| Spec et plan validés | ✅ Done | 2026-09-07 |
| Projet Astro scaffoldé (port 4332, sitemap, contrôleur initial) | ✅ Done | 2026-09-07 |
| Socle visuel, header, footer, 404, mentions légales | ✅ Done | 2026-09-08 |
| Logos mensuels (découpe des planches, frise, srcset 256 px) | ✅ Done | 2026-09-08 |
| Le générique (scrub desktop, intro mobile, statique) | ✅ Done | 2026-09-08 |
| Illustrations cel-shadées (11 sujets, Kie) | ✅ Done | 2026-09-08 |
| Pages carte, events, galerie, à propos, contact | ✅ Done | 2026-09-08 |
| SEO, Open Graph, JSON-LD, passe Lighthouse | ✅ Done | 2026-09-08 |
| Image Docker Node (Hono) avec volume de persistance, testée en local | ✅ Done | 2026-09-08 |
| Maquette en ligne (dailypopsociety.chris-ia.com) | ✅ Done | 2026-09-08 |
| Vraie carte (reprise de l'ancien site, à relire par Rachel) | ✅ Done | 2026-09-08 |
| Mini-jeu Nakama Run + classement du mois | ✅ Done | 2026-09-08 |
| Photos, logos HD (cliente) | 📋 Planned | — |
| Mise en production dailypopsociety.be + coupure Netlify/Firebase | 📋 Planned | — |

## Journal des changements
### 2026-09-08
- 🐛 Fix : revue qualité du jeu (commit `dfbf41f`) — boîte de collision du tonneau alignée sur le dessin (14 px de « mort invisible » au-dessus du fût), canvas redessiné au `resize` (écran noir en mobile quand la barre d'adresse s'escamotait), Échap écouté sur `document` (perdu après un clic sur le fond du calque), formulaire de fin rangé sous l'écran en mobile ; pont plus sombre et nuages plus lisibles, pont qui défile même en reduced-motion, HUD « 1 s » dès la première seconde, écran de jeu élargi
- ✨ Ajout : Nakama Run en ligne — moteur canvas, borne, top 3 dans le hero, API des scores (Hono, JSON par mois) ; app Coolify sur 8080
- 🐛 Fix : **rétention des classements tenue pour de vrai** — `moisIlYA()` + `Stockage.purger()` (`server/scores.mjs`) suppriment les `scores-AAAA-MM.json` et leurs `.corrompu` de plus de douze mois, appelés au démarrage puis toutes les 24 h ; les mentions légales sont réécrites en conséquence (rien d'autre qu'un pseudo, un score et une date, aucune adresse ; douze mois de conservation) et ne prétendent plus « aucun formulaire »
- 🔒 Sécurité : image Docker **non-root** (`USER node`, uid 1000) sur le **port 8080** (< 1024 interdit à un non-root ; `ports_exposes` et labels Traefik corrigés sur l'app Coolify le jour même), `chown -R node:node /app /data` avant le `VOLUME`, `HEALTHCHECK` sur `/health`, et fichiers de tests exclus de l'image
- ♻️ Refactor : image Docker Node (`node:22-alpine`, 2 étages) à la place de nginx — le serveur Hono sert `dist/` avec les en-têtes de l'ancien `nginx.conf` (supprimé) et porte l'API du jeu ; volume `/data` pour la persistance des scores ; testée en local : tous les codes HTTP attendus, en-têtes corrects, un score écrit survit à un redémarrage du conteneur sur le même volume
- ✨ Ajout : serveur Hono (`server/`) — sert le site statique + expose `GET/POST /api/scores` (fichier JSON par mois, écriture atomique, top 100, limiteur de débit) ; 7 tests unitaires `node --test`
- 📝 Doc : mentions légales complétées pour le mini-jeu (pseudo, score, date, remise à zéro mensuelle) ; spec du site (§3) renvoie vers la spec du jeu pour le mini-jeu (sorti des exclusions)
- ✨ Ajout : vraie carte transcrite depuis l'ancien site, `DEMO` désactivé — 8 catégories, 70 items, tous les prix repris de `brief/site-actuel/` (cocktails signature, cocktails sans alcool, bubble tea & softs, bières, boissons chaudes, starters, burgers, desserts) ; `desc` devenu facultatif (l'ancien site ne décrit ni le Seven Up ni le thé) ; image Open Graph regénérée sans la capsule du header
- 🐛 Fix : dernière passe — `sizes` des bandes du générique aligné sur son `clamp` (la 256 ne part plus sur mobile), montage HD servi au desktop dense (deux fichiers, un seul téléchargé), events passés sans faux visuels (cartes de texte seul), garde de cohérence sur la licence du mois, JSON-LD `Event` en deux périodes réelles, image Open Graph intemporelle, maquette `noindex` côté nginx, alignements et titres de section
- ✨ Ajout : contrôle du `canonical` et des liens internes dans `scripts/verifier.mjs`
- ✨ Ajout : socle visuel (tokens, layout SEO/JSON-LD, header capsule, footer, horaires, page 404)
- 🐛 Fix : menu mobile refermable, horaires robustes, focus et contrastes, JSON-LD extrait dans `lib/jsonld.ts`, contrôleur renforcé
- ✨ Ajout : 28 logos mensuels découpés des planches de la cliente (`scripts/logos.py`, Pillow) en WebP 160 px + montage pour le remplissage des lettres du générique ; `src/data/logos.ts` généré
- ✨ Ajout : composants `TitleCard` et `Case`, page mentions légales
- ✨ Ajout : le générique — hero épinglé scrubé au scroll (desktop), intro courte (mobile), état final statique (reduced-motion / sans JS)
- 🐛 Fix : skip-link sur surfaces sombres, mentions légales complétées, `Case` accessible et paramétrable, contrôleur h1 et créneaux JSON-LD
- ✨ Ajout : 11 illustrations cel-shadées (Kie.ai `nano-banana-pro`) en WebP 3 tailles ; coût ≈ 0,52 $ (13 générations à 0,04 $, dont 2 régénérations)
- 🐛 Fix : cocktail Zoro (vert) et bubble tea mangue régénérés (la couleur du sujet ne correspondait pas au prompt)
- 🐛 Fix : générique — carte non focusable avant apparition, bandes pleines sur écran large, garde-fou GSAP, masque des logos, surfaces sombres
- 🐛 Fix : générique — course des bandes et du remplissage recalculées au redimensionnement
- ✨ Ajout : page accueil (trois cases, licence du mois, horaires et adresse, scène post-générique)
- ✨ Ajout : page la carte (données de démo, carte éphémère du mois, sept catégories)
- ✨ Ajout : page events (licences à venir, soirées récurrentes, précédemment dans Daily Pop)
- ✨ Ajout : page galerie par thèmes avec filtre progressif
- 🐛 Fix : polissage accueil et carte (letterbox, liens externes, illustration partagée, carte autosuffisante avec garde `DEMO`, points de conduite mobile)
- 🐛 Fix : events ramenés sur une seule liste datée avec JSON-LD `Event` ; cartes d'event et galerie corrigées (visuels, srcset, alt partagés, logos dérivés)
- ✨ Ajout : page à propos (histoire en trois temps, pourquoi le nom, frise des logos, l'Hokage)
- ♻️ Refactor : image Docker nginx statique avec 404 réelle
- ✨ Ajout : page contact (adresse, horaires, coordonnées, réservation JDR)
- 🐛 Fix : nginx — un seul `Cache-Control` par réponse, `no-cache` sur tout le HTML, en-têtes de sécurité ajoutés
- ✨ Ajout : logos servis en 256 px par srcset (écrans à forte densité), image Open Graph, position de lecture du générique conservée au retour sur la page
- ♻️ Refactor : passe Lighthouse — montage des logos réduit (133 Ko → 47 Ko), LCP 4,0 s → 2,6 s
- 📝 Décision : Lighthouse mobile mesuré le 2026-09-08 — accueil perf 95 / a11y 100 / bonnes pratiques 100 / SEO 100 ; la carte 98/100/100/100
- ✨ Ajout : maquette déployée sur dailypopsociety.chris-ia.com (Coolify maquettes, dépôt GitHub public)

### 2026-09-07
- 📝 Décisions : site 100 % statique (pas de quiz/points/admin), français seul, pas de vidéo, direction visuelle « le générique » façon Marvel Studios (intensité I), illustrations générées (pas de fausses photos), stack Astro 5 + GSAP + nginx (gabarit dentalexpert/xenia), port dev 4332, dépôt GitHub public
- ✨ Ajout : spec de design (`docs/superpowers/specs/`) et plan d'implémentation en 17 tâches (`docs/superpowers/plans/`)
- ✨ Ajout : projet Astro 5 scaffoldé (port 4332, sitemap, dev toolbar désactivée), première version du contrôleur `scripts/verifier.mjs`

## Problèmes connus
- Mini-jeu Nakama Run — **volume `/data` non déclaré sur la maquette** : le classement du mois repart à zéro à chaque redéploiement de l'app Coolify `o129qzwy4inm5tsgfrmqrtw7`, car l'API Coolify 4.0 beta 468 n'expose pas les stockages persistants et le volume n'a pas été créé à la main sur la maquette (décision utilisateur : « on le fera à la mise en prod »). À la mise en production, créer le stockage persistant dans l'interface (application → Persistent Storage → nom `dps-scores`, chemin `/data`) — cf. Déploiement.
- Mini-jeu Nakama Run — anti-triche limité aux garde-fous côté serveur (bornes pseudo/score/durée, plafond de score plausible, un envoi/20 s) : un runner exécuté côté client ne peut pas être fiable à 100 %, jugé suffisant pour un bar (hors périmètre de la spec du jeu).
- Mini-jeu Nakama Run — modération des pseudos : aucune interface d'admin ; pour retirer un pseudo, éditer à la main le fichier `scores-AAAA-MM.json` du mois sur le volume `/data` du serveur.
- Mini-jeu Nakama Run — **rétention 12 mois, purge quotidienne** : les mentions légales annonçaient une remise à zéro mensuelle alors que les fichiers des mois passés restaient indéfiniment sur `/data`. Depuis le 2026-09-08, `Stockage.purger()` supprime les `scores-AAAA-MM.json` (et leurs `.corrompu`) de plus de douze mois — appelée au démarrage du serveur puis toutes les 24 h (`setInterval(...).unref()`), avec un `console.log` du nombre de fichiers retirés. Un serveur qui ne redémarre jamais purge donc une fois par jour ; un serveur arrêté ne purge pas (sans conséquence : la purge est idempotente et rattrape au démarrage suivant).
- Carte transcrite depuis l'ancien site (`src/data/carte.ts`, 2026-09-08) : prix et libellés à faire relire par Rachel. Deux points appellent sa réponse — le « Custom ton burger » n'a **aucun prix de base** sur l'ancien site (affiché « à composer »), et la carte éphémère du mois y est absente (les trois créations affichées restent les nôtres, marquées « À CONFIRMER CLIENTE » dans le code).
- Logos mensuels découpés des planches en 160/256 px : suffisants en mouvement (générique, frise), à remplacer par les fichiers HD de la cliente si un usage plus grand est envisagé.
- Photos manquantes (events passés, le lieu) : remplacées par des illustrations et des logos en attendant.
- E-mail public à confirmer : le site affiche `contact@dailypopsociety.be` (adresse du domaine), le brief donne une adresse Hotmail.
- Formulation du sens du nom (`POURQUOI_LE_NOM`, `src/data/histoire.ts`) à valider par la cliente (Rachel) : absente du brief, marquée « À CONFIRMER CLIENTE » dans le code.
- Hébergeur à nommer dans les mentions légales (mention d'attente affichée actuellement).
- Coordonnées GPS et lien Messenger absents de la page contact (Messenger n'est mentionné qu'en texte, sans lien cliquable).
- Réservation du domaine `dailypopsociety.be` à faire côté cliente.
- Dates des soirées d'octobre à décembre à confirmer (Tim Burton, Noël : `aPlanifier: true` dans `src/data/events.ts`).
- Frise des logos arrêtée à mai 2026 : les logos de juin à septembre 2026 sont à fournir par la cliente (planches `brief/site-actuel/timeline-*.jpg`, puis `python scripts/logos.py`).
- Heures des soirées à confirmer : le site annonce le **rythme** (« deux fois par mois, le vendredi », « sur réservation ») et **pas l'heure**. Le brief ne la donne pas, l'ancien site annonce 20h-22h — les heures affichées auparavant (19h, 18h) venaient de nulle part.
- Horaires : le brief et l'ancien site se contredisent (mercredi 13h vs 12h ; vendredi et samedi, fermeture à 22h vs 22h/23h). **Le site reprend le brief** ; à trancher avec la cliente.
- ⚠️ À vérifier avant livraison définitive : certaines figurines visibles dans l'illustration générée « comptoir » pourraient rappeler des personnages sous droits — à signaler à la cliente et à repasser en revue.
- ⚠️ Sécurité de l'ancien site : la base Firebase Realtime Database du site Netlify actuel est lisible et modifiable sans authentification depuis le navigateur (noms, e-mails, points et drapeau admin des clients). Le nouveau site ne stocke aucune donnée client, mais l'ancien doit être coupé et le projet Firebase supprimé ou verrouillé à la mise en production.

## Déploiement
- **Maquette en ligne depuis le 2026-09-08 : https://dailypopsociety.chris-ia.com** — vérifié : 8 pages, `/sitemap-index.xml`, `/robots.txt`, `/media/og.png` en 200 ; `/nimportequoi` en 404 réelle.
- Coolify maquettes `http://46.224.83.139:8000` (⚠️ pas l'instance de production Noveo) : projet `dailypopsociety` (uuid `sx4bmqtu54ejgpf4p2mpxdwg`), application uuid `o129qzwy4inm5tsgfrmqrtw7`, serveur `zw8ck4ckcw08gg00g8wwkkso`, build pack `dockerfile`, branche `main`, **port 8080** (`ports_exposes` passé de 80 à 8080 sur l'app le 2026-09-08 par `PATCH /api/v1/applications/{uuid}` — l'image Docker non-root écoute sur 8080, un port < 1024 lui étant interdit), domaine `https://dailypopsociety.chris-ia.com` (wildcard `*.chris-ia.com`, HTTPS automatique). ⚠️ **Piège vécu le 2026-09-08** : changer `ports_exposes` par l'API ne régénère PAS les labels Traefik de l'app (`custom_labels`, encodés en base64) — le premier déploiement sur 8080 a répondu **502**. Il faut aussi patcher `custom_labels` (`traefik.http.services….loadbalancer.server.port=8080` et `{{upstreams 8080}}`) puis redéployer.
- **Mini-jeu Nakama Run en ligne depuis le 2026-09-08** (déploiement Coolify `hz0nvxvauqcy9cmqfe55fl7o`) : moteur canvas, borne, top 3 dans le hero, API des scores (Hono, JSON par mois) — variable d'environnement `MAQUETTE=1` posée en runtime par l'API Coolify.
- Redéploiement après un push : `git push origin HEAD` puis `curl -s -H "Authorization: Bearer $TOK" "http://46.224.83.139:8000/api/v1/deploy?uuid=o129qzwy4inm5tsgfrmqrtw7"` (GET) — le jeton vit dans `~/.claude.json` → `mcpServers.coolify.env.COOLIFY_ACCESS_TOKEN`, ne jamais l'écrire ici. Suivi : `GET /api/v1/applications/o129qzwy4inm5tsgfrmqrtw7` jusqu'à `status: running…` (le build passe par `exited:unhealthy` pendant ~1 min, c'est normal). Le conteneur écoute sur **8080** et embarque un `HEALTHCHECK` sur `/health`.
- Image Docker Node (2 étages : build `node:22-alpine` + service `node:22-alpine` qui lance `server/index.mjs`) testée en local : 404 réelle, caches (`immutable` sur `/_astro/`, 30 jours sur `/media/`, `no-cache` sur tout le HTML), en-têtes de sécurité de base, `MAQUETTE=1` → `X-Robots-Tag: noindex`.
- **Image non-root sur le port 8080, avec healthcheck** (2026-09-08) : `USER node` (uid 1000) et `chown -R node:node /app /data` **avant** le `VOLUME` (c'est ce propriétaire que Docker recopie dans un volume neuf) ; `ENV PORT=8080` / `EXPOSE 8080` car un port < 1024 est interdit à un utilisateur non privilégié ; `HEALTHCHECK --interval=30s --timeout=3s --start-period=5s CMD wget -qO- http://localhost:8080/health`. Les `*.test.mjs` ne sont plus copiés dans l'image (`COPY server/index.mjs server/scores.mjs`). Vérifié en local : `healthy` en ~4 s, `id -u` = 1000, `GET /health` = `ok`, `POST /api/scores` = 201 avec le fichier écrit par `node` dans `/data`, purge journalisée au démarrage (un `scores-2020-01.json` déposé à la main est retiré au redémarrage suivant, le mois courant est gardé).
- ⚠️ **Volume `/data` NON déclaré sur la maquette** (décision utilisateur : « on le fera à la mise en prod ») — l'API Coolify 4.0 beta 468 n'expose pas les stockages persistants ; à créer à la main dans l'interface (application → Persistent Storage → nom `dps-scores`, chemin `/data`) à la mise en production. Conséquence sur la maquette : le classement du jeu repart à zéro à chaque redéploiement (cf. Problèmes connus).
- Dépôt : GitHub public, `cltconcept/dailypopsociety-website` (même convention que `dentalexpert-website` et `xenia-website`) ; `brief/` (moodboard, images du site actuel, PNG sources) gitignoré et exclu de l'image.
- **Checklist de mise en production** (dans l'ordre) :
  1. Réserver `dailypopsociety.be` et configurer le DNS.
  2. Nommer l'hébergeur dans les mentions légales (`src/pages/mentions-legales.astro`).
  3. ✅ Fait le 2026-09-08 : `DEMO = false` dans `src/data/carte.ts`, la vraie carte est en place — reste à la faire relire par Rachel avant la mise en ligne.
  4. ⚠️ **Retirer la variable d'environnement `MAQUETTE=1`** sur l'app Coolify (elle ajoute `X-Robots-Tag: noindex`, qui empêche l'indexation de la MAQUETTE mais interdirait celle du vrai site).
  5. ⚠️ **Déclarer le volume `/data` à la main dans l'interface Coolify** (application → Persistent Storage → nom `dps-scores`, chemin `/data`) : reporté à dessein depuis la maquette (2026-09-08), sans quoi le classement du jeu repart à zéro à chaque redéploiement.
  6. `PROD=1 pnpm verifier`, puis déployer.
  7. Couper le site Netlify et supprimer ou verrouiller le projet Firebase (cf. Problèmes connus).
