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
| Serveur | nginx alpine (Docker 2 étages, aucune variable d'env au run), Coolify maquettes (`*.chris-ia.com`) |
| Tests | `pnpm test` = `astro check` && `astro build` && `node scripts/verifier.mjs` sur `dist/` |

## Démarrage rapide
```bash
pnpm install
pnpm dev          # http://localhost:4332
pnpm build        # dist/
pnpm test         # check + build + contrôle de dist/
python scripts/logos.py            # regénère les logos + src/data/logos.ts (planches dans brief/, gitignoré)
KIE_API_KEY=... bash scripts/illustrations.sh && node scripts/webp.mjs   # illustrations manquantes (payant : ~0,04 $/image)
PROD=1 pnpm verifier   # contrôle de mise en production (refuse tant que la carte de démo est active)
```

## Architecture
- `src/data/` — la seule source de contenu : `site.ts` (identité, nav, licence du mois), `horaires.ts` (créneaux + conversion JSON-LD), `carte.ts` (carte **DE DÉMONSTRATION**, drapeau `DEMO`), `events.ts` (une seule liste d'événements datée, jamais trois listes séparées), `galerie.ts` (thèmes), `logos.ts` (**généré**, ne pas éditer à la main), `histoire.ts` (les trois étapes + le sens du nom)
- `src/lib/` — `illu.ts` (résolution des illustrations et des logos en visuels : src/srcset/alt, une seule implémentation), `jsonld.ts` (schéma `BarOrPub`), `motion.ts` (socle GSAP partagé aux sites vitrines : garde `prefers-reduced-motion`, seuil desktop 1024, chargement différé), `dates.ts` (`moisLisible`, une seule implémentation pour la frise et la galerie)
- `src/components/` — `Generique` (hero signature : épinglé et scrubé au scroll sur desktop, intro courte sur mobile, statique sans JS/reduced-motion), `TitleCard` (ouverture de page), `Case` (case de comics), `EventCard`, `FriseLogos` (frise horizontale des logos par année, scroll natif), `Horaires`, `Header`, `Footer`, `LienExterne` (lien externe accessible : `noopener noreferrer` + mention lecteur d'écran)
- `src/layouts/Base.astro` — SEO, Open Graph, JSON-LD, boot des reveals
- `src/pages/` — `index`, `la-carte`, `events`, `galerie`, `a-propos`, `contact`, `mentions-legales`, `404` (8 pages, cf. `PAGES` de `scripts/verifier.mjs`)
- `scripts/` — `verifier.mjs` (contrôle `dist/` après build), `logos.py` (découpe les planches de la cliente en vignettes WebP 160/256 px + montage, écrit `src/data/logos.ts`), `illustrations.sh` + `illustrations.txt` (génération Kie), `webp.mjs` (PNG Kie → WebP 3 tailles)
- `public/` — `favicon.svg`, `media/og.png`, `media/logos/`, `media/illu/`, `robots.txt`
- `nginx.conf` — un seul `Cache-Control` par réponse, `immutable` sur `/_astro/`, 30 jours sur `/media/`, `no-cache` sur tout le HTML (`location ~ \.html$`), en-têtes de sécurité (`X-Content-Type-Options`, `Referrer-Policy`, `X-Frame-Options`, `Permissions-Policy`), `X-Robots-Tag: noindex` **tant que le site est une maquette**, 404 réelle sans fallback SPA
- `docs/superpowers/` — spec de design et plan d'implémentation (17 tâches) qui ont guidé cette session
- `brief/` (gitignoré) — moodboard, `info.txt`, planches de logos, PNG sources des illustrations
- Flux : données TS → pages Astro → HTML statique → nginx.

### Procédure mensuelle
1. `src/data/site.ts` — `LICENCE_DU_MOIS` (nom, dates, accroche). Tout ce qui est *dérivé* suit : la title card des events, le bandeau de l'accueil, le titre de la carte éphémère.
2. `src/data/events.ts` — les dates ISO de l'event de la licence (`debut`, `fin`, et `periodes` si le mois n'est pas d'un seul tenant), et le passage des events du mois écoulé dans le passé se fait **tout seul** au build.
3. `src/data/carte.ts` — ⚠️ **la carte éphémère est à RÉÉCRIRE à la main** : seul son *titre* est dérivé de `LICENCE_DU_MOIS`. L'`intro` et les `items` de `EPHEMERE` (noms, descriptions, prix) sont du contenu, pas une dérivation — les laisser tels quels, c'est afficher la carte du mois précédent sous le nom du mois en cours.
4. `pnpm test`, puis pousser : le site étant statique, c'est la date de **build** qui fait basculer les events dans le passé. Republier chaque mois est donc obligatoire.
- ℹ️ L'image Open Graph (`public/media/og.png`) est **intemporelle** depuis le 2026-09-08 (« DAILY POP / SOCIETY » seul, sans la title card du mois) : plus rien à regénérer mensuellement.

## Variables d'environnement
| Variable | Description | Requis |
|----------|-------------|--------|
| `KIE_API_KEY` | Génération des illustrations (`scripts/illustrations.sh` uniquement, jamais au build ni au run) | ❌ |

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
| Image Docker nginx testée en local | ✅ Done | 2026-09-08 |
| Maquette en ligne (dailypopsociety.chris-ia.com) | ✅ Done | 2026-09-08 |
| Vraie carte, photos, logos HD (cliente) | 📋 Planned | — |
| Mise en production dailypopsociety.be + coupure Netlify/Firebase | 📋 Planned | — |

## Journal des changements
### 2026-09-08
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
- Carte de démonstration (`DEMO = true` dans `src/data/carte.ts`) : noms, descriptions et prix fictifs. Le garde `PROD=1` de `scripts/verifier.mjs` refuse la mise en production tant qu'elle reste active.
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
- Coolify maquettes `http://46.224.83.139:8000` (⚠️ pas l'instance de production Noveo) : projet `dailypopsociety` (uuid `sx4bmqtu54ejgpf4p2mpxdwg`), application uuid `o129qzwy4inm5tsgfrmqrtw7`, serveur `zw8ck4ckcw08gg00g8wwkkso`, build pack `dockerfile`, branche `main`, port 80, domaine `https://dailypopsociety.chris-ia.com` (wildcard `*.chris-ia.com`, HTTPS automatique).
- Redéploiement après un push : `git push origin HEAD` puis `curl -s -H "Authorization: Bearer $TOK" "http://46.224.83.139:8000/api/v1/deploy?uuid=o129qzwy4inm5tsgfrmqrtw7"` (GET) — le jeton vit dans `~/.claude.json` → `mcpServers.coolify.env.COOLIFY_ACCESS_TOKEN`, ne jamais l'écrire ici. Suivi : `GET /api/v1/applications/o129qzwy4inm5tsgfrmqrtw7` jusqu'à `status: running…` (le build passe par `exited:unhealthy` pendant ~1 min, c'est normal).
- Image Docker nginx (2 étages : build Node 22 + service nginx alpine) testée en local : 404 réelle, caches (`immutable` sur `/_astro/`, 30 jours sur `/media/`, `no-cache` sur tout le HTML), en-têtes de sécurité de base.
- Dépôt : GitHub public, `cltconcept/dailypopsociety-website` (même convention que `dentalexpert-website` et `xenia-website`) ; `brief/` (moodboard, images du site actuel, PNG sources) gitignoré et exclu de l'image.
- **Checklist de mise en production** (dans l'ordre) :
  1. Réserver `dailypopsociety.be` et configurer le DNS.
  2. Nommer l'hébergeur dans les mentions légales (`src/pages/mentions-legales.astro`).
  3. Passer `DEMO = false` dans `src/data/carte.ts` avec la vraie carte — le contrôleur refuse la mise en production sinon (`PROD=1 pnpm verifier`).
  4. ⚠️ **Retirer les `add_header X-Robots-Tag "noindex" always;` de `nginx.conf`** (le bloc `server` + les trois `location`) : ils empêchent l'indexation de la MAQUETTE, ils interdiraient celle du vrai site. Chaque ligne porte le commentaire « MAQUETTE : à retirer en production ».
  5. `PROD=1 pnpm verifier`, puis déployer.
  6. Couper le site Netlify et supprimer ou verrouiller le projet Firebase (cf. Problèmes connus).
