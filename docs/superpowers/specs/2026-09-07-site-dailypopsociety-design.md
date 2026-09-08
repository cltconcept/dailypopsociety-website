# Daily Pop Society — site vitrine : spec de design

Date : 2026-09-07 · Statut : validé section par section avec l'utilisateur, en attente de relecture du document.

## 1. Contexte et objectif

Daily Pop Society est un bar food & drinks dédié à la pop culture, Quai Arthur Rimbaud 9 à Charleroi (6000), ouvert depuis juin 2026, ex-Nakama's Coffee (café manga né en avril 2024, rebaptisé en décembre 2025). Gérante : Rachel, alias l'Hokage. Chaque mois, une licence est mise à l'honneur par une carte éphémère ; events thématiques, blind tests deux fois par mois, soirées JDR sur réservation, mangas, jeux de société et coin gaming (Switch, PS4) à disposition des clients qui consomment. Cosplay friendly.

Prestation vendue : « site internet vitrine Premium ». Objectifs du brief (moodboard du 06/08/2026) : informer, faire venir de nouveaux clients, résoudre le problème « sécurité des données des clients ».

Site actuel : `daily-pop-society.netlify.app`, page unique de 1,3 Mo sur Firebase (comptes clients, points, quiz, admin). Nouveau domaine à réserver : `dailypopsociety.be`.

## 2. Décisions prises

| Décision | Choix | Motif |
|---|---|---|
| Partie dynamique (quiz, points, admin) | **Aucune : site 100 % statique** | Décision utilisateur. Le point « admin points » du brief est écarté, à signaler à la cliente. |
| Langues | **Français seul** | Charleroi francophone, brief muet, triple le copywriting sinon. |
| Carte | **Carte de démo dans un fichier de données**, à remplacer | Le dossier « Menu » annoncé n'a pas été fourni. |
| Direction visuelle | **« Le générique » façon intro Marvel Studios, intensité I (cinématique)** | Choisie parmi 9 propositions vues dans le compagnon visuel. Les vrais logos mensuels du bar jouent les cases de comics. |
| Vidéo | **Aucune** | Décision utilisateur. Tout en HTML/CSS + GSAP. |
| Visuels de la maquette | **Illustrations générées, style cartoon du logo** | Aucune photo fournie. Assumées comme illustrations, jamais de fausses photos. |
| Stack | **Astro 5 statique + GSAP différé + nginx**, gabarit dentalexpert/xenia | Homogénéité des sites vitrines. |
| Port de dev | **4332** | 4330 dentalexpert, 4331 xenia. |
| Maquette | **dailypopsociety.chris-ia.com** via `/deploy-maquette` | Présentation à la cliente sans toucher au domaine final. |

## 3. Périmètre

Inclus : 6 pages (accueil, la carte, events, galerie, à propos, contact) + mentions légales + 404, le générique animé, les illustrations de démo, SEO complet, déploiement de la maquette, PROJET.md / PROJET.html.

Exclus : comptes clients, points, quiz, espace admin, livre d'or, formulaire de contact, réservation en ligne, multilingue, vidéo, blog, intégration Instagram en direct (liens uniquement), reprise des données Firebase. Le mini-jeu Nakama Run est spécifié à part (`2026-09-08-jeu-nakama-run-design.md`).

## 4. Arborescence et contenu

Nav : La carte · Events · Galerie · À propos · Contact. Footer : coordonnées, horaires abrégés, réseaux, mentions légales.

### `/` Accueil
1. **Le générique** (hero épinglé, voir §6) qui se termine sur la title card du mois : « Ce mois-ci · Daily Pop Coven · 21/10 puis 28 → 31 octobre ».
2. **Trois cases de comics** : La carte (cocktails à personnages, burgers signature), Les events (blind test, JDR, licence du mois), Le fandom (mangas, comics, jeux de société, coin gaming Switch/PS4, cosplay bienvenu). Onomatopée par case.
3. **Horaires + adresse**, avec la mention « horaires susceptibles de changer, vérifie sur Instagram ».
4. **Scène post-générique** : teaser de l'histoire du nom, lien vers À propos.

### `/la-carte` La carte
- Title card crème + trame : « Chapitre 1 · La carte ».
- Bloc « carte éphémère du mois » (licence en cours, 3 à 4 créations).
- Catégories, dans cet ordre : cocktails, mocktails, bubble teas, cafés & boissons chaudes, starters, burgers, pâtisseries. Chaque ligne : nom, description courte, prix, pictos (végé, sans alcool) si utile.
- Mention : « Carte de démonstration, à remplacer par la carte réelle ».

### `/events` Events
- Title card noire letterbox : « Ce mois-ci » + licence.
- Agenda à venir (données) : Daily Pop Coven (21/10, 28 → 31/10), Tim Burton (novembre, à planifier), Daily Pop Christmas + closing annuel (décembre, à planifier).
- Soirées récurrentes : blind test pop culture deux fois par mois, soirée JDR (ex. Blood on the Clocktower) sur réservation, animations le week-end.
- **« Précédemment dans Daily Pop »** : events passés avec visuel et une phrase : Jurassic Pop et Spider Day (juillet), Disney nostalgie 90-2000 (12 → 15 août), Séries cultes (2 → 5 septembre).

### `/galerie` Galerie
- Title card blanche, cases de comics.
- Grille par thème (un thème = une licence ou un event), filtre par thème en JS progressif (sans JS : tout affiché). Légende par visuel. Photos uniquement ; les vidéos de la cliente pourront s'y ajouter plus tard.

### `/a-propos` À propos
- Title card bordeaux sombre.
- L'histoire en trois temps : avril 2024 Nakama's Coffee, décembre 2025 le concept s'ouvre à toute la pop culture, juin 2026 installation au centre de Charleroi sous le nom Daily Pop Society. **Le pourquoi du changement de nom** en clair (demande du brief).
- Rachel, alias l'Hokage.
- **Timeline des logos mensuels** interactive : les trois planches (2024, 2025, 2026) rendues en frise horizontale scrollable, un logo par mois avec sa licence.
- Cosplay friendly, safe place, les extras et leur règlement (« visible au shop »).

### `/contact` Contact
- Title card noire.
- Adresse, horaires complets, téléphone (0479 79 72 86), e-mail (à confirmer : contact@dailypopsociety.be ou l'adresse Hotmail du brief), Facebook, Instagram.
- Lien vers l'itinéraire (Google Maps), pas d'iframe.
- « Réservation JDR par téléphone ou Messenger ». Pas de formulaire.

### `/mentions-legales` et `/404`
Mentions légales : nom, TVA BE 1006.306.605, adresse, hébergeur, crédits. 404 en title card : « Cette page n'existe pas dans ce multivers ».

### Horaires (données du brief)
Lundi fermé · Mardi 16h-20h · Mercredi 13h-20h · Jeudi 16h-20h · Vendredi 12h-15h et 18h-22h · Samedi 12h-15h et 18h-22h · Dimanche fermé.

## 5. Système visuel

- **Couleurs** : noir d'encre `#0E0E0E`, bordeaux `#7B1E2B` (champ du générique, ombres des cases), rouge vif `#B4162F` (ponctuation, onomatopées), blanc, crème papier `#F6F1E8`, rose pâle `#E3A1AB` pour les accents sur fond bordeaux/noir.
- **Typographies** : condensée lourde de title card (Anton, via fontsource) pour les titres et les title cards ; grotesque sobre (Inter) pour le texte ; manuscrite (Caveat) réservée aux annotations courtes ; Bangers uniquement pour les onomatopées.
- **Composants** : header capsule, title card (champ de couleur + kicker + titre condensé), case de comics (bord noir 3 px, ombre bordeaux décalée, image, titre, texte, onomatopée optionnelle), letterbox (bandes noires haut/bas des sections cinéma), grille de carte avec points de conduite, agenda, grille galerie, frise des logos, footer.
- **Ambiance par page** (contrainte du brief) : même système, une title card et un champ par page : accueil bordeaux, carte crème + trame de points, events noir letterbox, galerie blanc pur, à propos bordeaux sombre, contact noir.
- **Ton** : tutoiement, entre potes, phrases courtes. Pas de vouvoiement nulle part.
- **Transitions** douces entre sections (règle issue du retour client dentalexpert).

## 6. Le générique

Signature du site, pilotée par le scroll sur desktop (règle des sites vitrines : pin + scrub, rejouable, impossible à rater).

Desktop (≥ 1024 px) :
1. Hero épinglé sur ~250 vh de scroll. État initial : champ bordeaux, « Daily Pop Society présente » en petites capitales espacées, deux bandes obliques de cases (les logos mensuels) immobiles.
2. Temps 1 (0 → 40 %) : les bandes défilent à vitesse croissante, léger flou de mouvement, cases en rotation 3D légère.
3. Temps 2 (40 → 75 %) : « DAILY POP » apparaît rempli par le défilé (background-clip: text sur un montage des logos qui glisse), puis se fige en blanc ; « SOCIETY » se compose en dessous, lettres espacées.
4. Temps 3 (75 → 100 %) : les bandes ralentissent et s'estompent, la title card du mois apparaît, l'indicateur « scroll » disparaît.
5. Après le pin, la section suivante arrive avec une transition douce (feuille qui recouvre).

Mobile et tablette (< 1024 px) : pas de pin. Version courte jouée au chargement (≈ 2,5 s) : défilé rapide, nom qui se fige, title card. GSAP en import différé, chargé seulement si `matchMedia` le permet.

Sans JavaScript ou `prefers-reduced-motion` : hero statique, nom blanc sur bordeaux, bandes immobiles, title card visible. Classe `js-intro` posée avant le premier paint avec timeout de 3 s (garde-fou Xenia).

Matière : la trentaine de logos mensuels découpés dans les trois planches de timeline (vignettes 150 px, suffisantes en mouvement). En HD dès que la cliente fournit les fichiers.

## 7. Images

Une dizaine d'illustrations générées dans le style cel-shadé du personnage du logo (cocktails à personnages, bubble tea, burger signature, starters, pâtisserie, ambiance blind test, table de JDR, coin gaming, façade ou comptoir), pipeline Kie (nano-banana-pro) avec repli Higgsfield, prompts exigeant « illustration cartoon, cel-shading, contours noirs, palette noir/bordeaux/blanc », jamais de photoréalisme. Post-traitement local : recadrage, WebP en 3 tailles. Pièges connus consignés en mémoire (modération erratique, mots interdits).

Logo : JPEG 691 × 707 disponible ; upscale ×2 pour la maquette, source HD demandée à la cliente.

## 8. Données

Dossier `src/data/`, un fichier TypeScript typé par sujet :
- `site.ts` : nom, adresse, téléphone, e-mail, réseaux, TVA, domaine.
- `horaires.ts` : les 7 jours, créneaux multiples, mention de changement.
- `carte.ts` : catégories → items `{nom, description, prix, tags}` + bloc éphémère `{licence, items}`.
- `events.ts` : `{titre, licence, dates, description, visuel, type: 'event' | 'soiree' | 'passe'}`.
- `galerie.ts` : `{theme, visuels: [{src, legende}]}`.
- `logos.ts` : les logos mensuels `{mois, licence, src}` pour le générique et la frise.
- `histoire.ts` : les trois temps de l'à-propos.

Les pages ne contiennent aucune donnée en dur : la mise à jour mensuelle se fait dans ces fichiers.

## 9. Technique

- Astro 5, sortie statique, `site: https://dailypopsociety.be`, `@astrojs/sitemap`, `server.port: 4332`, dev toolbar désactivée.
- GSAP + ScrollTrigger et Lenis en import dynamique, desktop uniquement pour le scrub ; `sort()+refresh()` après chaque pin ; `clearProps` dans les reveals.
- Fonts via `@fontsource` (Anton, Inter, Caveat, Bangers), `font-display: swap`, préchargement des deux principales.
- Images : `astro:assets` ou WebP générés, `loading="lazy"` hors hero, dimensions explicites.
- SEO : title/description par page, Open Graph + image, canonical, sitemap, robots, JSON-LD `BarOrPub` avec adresse, horaires, téléphone, réseaux ; `FAQPage` non requis.
- Accessibilité : skip-link, contrastes AA sur bordeaux/blanc, focus visible, alt sur tous les visuels, onomatopées en `aria-hidden`.
- Performance : objectif Lighthouse ≥ 90 sur les quatre scores en mobile, poids page d'accueil < 1,5 Mo hors fonts.
- Arborescence : `src/layouts/Base.astro`, `src/components/` (Header, Generique, TitleCard, Case, Carte, Agenda, Galerie, FriseLogos, Horaires, Footer), `src/pages/`, `src/data/`, `src/lib/motion.ts`, `src/styles/global.css`, `public/media/`.

## 10. Déploiement

- Dockerfile en deux étapes (build node, service nginx alpine), `nginx.conf` avec `try_files … =404` + `error_page 404 /404.html`, cache long sur `/_astro/`, `no-cache` sur le HTML.
- Dépôt git dédié dans `dailypopsociety/`. `.gitignore` : `node_modules/`, `dist/`, `.astro/`, `.gstack/`, `.superpowers/`, `brief/`. Le moodboard PDF et `info.txt` sont déplacés dans `brief/`, jamais committés, exclus de l'image par `.dockerignore`.
- Maquette : `/deploy-maquette` → `dailypopsociety.chris-ia.com`, vérification réelle des 8 URL en 200 et de la 404.
- Production (plus tard, hors de cette spec) : domaine `dailypopsociety.be`, DNS, et **coupure de l'ancien site Netlify + suppression ou verrouillage du projet Firebase** (voir §12).

## 11. Vérification

- `pnpm build` sans erreur, `pnpm dev` sur 4332.
- Boucle visuelle obligatoire : chaque bloc = build → capture browse → lecture → correction. Captures desktop 1440, tablette 768, mobile 375 pour chaque page.
- Le générique testé aux trois états : scrub desktop, version courte mobile, statique reduced-motion/sans JS.
- Lighthouse mobile sur l'accueil et la carte.
- Contrôle des liens internes et externes, de la 404 réelle et du JSON-LD (validateur schema.org).

## 12. À demander à la cliente, et sécurité de l'ancien site

À demander (non bloquant pour la maquette) : la carte réelle avec prix ; le logo en HD et les logos mensuels en fichiers séparés ; des photos des events passés et du lieu ; la confirmation des horaires de rentrée et de l'e-mail public ; les dates des soirées d'octobre à décembre et le canal de réservation des JDR ; les coordonnées GPS du lieu et le lien Messenger de la page (aucun des deux ne se devine : ils manquent au JSON-LD et au bouton de réservation) ; la raison sociale pour les mentions légales ; le nom et l'adresse de l'hébergeur (à nommer dans les mentions légales, où ils sont aujourd'hui remplacés par une mention d'attente) ; la réservation du domaine.

Sécurité : le site Netlify actuel écrit et lit sa base Firebase Realtime Database directement depuis le navigateur sans jeton, ce qui n'est possible que si les règles de la base sont ouvertes. Conséquence : noms, e-mails, points et drapeau admin de tous les clients sont lisibles et modifiables par n'importe qui. Le nouveau site ne stocke aucune donnée client. À la mise en ligne, l'ancien site doit être coupé et le projet Firebase supprimé (ou ses règles verrouillées). À expliquer à la cliente en termes simples ; c'est une étape de mise en production, pas une tâche du site.

## 13. Hors périmètre, explicitement

Tout ce qui figure dans « Exclus » du §3, plus : rotation d'aucun secret (il n'y en a pas), analytics, cookies (aucun cookie posé, donc pas de bandeau), newsletter.
