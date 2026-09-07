# Site vitrine Daily Pop Society — plan d'implémentation

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Construire et mettre en maquette le site vitrine statique de Daily Pop Society (bar pop culture, Charleroi), 6 pages + mentions légales + 404, avec un hero « générique » façon intro Marvel Studios formé par les vrais logos mensuels du bar.

**Architecture:** Astro 5 statique (HTML pur), données dans `src/data/*.ts` (une seule source pour pages, footer et JSON-LD), composants par bloc (TitleCard, Case, Generique, FriseLogos…), GSAP + ScrollTrigger en import différé pour le scrub desktop du générique, nginx dans un conteneur Docker pour la maquette. Spec : `docs/superpowers/specs/2026-09-07-site-dailypopsociety-design.md`.

**Tech Stack:** Astro `^5.12` (même majeure que le gabarit xenia, code réutilisé tel quel), `@astrojs/sitemap`, GSAP 3, Lenis (optionnel, non utilisé si pas nécessaire), `@fontsource/anton`, `@fontsource-variable/inter`, `@fontsource/caveat`, `@fontsource/bangers`, `sharp` (WebP), Python 3.13 + Pillow (découpe des logos), Kie.ai `nano-banana-pro` (illustrations), nginx alpine, gstack `browse` pour les captures.

**Environnement vérifié le 2026-09-07 :** Node 24.13, pnpm 11.21, Python 3.13 + Pillow 12.2, Docker 29, `KIE_API_KEY` présente, Chromium Playwright `~/AppData/Local/ms-playwright/chromium-1208`. Le dossier `brief/` (gitignoré) contient `Moodboard - Dayli Pop Society.pdf`, `info.txt` et `site-actuel/` (logo.jpg 691×707, timeline-2024/2025/2026.jpg 1600×1142, HTML du site Netlify sans images).

**Conventions du dépôt :** commits avec `git -C C:/Dev/Noveo/_autres/website/dailypopsociety` (ou depuis le dossier), messages en français, préfixes `feat:`, `chore:`, `docs:`, `fix:`. Chaque commit se termine par :

```
Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_019L79jh7bQLpHnkHyeQ8KLi
```

**Boucle visuelle obligatoire** (règle des sites vitrines) : tout bloc visuel = `pnpm build` → capture `browse` → lecture de la capture avec l'outil Read → correction. Les captures vont dans le scratchpad de session, jamais dans le dépôt. Commandes browse : `B="$HOME/.claude/skills/gstack/browse/dist/browse"`, puis `echo '[["viewport","1440x900"],["goto","http://localhost:4332/"],["wait","--networkidle"],["screenshot","<chemin>.png"]]' | "$B" chain` (toujours un `goto` en tête de chaque séquence : le daemon redémarre souvent). Le serveur de dev tourne en arrière-plan : `pnpm dev` lancé avec `run_in_background: true`, puis vérifié par `curl -s -o /dev/null -w "%{http_code}" http://localhost:4332/`.

---

## Structure des fichiers

| Fichier | Responsabilité |
|---|---|
| `package.json`, `pnpm-workspace.yaml`, `tsconfig.json`, `astro.config.mjs` | Projet Astro, port 4332, sitemap, `site` = `https://dailypopsociety.be` |
| `.dockerignore`, `Dockerfile`, `nginx.conf` | Image statique nginx (copie du gabarit xenia, 404 réelle) |
| `scripts/verifier.mjs` | Contrôle de `dist/` après build : pages attendues, title/description/JSON-LD/h1, `alt` sur toutes les images, médias référencés présents, aucun « TODO/Lorem ». C'est le test qui tourne à chaque tâche. |
| `scripts/logos.py` | Découpe les logos mensuels dans `brief/site-actuel/timeline-*.jpg` → `public/media/logos/*.webp` + montage + génère `src/data/logos.ts` (source unique des coordonnées) |
| `scripts/illustrations.txt`, `scripts/illustrations.sh` | Liste des prompts et boucle Kie `nano-banana-pro` → `brief/illu-src/*.png` |
| `scripts/webp.mjs` | `brief/illu-src/*.png` → `public/media/illu/<nom>-{480,960,1440}.webp` via sharp |
| `public/favicon.svg`, `public/robots.txt`, `public/media/…` | Statiques |
| `src/styles/global.css` | Tokens, reset, typo, title card, case, letterbox, boutons, utilitaires |
| `src/lib/motion.ts` | Gate reduced-motion, seuil desktop 1024, `loadGsap`, `onFirstIdle`, `bootReveals` (repris de xenia) |
| `src/data/site.ts` | Identité, coordonnées, réseaux, nav, licence du mois |
| `src/data/horaires.ts` | Les 7 jours + mention |
| `src/data/carte.ts` | Carte éphémère + catégories (démo) |
| `src/data/events.ts` | À venir, soirées récurrentes, passés |
| `src/data/galerie.ts` | Thèmes et visuels |
| `src/data/logos.ts` | Généré par `scripts/logos.py` |
| `src/data/histoire.ts` | Les étapes de l'à-propos |
| `src/layouts/Base.astro` | Head, SEO, JSON-LD `BarOrPub`, Header/Footer, boot des reveals |
| `src/components/Header.astro` | Capsule noire, burger mobile |
| `src/components/Footer.astro` | Coordonnées, horaires abrégés, réseaux, mentions |
| `src/components/TitleCard.astro` | Ouverture de page : champ de couleur + kicker + titre condensé |
| `src/components/Case.astro` | Case de comics (bord noir, ombre bordeaux, image, onomatopée) |
| `src/components/Generique.astro` | Le hero signature + son script (scrub desktop, intro mobile, statique sinon) |
| `src/components/Horaires.astro` | Tableau des horaires, jour courant surligné |
| `src/components/EventCard.astro` | Carte d'event (à venir, soirée, passé) |
| `src/components/FriseLogos.astro` | Frise horizontale des logos mensuels par année |
| `src/pages/index.astro` … `404.astro` | Les 8 pages |
| `PROJET.md`, `PROJET.html` | Documentation obligatoire |

---

### Task 1 : Initialiser le projet Astro sur le port 4332

**Files:**
- Create: `package.json`, `pnpm-workspace.yaml`, `tsconfig.json`, `astro.config.mjs`, `src/pages/index.astro`, `public/robots.txt`, `scripts/verifier.mjs`
- Modify: `.gitignore` (déjà présent : `node_modules/ dist/ .astro/ .gstack/ .superpowers/ brief/`)

- [ ] **Step 1 : Écrire `package.json`**

```json
{
  "name": "dailypopsociety-website",
  "type": "module",
  "version": "0.1.0",
  "private": true,
  "packageManager": "pnpm@11.21.0",
  "scripts": {
    "dev": "astro dev",
    "build": "astro build",
    "preview": "astro preview",
    "check": "astro check",
    "verifier": "node scripts/verifier.mjs",
    "test": "pnpm build && pnpm verifier"
  },
  "dependencies": {
    "@astrojs/sitemap": "^3.7.3",
    "@fontsource-variable/inter": "^5.2.0",
    "@fontsource/anton": "^5.2.0",
    "@fontsource/bangers": "^5.2.0",
    "@fontsource/caveat": "^5.2.0",
    "astro": "^5.12.0",
    "gsap": "^3.13.0"
  },
  "devDependencies": {
    "@astrojs/check": "^0.9.4",
    "sharp": "^0.35.3",
    "typescript": "^5.6.0"
  }
}
```

- [ ] **Step 2 : Écrire `pnpm-workspace.yaml`, `tsconfig.json`, `astro.config.mjs`**

`pnpm-workspace.yaml` :
```yaml
allowBuilds:
  esbuild: true
  sharp: true
```

`tsconfig.json` :
```json
{
  "extends": "astro/tsconfigs/strict",
  "include": [".astro/types.d.ts", "src/**/*"],
  "exclude": ["dist"]
}
```

`astro.config.mjs` :
```js
// Site 100 % statique : Astro génère du HTML pur, GSAP s'hydrate en <script> natif.
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  integrations: [sitemap()],
  // Domaine à réserver par la cliente (brief) — la maquette chris-ia.com ne doit
  // pas se faire indexer à sa place : canonical et sitemap pointent ici.
  site: 'https://dailypopsociety.be',
  // Port dédié : 4330 dentalexpert, 4331 xenia (cf. mémoire sites-vitrines)
  server: { port: 4332 },
  devToolbar: { enabled: false },
});
```

- [ ] **Step 3 : Écrire une page minimale `src/pages/index.astro` et `public/robots.txt`**

```astro
---
---
<html lang="fr">
  <head><meta charset="utf-8" /><title>Daily Pop Society</title><meta name="description" content="Bar pop culture à Charleroi." /></head>
  <body><h1>Daily Pop Society</h1></body>
</html>
```

`public/robots.txt` :
```
User-agent: *
Allow: /
Sitemap: https://dailypopsociety.be/sitemap-index.xml
```

- [ ] **Step 4 : Écrire le contrôleur `scripts/verifier.mjs` (le test qui tourne à chaque tâche)**

```js
// Contrôle de dist/ après build. Sortie 1 = une attente non satisfaite.
// PAGES est la liste des pages ATTENDUES : on l'étend AVANT de créer une page
// (le contrôle échoue, puis on crée la page, puis il passe).
import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const DIST = 'dist';
export const PAGES = ['index.html', '404.html'];
const erreurs = [];
const ok = (cond, msg) => { if (!cond) erreurs.push(msg); };

for (const p of PAGES) {
  const f = join(DIST, p);
  if (!existsSync(f)) { erreurs.push(`page absente : ${p}`); continue; }
  const html = readFileSync(f, 'utf8');
  ok(/<title>[^<]{10,}<\/title>/.test(html), `${p} : <title> absent ou trop court`);
  ok(/<meta name="description" content="[^"]{40,}"/.test(html), `${p} : description absente ou < 40 caractères`);
  ok(/<h1[\s>]/.test(html), `${p} : pas de <h1>`);
  ok(!/TODO|Lorem ipsum|__[A-Z]+__/.test(html), `${p} : placeholder trouvé (TODO / Lorem / __X__)`);
  for (const m of html.matchAll(/<img\b[^>]*>/g)) ok(/\balt=/.test(m[0]), `${p} : <img> sans alt : ${m[0].slice(0, 80)}`);
  for (const m of html.matchAll(/(?:src|href|content)="(\/media\/[^"]+)"/g)) {
    ok(existsSync(join(DIST, m[1])), `${p} : média manquant ${m[1]}`);
  }
  if (p !== '404.html') ok(html.includes('application/ld+json'), `${p} : JSON-LD absent`);
}
ok(existsSync(join(DIST, 'sitemap-index.xml')), 'sitemap-index.xml absent');
ok(existsSync(join(DIST, 'robots.txt')), 'robots.txt absent');

// Aucun fichier > 600 Ko dans dist/media (les WebP doivent rester légers)
const marcher = (d) => readdirSync(d).flatMap((n) => { const f = join(d, n); return statSync(f).isDirectory() ? marcher(f) : [f]; });
if (existsSync(join(DIST, 'media'))) for (const f of marcher(join(DIST, 'media'))) ok(statSync(f).size < 600 * 1024, `média trop lourd (> 600 Ko) : ${f}`);

if (erreurs.length) { console.error('✗ verifier :\n - ' + erreurs.join('\n - ')); process.exit(1); }
console.log(`✓ verifier : ${PAGES.length} pages contrôlées, aucun écart`);
```

- [ ] **Step 5 : Installer et lancer le contrôle (il doit ÉCHOUER : 404.html, description courte, JSON-LD)**

Run : `cd C:/Dev/Noveo/_autres/website/dailypopsociety && pnpm install && pnpm test`
Expected : `pnpm install` passe ; `verifier` sort en 1 avec `page absente : 404.html`, `index.html : description absente ou < 40 caractères`, `index.html : JSON-LD absent`. C'est le point de départ : la Task 2 fait passer ces trois lignes.

- [ ] **Step 6 : Commit**

```bash
git add package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.json astro.config.mjs src public scripts
git commit -m "chore: projet Astro 5 sur le port 4332, contrôleur de dist"
```

---

### Task 2 : Socle visuel — tokens, layout, header, footer, données de base

**Files:**
- Create: `src/styles/global.css`, `src/lib/motion.ts`, `src/data/site.ts`, `src/data/horaires.ts`, `src/layouts/Base.astro`, `src/components/Header.astro`, `src/components/Footer.astro`, `src/components/Horaires.astro`, `src/pages/404.astro`, `public/favicon.svg`
- Modify: `src/pages/index.astro`

- [ ] **Step 1 : Écrire `src/data/site.ts`**

```ts
/* Données partagées — une seule source pour les pages, le footer et le JSON-LD.
   Tout vient du brief (moodboard du 06/08/2026) et d'info.txt. */

export const IDENTITE = {
  nom: 'Daily Pop Society',
  slogan: 'Food · Drinks · Fandom',
  accroche: 'Le bar pop culture de Charleroi',
  rue: 'Quai Arthur Rimbaud 9',
  codePostal: '6000',
  ville: 'Charleroi',
  telephone: '0479 79 72 86',
  telephoneIntl: '+32479797286',
  // À CONFIRMER CLIENTE : le site actuel affiche contact@dailypopsociety.be,
  // le brief donne une adresse Hotmail. On affiche l'adresse du domaine.
  email: 'contact@dailypopsociety.be',
  tva: 'BE 1006.306.605',
  domaine: 'https://dailypopsociety.be',
  facebook: 'https://www.facebook.com/p/Daily-Pop-Society-By-Nakamas-Coffee-61554198456761/',
  instagram: 'https://www.instagram.com/dailypopsociety',
  itineraire: 'https://www.google.com/maps/dir/?api=1&destination=Quai+Arthur+Rimbaud+9%2C+6000+Charleroi',
  gerante: 'Rachel',
  surnom: "l'Hokage",
};

/* La licence du mois — mise à jour mensuelle, lue par le générique et les events */
export const LICENCE_DU_MOIS = {
  nom: 'Daily Pop Coven',
  dates: '21/10 puis 28 → 31 octobre',
  accroche: 'Viens célébrer le sabbat que toutes les sorcières attendent.',
};

export const NAV = [
  { href: '/la-carte/', label: 'La carte' },
  { href: '/events/', label: 'Events' },
  { href: '/galerie/', label: 'Galerie' },
  { href: '/a-propos/', label: 'À propos' },
  { href: '/contact/', label: 'Contact' },
];
```

- [ ] **Step 2 : Écrire `src/data/horaires.ts`**

```ts
export type Jour = { jour: string; court: string; creneaux: string[] | null; index: number };

/* index = getDay() JS (0 = dimanche) pour surligner le jour courant */
export const JOURS: Jour[] = [
  { jour: 'Lundi', court: 'Lun', creneaux: null, index: 1 },
  { jour: 'Mardi', court: 'Mar', creneaux: ['16h – 20h'], index: 2 },
  { jour: 'Mercredi', court: 'Mer', creneaux: ['13h – 20h'], index: 3 },
  { jour: 'Jeudi', court: 'Jeu', creneaux: ['16h – 20h'], index: 4 },
  { jour: 'Vendredi', court: 'Ven', creneaux: ['12h – 15h', '18h – 22h'], index: 5 },
  { jour: 'Samedi', court: 'Sam', creneaux: ['12h – 15h', '18h – 22h'], index: 6 },
  { jour: 'Dimanche', court: 'Dim', creneaux: null, index: 0 },
];

export const MENTION_HORAIRES =
  'Horaires susceptibles de changer avec la rentrée et la saison : vérifie sur Instagram avant de venir.';

/* Pour le JSON-LD schema.org (openingHoursSpecification) */
export const HORAIRES_SCHEMA = JOURS.filter((j) => j.creneaux).flatMap((j) =>
  j.creneaux!.map((c) => {
    const [ouvre, ferme] = c.split(' – ').map((h) => h.replace('h', ':').padEnd(5, '0').replace(/^(\d):/, '0$1:'));
    return {
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][j.index],
      opens: ouvre,
      closes: ferme,
    };
  })
);
```

- [ ] **Step 3 : Écrire `src/lib/motion.ts` (repris de xenia, inchangé sauf commentaire)**

```ts
/* Socle animation partagé des sites vitrines (dentalexpert → xenia → ici) :
   - gate prefers-reduced-motion
   - seuil desktop JS (1024, cf. breakpoints canoniques de global.css)
   - boot différé (idle / load / premier scroll) : GSAP hors chemin critique
   - sort()+refresh() obligatoire après chaque création de pin */

export const REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export const DESKTOP_MQ = '(min-width: 1024px)';
export const isDesktop = () => window.matchMedia(DESKTOP_MQ).matches;

type GsapModules = {
  gsap: typeof import('gsap').default;
  ScrollTrigger: typeof import('gsap/ScrollTrigger').ScrollTrigger;
};

let loaded: Promise<GsapModules> | null = null;
export function loadGsap(): Promise<GsapModules> {
  loaded ??= Promise.all([import('gsap'), import('gsap/ScrollTrigger')]).then(
    ([{ default: gsap }, { ScrollTrigger }]) => {
      gsap.registerPlugin(ScrollTrigger);
      return { gsap, ScrollTrigger };
    }
  );
  return loaded;
}

/* Lance `fn` une seule fois : à l'idle (ou au load), ou dès le premier scroll. */
export function onFirstIdle(fn: () => void, timeout = 3000) {
  let done = false;
  const run = () => {
    if (done) return;
    done = true;
    fn();
  };
  if ('requestIdleCallback' in window) requestIdleCallback(run, { timeout });
  else window.addEventListener('load', run, { once: true });
  window.addEventListener('scroll', run, { once: true, passive: true });
}

/* Reveals génériques : tout [data-reveal] monte en fondu à l'entrée.
   Pas de scrub — de simples entrées « once » (piège dentalexpert :
   un pin avale les scrubs des sections suivantes). */
export function bootReveals({ gsap, ScrollTrigger }: GsapModules) {
  document.querySelectorAll<HTMLElement>('[data-reveal]').forEach((el) => {
    const children = el.hasAttribute('data-reveal-stagger') ? Array.from(el.children) : [el];
    gsap.from(children, {
      y: 26,
      opacity: 0,
      duration: 0.8,
      ease: 'power3.out',
      stagger: 0.09,
      clearProps: 'transform,opacity',
      scrollTrigger: { trigger: el, start: 'top 84%', once: true },
    });
  });
  ScrollTrigger.sort();
  ScrollTrigger.refresh();
}
```

- [ ] **Step 4 : Écrire `src/styles/global.css`**

```css
/* ============================================================
   DAILY POP SOCIETY — système « Le générique »
   Noir d'encre, bordeaux profond, blanc, crème papier.
   Titres : Anton (title card). Texte : Inter. Annotations : Caveat.
   Onomatopées : Bangers (uniquement dans les cases, aria-hidden).
   ============================================================ */
:root {
  --noir: #0E0E0E;
  --bdx: #7B1E2B;
  --bdx-deep: #4E0F1A;
  --rouge: #B4162F;
  --rose: #E3A1AB;
  --creme: #F6F1E8;
  --blanc: #FFFFFF;
  --gris: #5B5B5B;
  --gris-ligne: rgba(14, 14, 14, 0.14);

  --font-title: 'Anton', Impact, 'Arial Narrow', sans-serif;
  --font-body: 'Inter Variable', system-ui, sans-serif;
  --font-hand: 'Caveat', cursive;
  --font-sfx: 'Bangers', cursive;

  --container: 1180px;
  --container-narrow: 820px;
  --gutter: clamp(20px, 4vw, 32px);
  --section-pad: clamp(72px, 10vw, 130px);
  --bord: 3px solid var(--noir);
  --ombre-case: 6px 6px 0 var(--bdx);
  --ease: cubic-bezier(0.16, 1, 0.3, 1);
}
/* Breakpoints canoniques : 600 mobile · 960 tablette · 1024 desktop JS (motion.ts).
   Ne pas en introduire d'autres. */

/* ===== Reset ===== */
*, *::before, *::after { box-sizing: border-box; }
html { scroll-behavior: smooth; scroll-padding-top: 90px; }
@media (prefers-reduced-motion: reduce) { html { scroll-behavior: auto; } }
body {
  margin: 0;
  font-family: var(--font-body);
  color: var(--noir);
  background: var(--blanc);
  line-height: 1.55;
  -webkit-font-smoothing: antialiased;
}
img, svg { max-width: 100%; }
img { display: block; height: auto; }
h1, h2, h3, h4, p, figure, ul, ol { margin: 0; }
ul, ol { padding: 0; list-style: none; }
a { color: inherit; }
button { font: inherit; color: inherit; background: none; border: 0; cursor: pointer; }
:focus-visible { outline: 3px solid var(--rouge); outline-offset: 3px; }

.skip-link {
  position: absolute; left: 12px; top: -60px; z-index: 100;
  padding: 10px 16px; background: var(--noir); color: var(--blanc);
  font-weight: 700; text-decoration: none;
}
.skip-link:focus { top: 12px; }

/* ===== Conteneurs ===== */
.container { max-width: var(--container); margin-inline: auto; padding-inline: var(--gutter); }
.container--narrow { max-width: var(--container-narrow); }
.section { padding-block: var(--section-pad); }
.section--creme { background: var(--creme); }
.section--noir { background: var(--noir); color: var(--blanc); }
.section--trame {
  background-color: var(--creme);
  background-image: radial-gradient(rgba(14, 14, 14, 0.55) 0.8px, transparent 1px);
  background-size: 7px 7px;
}

/* ===== Typographie ===== */
.titre {
  font-family: var(--font-title);
  font-weight: 400;
  text-transform: uppercase;
  letter-spacing: 0.01em;
  line-height: 0.92;
  font-size: clamp(2.6rem, 6.5vw, 5.4rem);
  text-wrap: balance;
}
.titre--md { font-size: clamp(2rem, 4.4vw, 3.4rem); }
.titre--sm { font-size: clamp(1.4rem, 2.6vw, 2rem); }
.titre em, .titre .accent { font-style: normal; color: var(--rouge); }
.section--noir .titre em, .tc--bordeaux .titre em, .tc--bordeaux-sombre .titre em, .tc--noir .titre em { color: var(--rose); }
.kicker {
  display: block;
  font-size: 0.76rem; font-weight: 700; letter-spacing: 0.32em; text-transform: uppercase;
  color: var(--rouge); margin-bottom: 18px;
}
.section--noir .kicker { color: var(--rose); }
.copy {
  margin-top: 20px;
  font-size: clamp(1.02rem, 1.4vw, 1.18rem);
  line-height: 1.6;
  color: var(--gris);
  max-width: 38em;
  text-wrap: pretty;
}
.section--noir .copy { color: rgba(255, 255, 255, 0.78); }
.copy strong { color: inherit; font-weight: 700; }
.copy--center { margin-inline: auto; text-align: center; }
.hand { font-family: var(--font-hand); font-size: 1.5em; color: var(--bdx); line-height: 1.1; }
.section--noir .hand { color: var(--rose); }
.center { text-align: center; }

/* ===== Boutons ===== */
.actions { margin-top: 32px; display: flex; gap: 16px; align-items: center; flex-wrap: wrap; }
.actions--center { justify-content: center; }
.btn {
  display: inline-flex; align-items: center; justify-content: center; gap: 10px;
  padding: 14px 24px;
  border: var(--bord);
  background: var(--rouge); color: var(--blanc);
  font-family: var(--font-title); font-size: 1.05rem; letter-spacing: 0.12em; text-transform: uppercase;
  text-decoration: none;
  box-shadow: 4px 4px 0 var(--noir);
  transition: transform 0.2s var(--ease), box-shadow 0.2s var(--ease);
}
.btn:hover { transform: translate(-2px, -2px); box-shadow: 6px 6px 0 var(--noir); }
.btn:active { transform: translate(2px, 2px); box-shadow: 2px 2px 0 var(--noir); }
.btn--blanc { background: var(--blanc); color: var(--noir); }
.btn--ghost { background: transparent; color: inherit; border-color: currentColor; box-shadow: none; }
.btn--ghost:hover { box-shadow: none; transform: none; text-decoration: underline; text-underline-offset: 6px; }
.link-arrow {
  display: inline-flex; align-items: center; gap: 8px;
  font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase; font-size: 0.86rem;
  text-decoration: none; border-bottom: 2px solid currentColor; padding-bottom: 2px;
}

/* ===== Title card (ouverture de page) ===== */
.tc {
  position: relative;
  padding: clamp(150px, 20vw, 220px) 0 clamp(60px, 8vw, 100px);
  overflow: hidden;
}
.tc--bordeaux { background: radial-gradient(ellipse at 50% 70%, #9A2334 0%, var(--bdx) 45%, var(--bdx-deep) 100%); color: var(--blanc); }
.tc--bordeaux-sombre { background: linear-gradient(180deg, var(--bdx-deep), #2A0810); color: var(--blanc); }
.tc--noir { background: var(--noir); color: var(--blanc); }
.tc--creme {
  background-color: var(--creme);
  background-image: radial-gradient(rgba(14, 14, 14, 0.5) 0.8px, transparent 1px);
  background-size: 7px 7px;
}
.tc--blanc { background: var(--blanc); border-bottom: var(--bord); }
.tc .kicker { color: var(--rose); }
.tc--creme .kicker, .tc--blanc .kicker { color: var(--rouge); }
.tc .copy { color: inherit; opacity: 0.82; }
.tc--creme .copy, .tc--blanc .copy { color: var(--gris); opacity: 1; }
/* Letterbox : bandes noires de cinéma en haut et en bas d'une section */
.letterbox { position: relative; }
.letterbox::before, .letterbox::after {
  content: ''; position: absolute; left: 0; right: 0; height: clamp(14px, 2vw, 22px);
  background: var(--noir); z-index: 2;
}
.letterbox::before { top: 0; }
.letterbox::after { bottom: 0; }
.tc--noir.letterbox::before, .tc--noir.letterbox::after { background: var(--bdx); }

/* ===== Case de comics ===== */
.case {
  position: relative;
  display: flex; flex-direction: column;
  background: var(--blanc); color: var(--noir);
  border: var(--bord);
  box-shadow: var(--ombre-case);
  text-decoration: none;
  transition: transform 0.25s var(--ease), box-shadow 0.25s var(--ease);
}
a.case:hover { transform: translate(-3px, -3px); box-shadow: 9px 9px 0 var(--bdx); }
.case__media { border-bottom: var(--bord); aspect-ratio: 4 / 3; overflow: hidden; background: var(--creme); }
.case__media img { width: 100%; height: 100%; object-fit: cover; }
.case__body { padding: 18px 20px 22px; }
.case__titre { font-family: var(--font-title); font-size: 1.35rem; text-transform: uppercase; letter-spacing: 0.04em; line-height: 1; }
.case__texte { margin-top: 8px; font-size: 0.95rem; color: var(--gris); line-height: 1.5; }
.case__tag { display: inline-block; margin-bottom: 8px; font-size: 0.7rem; font-weight: 700; letter-spacing: 0.2em; text-transform: uppercase; color: var(--rouge); }
.sfx {
  position: absolute; right: -8px; top: 12px; z-index: 2;
  padding: 4px 14px;
  font-family: var(--font-sfx); font-size: 1.5rem; letter-spacing: 0.08em;
  color: var(--blanc); background: var(--rouge);
  border: var(--bord); transform: rotate(7deg);
}
.grille { display: grid; gap: clamp(18px, 2.6vw, 30px); }
.grille--3 { grid-template-columns: repeat(3, 1fr); }
.grille--2 { grid-template-columns: repeat(2, 1fr); }
@media (max-width: 960px) { .grille--3 { grid-template-columns: repeat(2, 1fr); } }
@media (max-width: 600px) { .grille--3, .grille--2 { grid-template-columns: 1fr; } }

/* ===== Points de conduite (carte) ===== */
.ligne { display: flex; align-items: baseline; gap: 10px; }
.ligne__nom { font-weight: 700; }
.ligne__points { flex: 1; border-bottom: 2px dotted var(--gris-ligne); transform: translateY(-5px); min-width: 24px; }
.ligne__prix { font-family: var(--font-title); font-size: 1.15rem; color: var(--bdx); letter-spacing: 0.04em; white-space: nowrap; }

/* ===== Transition douce entre sections (feuille arrondie) ===== */
.feuille { position: relative; margin-top: -28px; border-radius: 28px 28px 0 0; z-index: 1; }

/* ===== Générique (états sans JS et reduced-motion) : cf. Generique.astro ===== */
```

- [ ] **Step 5 : Écrire `public/favicon.svg`**

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="12" fill="#7B1E2B"/><text x="32" y="44" text-anchor="middle" font-family="Impact, Arial Narrow, sans-serif" font-size="34" fill="#fff">DP</text></svg>
```

- [ ] **Step 6 : Écrire `src/layouts/Base.astro`**

```astro
---
import '@fontsource/anton';
import '@fontsource-variable/inter';
import '@fontsource/caveat/600.css';
import '@fontsource/bangers';
import '../styles/global.css';
import antonWoff2 from '@fontsource/anton/files/anton-latin-400-normal.woff2?url';
import interWoff2 from '@fontsource-variable/inter/files/inter-latin-wght-normal.woff2?url';
import Header from '../components/Header.astro';
import Footer from '../components/Footer.astro';
import { IDENTITE } from '../data/site';
import { HORAIRES_SCHEMA } from '../data/horaires';

interface Props { title: string; description: string; noindex?: boolean }
const { title, description, noindex = false } = Astro.props;

const canonical = new URL(Astro.url.pathname, Astro.site);
const og = new URL('/media/og.png', Astro.site);

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'BarOrPub',
  '@id': `${IDENTITE.domaine}/#bar`,
  name: IDENTITE.nom,
  slogan: IDENTITE.slogan,
  description: 'Bar food & drinks dédié à la pop culture à Charleroi : cocktails à personnages, burgers, bubble teas, events mensuels, blind tests, JDR, coin gaming. Cosplay friendly.',
  url: IDENTITE.domaine,
  image: og.toString(),
  telephone: IDENTITE.telephoneIntl,
  email: IDENTITE.email,
  servesCuisine: ['Burgers', 'Cocktails', 'Bubble tea'],
  priceRange: '€€',
  address: {
    '@type': 'PostalAddress',
    streetAddress: IDENTITE.rue,
    postalCode: IDENTITE.codePostal,
    addressLocality: IDENTITE.ville,
    addressCountry: 'BE',
  },
  openingHoursSpecification: HORAIRES_SCHEMA,
  sameAs: [IDENTITE.facebook, IDENTITE.instagram],
};
---
<html lang="fr">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>{title}</title>
    <meta name="description" content={description} />
    <link rel="canonical" href={canonical} />
    {noindex && <meta name="robots" content="noindex" />}
    <meta name="theme-color" content="#7B1E2B" />
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
    <link rel="preload" as="font" type="font/woff2" href={antonWoff2} crossorigin />
    <link rel="preload" as="font" type="font/woff2" href={interWoff2} crossorigin />
    <meta property="og:title" content={title} />
    <meta property="og:description" content={description} />
    <meta property="og:type" content="website" />
    <meta property="og:url" content={canonical} />
    <meta property="og:image" content={og} />
    <meta property="og:site_name" content={IDENTITE.nom} />
    <meta property="og:locale" content="fr_BE" />
    <meta name="twitter:card" content="summary_large_image" />
    <script type="application/ld+json" set:html={JSON.stringify(jsonLd)} />
  </head>
  <body>
    <a class="skip-link" href="#contenu">Aller au contenu</a>
    <Header />
    <main id="contenu">
      <slot />
    </main>
    <Footer />
    <script>
      import { REDUCED, loadGsap, onFirstIdle, bootReveals } from '../lib/motion';
      if (!REDUCED && document.querySelector('[data-reveal]')) {
        onFirstIdle(() => { loadGsap().then(bootReveals); });
      }
    </script>
  </body>
</html>
```

- [ ] **Step 7 : Écrire `src/components/Header.astro`**

```astro
---
import { NAV, IDENTITE } from '../data/site';
const path = Astro.url.pathname;
const isActive = (href: string) => path === href || path.startsWith(href);
---
<header class="nav" id="site-nav">
  <div class="nav__capsule">
    <a href="/" class="nav__brand" aria-label="Daily Pop Society — accueil">
      <img src="/media/logo-64.webp" alt="" width="32" height="32" />
      <span>Daily Pop <b>Society</b></span>
    </a>
    <nav class="nav__links" aria-label="Navigation principale">
      {NAV.map((item) => <a href={item.href} class:list={{ 'is-active': isActive(item.href) }}>{item.label}</a>)}
    </nav>
    <a class="nav__cta" href="/contact/">Nous trouver</a>
    <button class="nav__burger" id="nav-burger" aria-expanded="false" aria-controls="nav-menu" aria-label="Ouvrir le menu">
      <span></span><span></span>
    </button>
  </div>
  <div class="nav__menu" id="nav-menu" aria-hidden="true">
    <nav aria-label="Menu mobile">
      {NAV.map((item, i) => <a href={item.href} style={`--i: ${i}`}>{item.label}</a>)}
    </nav>
    <div class="nav__menu-foot">
      <a class="btn btn--blanc" href="/contact/">Nous trouver</a>
      <a class="nav__menu-tel" href={`tel:${IDENTITE.telephoneIntl}`}>{IDENTITE.telephone}</a>
      <p>{IDENTITE.rue}, {IDENTITE.ville} · {IDENTITE.slogan}</p>
    </div>
  </div>
</header>

<script>
  const nav = document.getElementById('site-nav');
  const burger = document.getElementById('nav-burger');
  const menu = document.getElementById('nav-menu');
  const onScroll = () => nav?.classList.toggle('is-scrolled', window.scrollY > 30);
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });
  const setMenu = (open: boolean) => {
    menu?.classList.toggle('is-open', open);
    burger?.classList.toggle('is-open', open);
    burger?.setAttribute('aria-expanded', String(open));
    burger?.setAttribute('aria-label', open ? 'Fermer le menu' : 'Ouvrir le menu');
    menu?.setAttribute('aria-hidden', String(!open));
    document.body.style.overflow = open ? 'hidden' : '';
  };
  burger?.addEventListener('click', () => setMenu(!menu?.classList.contains('is-open')));
  menu?.querySelectorAll('a').forEach((a) => a.addEventListener('click', () => setMenu(false)));
  window.addEventListener('keydown', (e) => { if (e.key === 'Escape') setMenu(false); });
</script>

<style>
  /* Capsule noire flottante — lisible sur les six title cards */
  .nav { position: fixed; inset-inline: 0; top: 14px; z-index: 60; display: flex; justify-content: center; pointer-events: none; padding-inline: 12px; }
  .nav__capsule {
    pointer-events: auto;
    display: flex; align-items: center; gap: clamp(14px, 2vw, 28px);
    padding: 8px 8px 8px 16px;
    background: rgba(14, 14, 14, 0.88); color: var(--blanc);
    border: 1px solid rgba(255, 255, 255, 0.18);
    -webkit-backdrop-filter: blur(14px); backdrop-filter: blur(14px);
    box-shadow: 0 14px 40px rgba(0, 0, 0, 0.35);
    transition: background 0.3s ease;
  }
  .nav.is-scrolled .nav__capsule { background: rgba(14, 14, 14, 0.96); }
  .nav__brand { display: flex; align-items: center; gap: 10px; text-decoration: none; font-family: var(--font-title); font-size: 1rem; letter-spacing: 0.08em; text-transform: uppercase; white-space: nowrap; }
  .nav__brand img { border-radius: 50%; border: 1.5px solid var(--blanc); }
  .nav__brand b { color: var(--rose); font-weight: 400; }
  .nav__links { display: flex; align-items: center; gap: clamp(12px, 1.6vw, 22px); }
  .nav__links a { font-size: 0.78rem; font-weight: 600; letter-spacing: 0.16em; text-transform: uppercase; text-decoration: none; color: rgba(255, 255, 255, 0.78); padding: 6px 2px; transition: color 0.2s; }
  .nav__links a:hover { color: var(--blanc); }
  .nav__links a.is-active { color: var(--rose); }
  .nav__cta { font-size: 0.76rem; font-weight: 700; letter-spacing: 0.16em; text-transform: uppercase; text-decoration: none; background: var(--rouge); color: var(--blanc); padding: 10px 16px; }
  .nav__burger { display: none; width: 42px; height: 42px; flex-direction: column; align-items: center; justify-content: center; gap: 6px; }
  .nav__burger span { display: block; width: 22px; height: 2px; background: var(--blanc); transition: transform 0.3s var(--ease); }
  .nav__burger.is-open span:first-child { transform: translateY(4px) rotate(45deg); }
  .nav__burger.is-open span:last-child { transform: translateY(-4px) rotate(-45deg); }
  .nav__menu { position: fixed; inset: 0; z-index: 50; background: var(--noir); color: var(--blanc); display: flex; flex-direction: column; justify-content: center; padding: 100px 32px 40px; opacity: 0; visibility: hidden; transition: opacity 0.3s ease, visibility 0.3s; pointer-events: auto; }
  .nav__menu.is-open { opacity: 1; visibility: visible; }
  .nav__menu nav a { display: block; font-family: var(--font-title); font-size: clamp(2.2rem, 9vw, 3.4rem); text-transform: uppercase; text-decoration: none; line-height: 1.1; transform: translateY(20px); opacity: 0; transition: transform 0.5s var(--ease) calc(var(--i) * 60ms), opacity 0.5s ease calc(var(--i) * 60ms); }
  .nav__menu.is-open nav a { transform: none; opacity: 1; }
  .nav__menu-foot { margin-top: 36px; display: grid; gap: 14px; font-size: 0.9rem; color: rgba(255, 255, 255, 0.7); }
  .nav__menu-tel { color: var(--blanc); font-weight: 700; text-decoration: none; }
  @media (max-width: 960px) {
    .nav__links, .nav__cta { display: none; }
    .nav__burger { display: flex; }
    .nav__capsule { width: 100%; justify-content: space-between; }
  }
</style>
```

- [ ] **Step 8 : Écrire `src/components/Footer.astro` et `src/components/Horaires.astro`**

`src/components/Footer.astro` :
```astro
---
import { IDENTITE, NAV } from '../data/site';
import { JOURS } from '../data/horaires';
const year = new Date().getFullYear();
---
<footer class="footer">
  <div class="container footer__grid">
    <div>
      <p class="footer__brand">Daily Pop <b>Society</b></p>
      <p class="footer__tag">{IDENTITE.slogan}</p>
      <p class="footer__txt">Le bar où la pop culture rassemble toutes les générations. Cosplay bienvenu, tout le temps.</p>
      <p class="footer__social">
        <a href={IDENTITE.instagram} rel="noopener" target="_blank">Instagram</a>
        <a href={IDENTITE.facebook} rel="noopener" target="_blank">Facebook</a>
      </p>
    </div>
    <nav aria-label="Pages">
      <p class="footer__head">Le site</p>
      {NAV.map((n) => <a href={n.href}>{n.label}</a>)}
      <a href="/mentions-legales/">Mentions légales</a>
    </nav>
    <div>
      <p class="footer__head">Horaires</p>
      {JOURS.map((j) => <p class="footer__jour"><span>{j.court}</span>{j.creneaux ? j.creneaux.join(' · ') : 'Fermé'}</p>)}
    </div>
    <div>
      <p class="footer__head">Nous trouver</p>
      <p>{IDENTITE.rue}<br />{IDENTITE.codePostal} {IDENTITE.ville}</p>
      <a href={`tel:${IDENTITE.telephoneIntl}`}>{IDENTITE.telephone}</a>
      <a href={`mailto:${IDENTITE.email}`}>{IDENTITE.email}</a>
      <p class="footer__legal">TVA {IDENTITE.tva}</p>
    </div>
  </div>
  <div class="container footer__bottom">
    <p>© {year} {IDENTITE.nom} — Charleroi, Terre-6000.</p>
    <p>Ex-Nakama's Coffee, depuis avril 2024.</p>
  </div>
</footer>

<style>
  .footer { background: var(--noir); color: rgba(255, 255, 255, 0.8); padding: clamp(56px, 8vw, 90px) 0 28px; border-top: 6px solid var(--bdx); }
  .footer__grid { display: grid; grid-template-columns: 1.5fr 1fr 1.1fr 1.1fr; gap: clamp(28px, 4vw, 56px); }
  .footer__brand { font-family: var(--font-title); font-size: 1.5rem; text-transform: uppercase; letter-spacing: 0.06em; color: var(--blanc); }
  .footer__brand b { color: var(--rose); font-weight: 400; }
  .footer__tag { font-size: 0.72rem; letter-spacing: 0.3em; text-transform: uppercase; color: var(--rose); margin-top: 6px; }
  .footer__txt { margin-top: 14px; font-size: 0.92rem; line-height: 1.6; }
  .footer__social { margin-top: 14px; display: flex; gap: 18px; }
  .footer__social a, .footer nav a, .footer div > a { display: block; color: var(--blanc); text-decoration: none; font-size: 0.92rem; line-height: 2; }
  .footer a:hover { text-decoration: underline; text-underline-offset: 4px; }
  .footer__head { font-family: var(--font-title); font-size: 0.95rem; letter-spacing: 0.2em; text-transform: uppercase; color: var(--rose); margin-bottom: 10px; }
  .footer__jour { display: flex; gap: 10px; font-size: 0.86rem; line-height: 1.9; }
  .footer__jour span { width: 36px; color: var(--blanc); font-weight: 700; }
  .footer__legal { margin-top: 10px; font-size: 0.8rem; color: rgba(255, 255, 255, 0.55); }
  .footer__bottom { margin-top: 48px; padding-top: 18px; border-top: 1px solid rgba(255, 255, 255, 0.14); display: flex; justify-content: space-between; gap: 16px; flex-wrap: wrap; font-size: 0.8rem; color: rgba(255, 255, 255, 0.55); }
  @media (max-width: 960px) { .footer__grid { grid-template-columns: 1fr 1fr; } }
  @media (max-width: 600px) { .footer__grid { grid-template-columns: 1fr; } }
</style>
```

`src/components/Horaires.astro` :
```astro
---
import { JOURS, MENTION_HORAIRES } from '../data/horaires';
---
<div class="horaires" id="horaires">
  <ul class="horaires__liste">
    {JOURS.map((j) => (
      <li class="horaires__jour" data-jour={j.index}>
        <span class="horaires__nom">{j.jour}</span>
        <span class="horaires__points" aria-hidden="true"></span>
        <span class="horaires__creneaux">{j.creneaux ? j.creneaux.join(' · ') : 'Fermé'}</span>
      </li>
    ))}
  </ul>
  <p class="horaires__mention hand">{MENTION_HORAIRES}</p>
</div>

<script>
  /* Surligne le jour courant — amélioration progressive, rien sans JS */
  const today = new Date().getDay();
  document.querySelectorAll<HTMLElement>('.horaires__jour').forEach((li) => {
    li.classList.toggle('is-today', Number(li.dataset.jour) === today);
  });
</script>

<style>
  .horaires__liste { display: grid; gap: 6px; max-width: 520px; }
  .horaires__jour { display: flex; align-items: baseline; gap: 10px; font-size: 1.02rem; padding: 4px 8px; }
  .horaires__jour.is-today { background: var(--rouge); color: var(--blanc); }
  .horaires__jour.is-today .horaires__points { border-color: rgba(255, 255, 255, 0.6); }
  .horaires__nom { font-weight: 700; min-width: 5.5em; }
  .horaires__points { flex: 1; border-bottom: 2px dotted currentColor; opacity: 0.35; transform: translateY(-5px); }
  .horaires__creneaux { font-family: var(--font-title); letter-spacing: 0.05em; font-size: 1.05rem; }
  .horaires__mention { margin-top: 18px; max-width: 520px; }
</style>
```

- [ ] **Step 9 : Produire le logo principal en WebP (3 tailles) depuis `brief/site-actuel/logo.jpg`**

Run :
```bash
cd C:/Dev/Noveo/_autres/website/dailypopsociety && mkdir -p public/media && python3 - <<'EOF'
from PIL import Image
im = Image.open('brief/site-actuel/logo.jpg').convert('RGB')
# Le JPEG est 691x707 : on recadre au carré centré avant de réduire
s = min(im.size); l = (im.width - s) // 2; t = (im.height - s) // 2
im = im.crop((l, t, l + s, t + s))
for w in (64, 320, 640):
    im.resize((w, w), Image.LANCZOS).save(f'public/media/logo-{w}.webp', 'WEBP', quality=88, method=6)
print('ok')
EOF
ls -la public/media
```
Expected : `logo-64.webp`, `logo-320.webp`, `logo-640.webp` (chacun < 60 Ko).

- [ ] **Step 10 : Écrire `src/pages/404.astro` et remplacer `src/pages/index.astro` par une page sur le layout**

`src/pages/404.astro` :
```astro
---
import Base from '../layouts/Base.astro';
---
<Base title="Page introuvable — Daily Pop Society" description="Cette page n'existe pas dans ce multivers. Retourne à l'accueil ou va voir la carte, les events et la galerie de Daily Pop Society à Charleroi." noindex>
  <section class="tc tc--noir letterbox nf">
    <div class="container">
      <span class="kicker">Erreur 404</span>
      <h1 class="titre">Cette page n'existe pas<br /><em>dans ce multivers.</em></h1>
      <p class="copy">Mauvaise dimension, mauvaise URL. Repars de l'accueil, ou va directement voir ce qu'il se passe ce mois-ci.</p>
      <div class="actions">
        <a class="btn" href="/">Retour à l'accueil</a>
        <a class="btn btn--ghost" href="/events/">Les events</a>
      </div>
    </div>
  </section>
</Base>
<style>
  .nf { min-height: 80svh; display: flex; align-items: center; }
</style>
```

`src/pages/index.astro` (version provisoire, remplacée en Task 5) :
```astro
---
import Base from '../layouts/Base.astro';
import Horaires from '../components/Horaires.astro';
import { IDENTITE } from '../data/site';
---
<Base title="Daily Pop Society — Bar pop culture à Charleroi" description="Food, drinks, fandom : cocktails à personnages, burgers, bubble teas, events mensuels, blind tests et JDR au cœur de Charleroi. Cosplay bienvenu, tout le temps.">
  <section class="tc tc--bordeaux letterbox">
    <div class="container">
      <span class="kicker">{IDENTITE.accroche}</span>
      <h1 class="titre">Daily Pop<br /><em>Society</em></h1>
      <p class="copy">{IDENTITE.slogan}</p>
    </div>
  </section>
  <section class="section">
    <div class="container">
      <span class="kicker">Ouvertures</span>
      <h2 class="titre titre--md">Quand passer <em>nous voir</em></h2>
      <div style="margin-top: 28px"><Horaires /></div>
    </div>
  </section>
</Base>
```

- [ ] **Step 11 : Build + contrôle (doit PASSER)**

Run : `pnpm test`
Expected : build sans erreur, `✓ verifier : 2 pages contrôlées, aucun écart`.

- [ ] **Step 12 : Boucle visuelle — capture desktop + mobile de l'accueil et de la 404, lecture, corrections éventuelles**

Run (serveur dev en arrière-plan : `pnpm dev`, `run_in_background: true`, puis) :
```bash
B="$HOME/.claude/skills/gstack/browse/dist/browse"; S="<scratchpad>"
echo '[["viewport","1440x900"],["goto","http://localhost:4332/"],["wait","--networkidle"],["screenshot","'"$S/t2-home.png"'"],["viewport","375x812"],["goto","http://localhost:4332/"],["wait","--networkidle"],["screenshot","'"$S/t2-home-mobile.png"'"],["viewport","1440x900"],["goto","http://localhost:4332/nimportequoi"],["wait","--networkidle"],["screenshot","'"$S/t2-404.png"'"]]' | "$B" chain
```
Puis lire les trois PNG avec l'outil Read. Attendu : capsule noire lisible, title card bordeaux avec « DAILY POP / SOCIETY » en Anton, horaires avec le jour courant surligné, footer 4 colonnes (1 colonne en mobile), burger fonctionnel (tester : `["click","#nav-burger"],["screenshot",…]`). Corriger ce qui ne va pas avant de committer.

- [ ] **Step 13 : Commit**

```bash
git add src public
git commit -m "feat: socle visuel — tokens, layout SEO/JSON-LD, header capsule, footer, horaires, 404"
```

---

### Task 3 : Les logos mensuels — découpe, montage et données générées

**Files:**
- Create: `scripts/logos.py`, `public/media/logos/*.webp` (générés), `public/media/logos/montage.webp`, `src/data/logos.ts` (généré)

- [ ] **Step 1 : Écrire `scripts/logos.py`**

Les coordonnées ont été relevées le 2026-09-07 sur les planches 1600×1142 (centre x, centre y, rayon). Le script est la SEULE source : il écrit les WebP ET `src/data/logos.ts`.

```python
"""Découpe les logos mensuels des planches « Logo timeline » (brief/site-actuel)
en vignettes WebP + un montage pour le remplissage des lettres du générique,
et génère src/data/logos.ts. Relancer après tout ajout de logo."""
from PIL import Image
from pathlib import Path

RACINE = Path(__file__).resolve().parent.parent
SRC = RACINE / 'brief' / 'site-actuel'
OUT = RACINE / 'public' / 'media' / 'logos'
OUT.mkdir(parents=True, exist_ok=True)

# (id, planche, cx, cy, rayon, mois AAAA-MM, licence)
LOGOS = [
    ('2024-04-nakamas', 'timeline-2024', 300, 800, 75, '2024-04', "Nakama's Coffee — naissance"),
    ('2024-06-demon-slayer', 'timeline-2024', 505, 305, 80, '2024-06', 'Demon Slayer'),
    ('2024-07-one-piece', 'timeline-2024', 640, 800, 75, '2024-07', 'One Piece'),
    ('2024-08-jujutsu-kaisen', 'timeline-2024', 825, 305, 80, '2024-08', 'Jujutsu Kaisen'),
    ('2024-09-fairy-tail', 'timeline-2024', 985, 800, 75, '2024-09', 'Fairy Tail'),
    ('2024-10-halloween', 'timeline-2024', 1140, 305, 80, '2024-10', 'Halloween'),
    ('2024-11-naruto', 'timeline-2024', 1325, 800, 75, '2024-11', 'Naruto'),
    ('2024-12-dragon-ball', 'timeline-2024', 1460, 305, 80, '2024-12', 'Dragon Ball Z'),
    ('2024-12-noel', 'timeline-2024', 1455, 118, 70, '2024-12', 'Noël'),
    ('2025-01-tattoo', 'timeline-2025', 160, 370, 65, '2025-01', 'Tattoo'),
    ('2025-02-bleach', 'timeline-2025', 215, 750, 65, '2025-02', 'Bleach'),
    ('2025-03-club-dorothee', 'timeline-2025', 425, 370, 65, '2025-03', 'Club Dorothée'),
    ('2025-04-nana', 'timeline-2025', 475, 750, 65, '2025-04', 'Nana'),
    ('2025-05-pokemon', 'timeline-2025', 685, 370, 65, '2025-05', 'Pokémon'),
    ('2025-06-one-piece', 'timeline-2025', 735, 750, 65, '2025-06', 'One Piece'),
    ('2025-07-magical-girls', 'timeline-2025', 950, 370, 65, '2025-07', 'Magical Girls'),
    ('2025-08-badass', 'timeline-2025', 990, 750, 65, '2025-08', 'Badass'),
    ('2025-09-demon-hunters', 'timeline-2025', 1215, 370, 65, '2025-09', 'Kpop Demon Hunters'),
    ('2025-10-scientifique', 'timeline-2025', 1245, 750, 65, '2025-10', 'Scientifique'),
    ('2025-10-halloween', 'timeline-2025', 1245, 910, 65, '2025-10', 'Halloween'),
    ('2025-11-my-hero-academia', 'timeline-2025', 1470, 370, 65, '2025-11', 'My Hero Academia'),
    ('2025-12-closing', 'timeline-2025', 1500, 750, 65, '2025-12', 'Closing de Noël'),
    ('2026-01-hazbin-hotel', 'timeline-2026', 165, 215, 60, '2026-01', 'Hazbin Hotel'),
    ('2026-01-one-piece', 'timeline-2026', 165, 365, 60, '2026-01', 'One Piece'),
    ('2026-02-saint-valentin', 'timeline-2026', 215, 770, 60, '2026-02', 'Saint-Valentin'),
    ('2026-03-hunter-x-hunter', 'timeline-2026', 425, 365, 60, '2026-03', 'Hunter × Hunter'),
    ('2026-04-deux-ans', 'timeline-2026', 480, 770, 60, '2026-04', 'Les 2 ans'),
    ('2026-05-daily-pop-society', 'timeline-2026', 700, 320, 80, '2026-05', 'Daily Pop Society — nouveau logo'),
]
TAILLE = 160

planches = {}
def planche(nom):
    if nom not in planches:
        planches[nom] = Image.open(SRC / f'{nom}.jpg').convert('RGB')
    return planches[nom]

lignes = []
vignettes = []
for id_, pl, cx, cy, r, mois, licence in LOGOS:
    marge = 6
    im = planche(pl).crop((cx - r - marge, cy - r - marge, cx + r + marge, cy + r + marge)).resize((TAILLE, TAILLE), Image.LANCZOS)
    im.save(OUT / f'{id_}.webp', 'WEBP', quality=84, method=6)
    vignettes.append(im)
    lignes.append(f"  {{ id: '{id_}', mois: '{mois}', licence: \"{licence}\", src: '/media/logos/{id_}.webp' }},")

# Montage 10 colonnes : remplissage des lettres « DAILY POP » (background-clip: text)
cols = 10
rows = (len(vignettes) + cols - 1) // cols
mont = Image.new('RGB', (TAILLE * cols, TAILLE * rows), 'white')
for i, v in enumerate(vignettes):
    mont.paste(v, ((i % cols) * TAILLE, (i // cols) * TAILLE))
mont.save(OUT / 'montage.webp', 'WEBP', quality=80, method=6)

ts = (RACINE / 'src' / 'data' / 'logos.ts')
ts.write_text(
    "/* GÉNÉRÉ par scripts/logos.py — ne pas éditer à la main. */\n"
    "export type LogoMensuel = { id: string; mois: string; licence: string; src: string };\n\n"
    "export const LOGOS: LogoMensuel[] = [\n" + "\n".join(lignes) + "\n];\n\n"
    f"export const MONTAGE = {{ src: '/media/logos/montage.webp', largeur: {TAILLE * cols}, hauteur: {TAILLE * rows} }};\n",
    encoding='utf-8',
)
print(f'{len(LOGOS)} logos → {OUT}, montage {mont.size}, logos.ts écrit')
```

- [ ] **Step 2 : Exécuter et contrôler visuellement la planche des vignettes**

Run : `python3 scripts/logos.py && python3 -c "from PIL import Image; im=Image.open('public/media/logos/montage.webp'); im.save('<scratchpad>/montage-controle.png'); print(im.size)"`
Expected : `28 logos → …, montage (1600, 480), logos.ts écrit`. Lire `montage-controle.png` avec Read : chaque vignette doit montrer un logo rond entier, centré (aucun coupé, aucun vide). Si une vignette est décalée, corriger ses coordonnées dans `LOGOS` et relancer.

- [ ] **Step 3 : Contrôle de type des données générées**

Run : `pnpm check`
Expected : `0 errors` (les avertissements Astro sur des pages vides sont tolérés).

- [ ] **Step 4 : Commit**

```bash
git add scripts/logos.py public/media/logos src/data/logos.ts
git commit -m "feat: logos mensuels découpés en WebP + montage + données générées"
```

---

### Task 4 : Composants TitleCard et Case, page mentions légales

**Files:**
- Create: `src/components/TitleCard.astro`, `src/components/Case.astro`, `src/pages/mentions-legales.astro`
- Modify: `scripts/verifier.mjs` (PAGES), `src/pages/404.astro` et `src/pages/index.astro` (utiliser TitleCard)

- [ ] **Step 1 : Étendre la liste des pages attendues, lancer le contrôle (doit ÉCHOUER sur `mentions-legales/index.html`)**

Dans `scripts/verifier.mjs` : `export const PAGES = ['index.html', '404.html', 'mentions-legales/index.html'];`
Run : `pnpm test` → Expected : `page absente : mentions-legales/index.html`.

- [ ] **Step 2 : Écrire `src/components/TitleCard.astro`**

```astro
---
/* Ouverture de page : un champ de couleur, un kicker, un titre condensé.
   variante : bordeaux | bordeaux-sombre | noir | creme | blanc
   letterbox : bandes noires cinéma (haut/bas) */
interface Props {
  kicker: string;
  variante?: 'bordeaux' | 'bordeaux-sombre' | 'noir' | 'creme' | 'blanc';
  letterbox?: boolean;
  id?: string;
}
const { kicker, variante = 'bordeaux', letterbox = false, id } = Astro.props;
---
<section class:list={['tc', `tc--${variante}`, { letterbox }]} id={id}>
  <div class="container">
    <span class="kicker">{kicker}</span>
    <h1 class="titre"><slot /></h1>
    {Astro.slots.has('copy') && <p class="copy"><slot name="copy" /></p>}
    {Astro.slots.has('actions') && <div class="actions"><slot name="actions" /></div>}
  </div>
</section>
```

- [ ] **Step 3 : Écrire `src/components/Case.astro`**

```astro
---
/* Case de comics : bord noir, ombre bordeaux, image 4:3, onomatopée optionnelle.
   Avec href → <a> cliquable entière ; sans → <article>. */
interface Props {
  titre: string;
  texte?: string;
  img?: string;
  alt?: string;
  sfx?: string;
  tag?: string;
  href?: string;
  largeurs?: string; // srcset optionnel
}
const { titre, texte, img, alt = '', sfx, tag, href, largeurs } = Astro.props;
const Tag = href ? 'a' : 'article';
---
<Tag class="case" href={href}>
  {sfx && <span class="sfx" aria-hidden="true">{sfx}</span>}
  {img && (
    <div class="case__media">
      <img src={img} srcset={largeurs} sizes="(max-width: 600px) 92vw, (max-width: 960px) 46vw, 380px" alt={alt} width="960" height="720" loading="lazy" decoding="async" />
    </div>
  )}
  <div class="case__body">
    {tag && <span class="case__tag">{tag}</span>}
    <h3 class="case__titre">{titre}</h3>
    {texte && <p class="case__texte">{texte}</p>}
    <slot />
  </div>
</Tag>
```

- [ ] **Step 4 : Écrire `src/pages/mentions-legales.astro`**

```astro
---
import Base from '../layouts/Base.astro';
import TitleCard from '../components/TitleCard.astro';
import { IDENTITE } from '../data/site';
---
<Base title="Mentions légales — Daily Pop Society" description="Mentions légales du site dailypopsociety.be : éditeur, coordonnées, numéro de TVA, hébergement, crédits et vie privée. Aucun cookie, aucune donnée collectée.">
  <TitleCard kicker="Le générique de fin" variante="noir" letterbox>Mentions <em>légales</em></TitleCard>
  <section class="section">
    <div class="container container--narrow ml">
      <h2 class="titre titre--sm">Éditeur</h2>
      <p>{IDENTITE.nom} — {IDENTITE.rue}, {IDENTITE.codePostal} {IDENTITE.ville}, Belgique.<br />TVA {IDENTITE.tva} · <a href={`tel:${IDENTITE.telephoneIntl}`}>{IDENTITE.telephone}</a> · <a href={`mailto:${IDENTITE.email}`}>{IDENTITE.email}</a></p>
      <p class="ml__note">Raison sociale et forme juridique à confirmer par la gérante avant mise en ligne.</p>
      <h2 class="titre titre--sm">Hébergement</h2>
      <p>Site statique hébergé en Europe. Aucun compte utilisateur, aucune base de données.</p>
      <h2 class="titre titre--sm">Vie privée</h2>
      <p>Ce site ne pose aucun cookie et ne collecte aucune donnée personnelle. Les liens vers Instagram, Facebook et Google Maps mènent vers des services tiers soumis à leurs propres règles.</p>
      <h2 class="titre titre--sm">Crédits</h2>
      <p>Logo et logos mensuels : Daily Pop Society. Illustrations de la carte et de la galerie : créations pour le site, à titre d'illustration. Les licences citées (films, séries, mangas, jeux) appartiennent à leurs ayants droit et sont mentionnées à titre de thème d'événement.</p>
    </div>
  </section>
</Base>
<style>
  .ml h2 { margin-top: 40px; }
  .ml h2:first-child { margin-top: 0; }
  .ml p { margin-top: 12px; color: var(--gris); line-height: 1.65; }
  .ml__note { font-family: var(--font-hand); font-size: 1.25rem; color: var(--bdx); }
</style>
```

- [ ] **Step 5 : Faire utiliser TitleCard à `404.astro` (remplacer la `<section class="tc …">` par `<TitleCard kicker="Erreur 404" variante="noir" letterbox>Cette page n'existe pas<br /><em>dans ce multivers.</em><Fragment slot="copy">Mauvaise dimension, mauvaise URL. Repars de l'accueil, ou va voir ce qu'il se passe ce mois-ci.</Fragment><Fragment slot="actions"><a class="btn" href="/">Retour à l'accueil</a><a class="btn btn--ghost" href="/events/">Les events</a></Fragment></TitleCard>`) et retirer le `<style>` devenu inutile.**

- [ ] **Step 6 : Build + contrôle + capture de `/mentions-legales/`, lecture, commit**

Run : `pnpm test` → Expected : `✓ verifier : 3 pages contrôlées, aucun écart`. Capture browse de `/mentions-legales/` en 1440 et lecture.

```bash
git add scripts/verifier.mjs src
git commit -m "feat: composants TitleCard et Case, page mentions légales"
```

---

### Task 5 : Le générique — hero signature (scrub desktop, intro mobile, statique sinon)

**Files:**
- Create: `src/components/Generique.astro`
- Modify: `src/pages/index.astro`

- [ ] **Step 1 : Écrire `src/components/Generique.astro` (markup + CSS)**

```astro
---
/* ===== LE GÉNÉRIQUE =====
   L'intro Marvel Studios avec les vrais logos mensuels du bar : deux bandes
   obliques de cases défilent, « DAILY POP » se remplit du défilé puis se fige
   en blanc, « SOCIETY » se compose, la title card du mois apparaît.
   Desktop : scène épinglée, scrubée au scroll (rejouable). Mobile : intro
   courte au chargement. Sans JS / reduced-motion : état final statique. */
import { LOGOS, MONTAGE } from '../data/logos';
import { LICENCE_DU_MOIS, IDENTITE } from '../data/site';
const bande1 = LOGOS.filter((_, i) => i % 2 === 0);
const bande2 = LOGOS.filter((_, i) => i % 2 === 1);
---
<section class="gen letterbox" id="generique" aria-label="Daily Pop Society, le bar pop culture de Charleroi">
  <div class="gen__grain" aria-hidden="true"></div>
  <p class="gen__presente">Daily Pop Society présente</p>

  <div class="gen__bande gen__bande--1" aria-hidden="true">
    <div class="gen__piste">
      {[...bande1, ...bande1].map((l) => <img src={l.src} alt="" width="160" height="160" loading="eager" decoding="async" />)}
    </div>
  </div>

  <h1 class="gen__titre">
    <span class="gen__nom">
      <span class="gen__nom-fill" aria-hidden="true" style={`background-image: url(${MONTAGE.src})`}>Daily Pop</span>
      <span class="gen__nom-blanc">Daily Pop</span>
    </span>
    <span class="gen__society">Society</span>
  </h1>

  <div class="gen__bande gen__bande--2" aria-hidden="true">
    <div class="gen__piste">
      {[...bande2, ...bande2].map((l) => <img src={l.src} alt="" width="160" height="160" loading="eager" decoding="async" />)}
    </div>
  </div>

  <div class="gen__pied">
    <p class="gen__scroll" aria-hidden="true"><span></span>Scroll pour lancer le générique</p>
    <a class="gen__carte" href="/events/">Ce mois-ci · <b>{LICENCE_DU_MOIS.nom}</b> · {LICENCE_DU_MOIS.dates}</a>
    <p class="gen__lieu">{IDENTITE.ville} · Terre-6000</p>
  </div>
</section>

<style>
  .gen {
    position: relative; overflow: hidden;
    height: 100svh; min-height: 620px;
    color: var(--blanc);
    background: radial-gradient(ellipse at 50% 60%, #9A2334 0%, var(--bdx) 45%, var(--bdx-deep) 100%);
  }
  .gen__grain {
    position: absolute; inset: 0; opacity: 0.16; pointer-events: none;
    background-image: radial-gradient(rgba(255, 255, 255, 0.35) 0.6px, transparent 0.8px);
    background-size: 4px 4px;
  }
  .gen__presente {
    position: absolute; left: 0; right: 0; top: clamp(96px, 15vh, 140px);
    text-align: center; font-size: 0.78rem; letter-spacing: 0.42em; text-transform: uppercase; opacity: 0.85;
  }
  .gen__bande {
    position: absolute; left: -12vw; right: -12vw;
    height: clamp(70px, 9vw, 130px);
    transform: skewX(-14deg);
    overflow: hidden;
  }
  .gen__bande--1 { top: 24%; }
  .gen__bande--2 { bottom: 22%; transform: skewX(12deg); opacity: 0.6; }
  .gen__piste { display: flex; gap: 8px; width: max-content; height: 100%; will-change: transform; }
  .gen__piste img { height: 100%; width: auto; aspect-ratio: 1; border: 2px solid rgba(255, 255, 255, 0.75); border-radius: 4px; background: var(--blanc); }
  .gen__titre {
    position: absolute; left: 0; right: 0; top: 50%; transform: translateY(-54%);
    text-align: center; font-family: var(--font-title); font-weight: 400; text-transform: uppercase; z-index: 2;
  }
  .gen__nom { display: block; position: relative; font-size: clamp(4.4rem, 15vw, 15rem); line-height: 0.86; letter-spacing: 0.02em; }
  .gen__nom-fill {
    position: absolute; inset: 0; opacity: 0;
    background-size: auto 100%; background-repeat: repeat-x; background-position: 0 0;
    -webkit-background-clip: text; background-clip: text; color: transparent;
    -webkit-text-stroke: 1px rgba(255, 255, 255, 0.5);
  }
  .gen__nom-blanc { position: relative; color: var(--blanc); filter: drop-shadow(0 6px 0 rgba(0, 0, 0, 0.18)); }
  .gen__society { display: block; margin-top: 0.35em; font-size: clamp(1.3rem, 3.6vw, 2.6rem); letter-spacing: 0.6em; text-indent: 0.6em; }
  .gen__pied {
    position: absolute; left: var(--gutter); right: var(--gutter); bottom: clamp(34px, 5vh, 48px);
    display: flex; justify-content: space-between; align-items: flex-end; gap: 16px; z-index: 3;
    font-size: 0.7rem; letter-spacing: 0.2em; text-transform: uppercase;
  }
  .gen__scroll { display: flex; flex-direction: column; align-items: center; gap: 6px; opacity: 0.75; font-size: 0.62rem; }
  .gen__scroll span { display: block; width: 1px; height: 28px; background: var(--blanc); }
  .gen__carte {
    font-family: var(--font-title); font-size: clamp(0.9rem, 1.4vw, 1.15rem); letter-spacing: 0.14em;
    border: 1.5px solid var(--blanc); padding: 8px 16px; background: rgba(0, 0, 0, 0.25);
    color: var(--blanc); text-decoration: none; text-align: center;
  }
  .gen__carte b { color: var(--rose); font-weight: 400; }
  .gen__carte:hover { background: var(--blanc); color: var(--noir); }
  .gen__carte:hover b { color: var(--bdx); }
  .gen__lieu { opacity: 0.8; }
  @media (max-width: 600px) {
    .gen__scroll, .gen__lieu { display: none; }
    .gen__pied { justify-content: center; }
    .gen__bande--1 { top: 20%; } .gen__bande--2 { bottom: 18%; }
  }
  /* Pré-paint (class js-intro posée avant le premier rendu par index.astro) :
     les éléments que GSAP fait entrer partent invisibles — aucun flash. */
  :global(html.js-intro) .gen__nom-blanc,
  :global(html.js-intro) .gen__society,
  :global(html.js-intro) .gen__carte { opacity: 0; }
</style>
```

- [ ] **Step 2 : Ajouter le script d'animation dans le même fichier `src/components/Generique.astro` (après le `<style>`)**

```astro
<script>
  import { REDUCED, isDesktop, loadGsap } from '../lib/motion';

  if (!REDUCED && document.documentElement.classList.contains('js-intro')) {
    loadGsap().then(({ gsap, ScrollTrigger }) => {
      const gen = document.querySelector<HTMLElement>('.gen');
      if (!gen) return;
      const pistes = gen.querySelectorAll('.gen__piste');
      const bandes = gen.querySelectorAll('.gen__bande');
      const fill = gen.querySelector('.gen__nom-fill');
      const blanc = gen.querySelector('.gen__nom-blanc');
      const society = gen.querySelector('.gen__society');
      const carte = gen.querySelector('.gen__carte');
      const presente = gen.querySelector('.gen__presente');
      const scroll = gen.querySelector('.gen__scroll');

      /* Les trois temps du générique, en fractions de la timeline (0 → 1) :
         1. 0 → 0.40  les bandes défilent, de plus en plus vite
         2. 0.28 → 0.72  « DAILY POP » se remplit du défilé puis se fige en blanc
         3. 0.72 → 1  « SOCIETY » se compose, les bandes s'estompent, title card */
      const composer = (tl: gsap.core.Timeline, mobile: boolean) => {
        const d = mobile ? 2.6 : 1; // durée totale : secondes en mobile, fraction en scrub
        tl.to(pistes, { xPercent: -50, duration: d, ease: mobile ? 'power2.inOut' : 'power1.in' }, 0)
          .to(presente, { opacity: 0, y: -20, duration: 0.1 * d }, 0.25 * d)
          .fromTo(fill, { opacity: 0 }, { opacity: 1, duration: 0.12 * d }, 0.28 * d)
          .fromTo(fill, { backgroundPositionX: '0px' }, { backgroundPositionX: '-1600px', duration: 0.5 * d, ease: 'none' }, 0.28 * d)
          .fromTo(blanc, { opacity: 0 }, { opacity: 1, duration: 0.1 * d }, 0.64 * d)
          .to(fill, { opacity: 0, duration: 0.08 * d }, 0.68 * d)
          .fromTo(society, { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: 0.1 * d }, 0.72 * d)
          .to(bandes, { opacity: 0.22, duration: 0.15 * d }, 0.78 * d)
          .fromTo(carte, { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: 0.1 * d }, 0.86 * d)
          .to(scroll, { opacity: 0, duration: 0.06 * d }, 0.9 * d);
      };

      if (isDesktop()) {
        /* Desktop : scène épinglée, scrubée. end = 250 % de hauteur de viewport. */
        const tl = gsap.timeline({
          defaults: { ease: 'power2.out' },
          scrollTrigger: { trigger: gen, start: 'top top', end: '+=250%', scrub: 0.6, pin: true, anticipatePin: 1 },
        });
        composer(tl, false);
        /* Duo obligatoire après chaque création de pin (cf. motion.ts) */
        ScrollTrigger.sort();
        ScrollTrigger.refresh();
      } else {
        /* Mobile / tablette : intro courte au chargement, pas de pin (fragile au tactile) */
        composer(gsap.timeline({ defaults: { ease: 'power3.out' } }), true);
      }

      /* GSAP a posé tous les états initiaux : le pré-paint peut tomber. */
      clearTimeout((window as any).__introSecours);
      document.documentElement.classList.remove('js-intro');
    });
  }
</script>
```

- [ ] **Step 3 : Intégrer dans `src/pages/index.astro` (pré-paint inline + Generique à la place de la title card)**

```astro
---
import Base from '../layouts/Base.astro';
import Generique from '../components/Generique.astro';
import Horaires from '../components/Horaires.astro';
---
<Base title="Daily Pop Society — Bar pop culture à Charleroi" description="Food, drinks, fandom : cocktails à personnages, burgers, bubble teas, events mensuels, blind tests et JDR au cœur de Charleroi. Cosplay bienvenu, tout le temps.">
  <!-- Pré-paint : pose l'état « avant générique » AVANT le premier rendu (jamais de flash).
       Garde-fou : si GSAP ne démarre pas en 3 s, tout s'affiche en statique. -->
  <script is:inline>
    if (!matchMedia('(prefers-reduced-motion: reduce)').matches) {
      document.documentElement.classList.add('js-intro');
      window.__introSecours = setTimeout(function () {
        document.documentElement.classList.remove('js-intro');
      }, 3000);
    }
  </script>
  <Generique />
  <section class="section feuille" style="background: var(--blanc)">
    <div class="container">
      <span class="kicker">Ouvertures</span>
      <h2 class="titre titre--md">Quand passer <em>nous voir</em></h2>
      <div style="margin-top: 28px"><Horaires /></div>
    </div>
  </section>
</Base>
```

- [ ] **Step 4 : Build + contrôle**

Run : `pnpm test` → Expected : `✓ verifier : 3 pages contrôlées, aucun écart`. Vérifier aussi que `dist/index.html` contient `Daily Pop Society présente` et 56 `<img` de logos (`grep -o '/media/logos/' dist/index.html | wc -l` → 57 avec le montage).

- [ ] **Step 5 : Boucle visuelle du générique — 4 positions de scroll desktop, mobile, lecture des captures**

```bash
B="$HOME/.claude/skills/gstack/browse/dist/browse"; S="<scratchpad>"
echo '[["viewport","1440x900"],["goto","http://localhost:4332/"],["wait","--networkidle"],["screenshot","'"$S/gen-0.png"'","--viewport"],["js","window.scrollTo(0, 700)"],["wait","--networkidle"],["screenshot","'"$S/gen-1.png"'","--viewport"],["js","window.scrollTo(0, 1500)"],["screenshot","'"$S/gen-2.png"'","--viewport"],["js","window.scrollTo(0, 2300)"],["screenshot","'"$S/gen-3.png"'","--viewport"],["js","window.scrollTo(0, 3200)"],["screenshot","'"$S/gen-4.png"'","--viewport"]]' | "$B" chain
echo '[["viewport","375x812"],["goto","http://localhost:4332/"],["wait","--networkidle"],["screenshot","'"$S/gen-mobile.png"'","--viewport"]]' | "$B" chain
```
Lire les six captures. Attendu : gen-0 = « présente » + bandes, nom invisible ; gen-1 = bandes en mouvement ; gen-2 = « DAILY POP » rempli de logos ; gen-3 = nom blanc + SOCIETY + title card ; gen-4 = la section horaires arrive par la feuille arrondie ; gen-mobile = état final (intro jouée) avec title card centrée. Si le pin « saute » ou si la section suivante chevauche, vérifier `ScrollTrigger.refresh()` et la hauteur `100svh`. Pour la capture mobile, l'intro dure 2,6 s : faire la chaîne `viewport` + `goto` + `wait`, puis `sleep 3` dans le shell, puis une chaîne séparée avec seulement `["screenshot", …, "--viewport"]` (le daemon garde la page ouverte entre deux chaînes).

- [ ] **Step 6 : Commit**

```bash
git add src
git commit -m "feat: le générique — hero épinglé scrubé au scroll, intro mobile, statique sans JS"
```

---

### Task 6 : Illustrations générées (Kie nano-banana-pro) et conversion WebP

Décision validée par l'utilisateur (spec §7) : une dizaine d'illustrations cel-shadées, environ 0,44 $ pour 11 images à 0,04 $. Sous le seuil de 0,50 $ de confirmation du socle mediagen-core ; ne PAS régénérer une image déjà sur disque (« le cache est de l'argent déjà dépensé »).

**Files:**
- Create: `scripts/illustrations.txt`, `scripts/illustrations.sh`, `scripts/webp.mjs`, `brief/illu-src/*.png` (hors git), `public/media/illu/*.webp`

- [ ] **Step 1 : Préflight Kie (clé + solde), sans rien générer**

```bash
[ -n "$KIE_API_KEY" ] && echo "KIE_API_KEY: presente" || echo "KIE_API_KEY: ABSENTE"
curl -sS --max-time 5 -H "Authorization: Bearer $KIE_API_KEY" "https://api.kie.ai/api/v1/chat/credit"
```
Expected : `presente` et `{"code":200,"data":<crédits>}` avec un solde > 0. Sinon arrêt : demander la clé ou un rechargement à l'utilisateur.

- [ ] **Step 2 : Écrire `scripts/illustrations.txt` (une ligne = `id|sujet`, le style commun est dans le script)**

```
cocktail-zoro|a tall green cocktail in a highball glass with three lime wedges arranged like blades, ice cubes, a black straw
mocktail-fraise|a red strawberry and basil mocktail in a coupe glass with a paper straw and a strawberry on the rim
bubble-tea|a mango bubble tea in a clear cup with black tapioca pearls and a wide yellow straw
cafe-latte|a latte in a black ceramic cup with star-shaped latte art on a saucer
burger-hokage|a tall stacked cheeseburger with melted cheddar, crispy onions and dripping sauce on a wooden board
starters|a sharing board with nachos, dips, mini spring rolls and chicken bites
patisserie|a slice of cheesecake with red berry coulis on a small black plate with a fork
blind-test|a vintage microphone on a stand under a burgundy neon spotlight, small stage
jdr|a tabletop role-playing game scene: dice, character sheets, a candle and a small wooden token on a dark table
coin-gaming|two game controllers on a small couch next to a shelf full of manga volumes and pop figures
comptoir|a cozy bar counter with shelves of manga, pop culture figures and a chalkboard, warm light
```

- [ ] **Step 3 : Écrire `scripts/illustrations.sh`**

```bash
#!/usr/bin/env bash
# Génère les illustrations manquantes via Kie (nano-banana-pro, famille Jobs).
# - Une image déjà présente dans brief/illu-src/ n'est JAMAIS regénérée.
# - Un échec unitaire ne fait pas échouer le lot : on log et on continue.
# - Aucun retry sur une tâche créée (retenter = repayer).
set -u
cd "$(dirname "$0")/.."
[ -n "${KIE_API_KEY:-}" ] || { echo "KIE_API_KEY absente" >&2; exit 1; }
mkdir -p brief/illu-src
STYLE="Clean cel-shaded cartoon illustration, anime-inspired sticker style, bold black outlines, flat colors with subtle cel shading, centered subject on a plain off-white background, color palette: deep burgundy red, black, cream and white with one small accent color. No text, no letters, no logo, no watermark, no photorealism, no human faces."
API="https://api.kie.ai/api/v1"
ok=0; ko=0
while IFS='|' read -r id sujet; do
  [ -z "$id" ] && continue
  out="brief/illu-src/$id.png"
  if [ -s "$out" ]; then echo "= $id : déjà présent, on garde"; continue; fi
  body=$(python3 -c 'import json,sys; print(json.dumps({"model":"nano-banana-pro","input":{"prompt":sys.argv[1]+" "+sys.argv[2],"aspect_ratio":"4:3","resolution":"1K","output_format":"png"}}))' "$STYLE" "$sujet")
  task=$(curl -sS --max-time 30 -X POST "$API/jobs/createTask" -H "Authorization: Bearer $KIE_API_KEY" -H "Content-Type: application/json" -d "$body" | python3 -c 'import json,sys; d=json.load(sys.stdin); print(d.get("data",{}).get("taskId","") if d.get("code")==200 else "")')
  if [ -z "$task" ]; then echo "✗ $id : création de tâche refusée" >&2; ko=$((ko+1)); continue; fi
  url=""
  for i in $(seq 1 40); do
    sleep 6
    rep=$(curl -sS --max-time 20 -H "Authorization: Bearer $KIE_API_KEY" "$API/jobs/recordInfo?taskId=$task")
    etat=$(printf '%s' "$rep" | python3 -c 'import json,sys; print(json.load(sys.stdin).get("data",{}).get("state",""))' 2>/dev/null || echo "")
    if [ "$etat" = "success" ]; then
      url=$(printf '%s' "$rep" | python3 -c 'import json,sys; d=json.load(sys.stdin)["data"]; print((json.loads(d.get("resultJson") or "{}").get("resultUrls") or [""])[0])')
      break
    elif [ "$etat" = "fail" ]; then
      echo "✗ $id : échec Kie : $(printf '%s' "$rep" | head -c 300)" >&2; break
    fi
  done
  if [ -n "$url" ] && curl -sS --max-time 60 -o "$out" "$url" && [ -s "$out" ]; then echo "✓ $id"; ok=$((ok+1)); else rm -f "$out"; echo "✗ $id : pas de résultat" >&2; ko=$((ko+1)); fi
done < scripts/illustrations.txt
echo "récap : $ok générées, $ko en échec"
```

- [ ] **Step 4 : Écrire `scripts/webp.mjs`**

```js
// brief/illu-src/<id>.png → public/media/illu/<id>-{480,960,1440}.webp (4:3 recadré)
import sharp from 'sharp';
import { readdirSync, mkdirSync } from 'node:fs';
mkdirSync('public/media/illu', { recursive: true });
const LARGEURS = [480, 960, 1440];
for (const f of readdirSync('brief/illu-src').filter((n) => n.endsWith('.png'))) {
  const id = f.replace(/\.png$/, '');
  for (const w of LARGEURS) {
    await sharp(`brief/illu-src/${f}`).resize(w, Math.round((w * 3) / 4), { fit: 'cover' }).webp({ quality: 82 }).toFile(`public/media/illu/${id}-${w}.webp`);
  }
  console.log('✓', id);
}
```

- [ ] **Step 5 : Générer (≈ 11 × 0,04 $), convertir, contrôler visuellement**

Run : `bash scripts/illustrations.sh && node scripts/webp.mjs && ls -la public/media/illu | head -40`
Expected : `récap : 11 générées, 0 en échec`, 33 WebP (chaque `-1440` < 300 Ko). Lire les 11 PNG de `brief/illu-src/` avec Read : style cohérent (contours noirs, fond clair, palette bordeaux), aucun texte incrusté, aucun visage. Une image hors style : supprimer son PNG et relancer le script (seule celle-là est regénérée, 0,04 $). Piège connu : la modération rejette parfois des scènes bénignes ; retenter une fois, sinon reformuler le sujet sans les mots `kid/child/baby/powder/petal`.

- [ ] **Step 6 : Commit (les WebP entrent dans le dépôt ; les PNG sources restent dans brief/)**

```bash
git add scripts/illustrations.txt scripts/illustrations.sh scripts/webp.mjs public/media/illu
git commit -m "feat: 11 illustrations cel-shadées (Kie nano-banana-pro) en WebP 3 tailles"
```

---

### Task 7 : Accueil complet — cases, licence du mois, horaires, scène post-générique

**Files:**
- Modify: `src/pages/index.astro`

- [ ] **Step 1 : Écrire la version finale de `src/pages/index.astro`**

```astro
---
import Base from '../layouts/Base.astro';
import Generique from '../components/Generique.astro';
import Case from '../components/Case.astro';
import Horaires from '../components/Horaires.astro';
import { IDENTITE, LICENCE_DU_MOIS } from '../data/site';

const illu = (id: string) => ({
  img: `/media/illu/${id}-960.webp`,
  largeurs: `/media/illu/${id}-480.webp 480w, /media/illu/${id}-960.webp 960w, /media/illu/${id}-1440.webp 1440w`,
});
---
<Base title="Daily Pop Society — Bar pop culture à Charleroi" description="Food, drinks, fandom : cocktails à personnages, burgers, bubble teas, events mensuels, blind tests et JDR au cœur de Charleroi. Cosplay bienvenu, tout le temps.">
  <script is:inline>
    if (!matchMedia('(prefers-reduced-motion: reduce)').matches) {
      document.documentElement.classList.add('js-intro');
      window.__introSecours = setTimeout(function () {
        document.documentElement.classList.remove('js-intro');
      }, 3000);
    }
  </script>
  <Generique />

  <!-- ===== CHAPITRE 1 : les trois cases ===== -->
  <section class="section section--trame feuille chap">
    <div class="container">
      <span class="kicker">Chapitre 1</span>
      <h2 class="titre titre--md">Food. Drinks. <em>Fandom.</em></h2>
      <p class="copy">Ton repaire pop culture à Charleroi. On parle entre potes, on vient en costume quand on veut, et chaque mois une licence prend le pouvoir sur la carte.</p>
      <div class="grille grille--3 chap__grille" data-reveal data-reveal-stagger>
        <Case href="/la-carte/" tag="La carte" titre="Cocktails à personnages, burgers signature" texte="Bubble teas, mocktails, cafés, starters et pâtisseries : une carte qui change avec la licence du mois." sfx="Slurp !" alt="Illustration : un cocktail vert aux trois lames de citron vert" {...illu('cocktail-zoro')} />
        <Case href="/events/" tag="Les events" titre="Une licence par mois, des soirées chaque semaine" texte="Blind test pop culture deux fois par mois, JDR sur réservation, animations le week-end." sfx="Pop !" alt="Illustration : un micro vintage sous un néon bordeaux" {...illu('blind-test')} />
        <Case href="/a-propos/" tag="Le fandom" titre="Mangas, jeux, coin gaming, cosplay bienvenu" texte="Mangas, comics, jeux de société et coin gaming Switch / PS4 à dispo pour tous ceux qui consomment." sfx="Crunch !" alt="Illustration : deux manettes sur un canapé devant une étagère de mangas" {...illu('coin-gaming')} />
      </div>
    </div>
  </section>

  <!-- ===== LA LICENCE DU MOIS ===== -->
  <section class="section section--noir letterbox mois">
    <div class="container mois__grid">
      <div>
        <span class="kicker">Ce mois-ci</span>
        <h2 class="titre">{LICENCE_DU_MOIS.nom}</h2>
        <p class="copy">{LICENCE_DU_MOIS.accroche} Carte éphémère, déco, soirées : {LICENCE_DU_MOIS.dates}.</p>
        <div class="actions"><a class="btn" href="/events/">Voir le programme</a></div>
      </div>
      <p class="mois__hand hand" aria-hidden="true">imaginé par Rachel, alias l'Hokage</p>
    </div>
  </section>

  <!-- ===== HORAIRES + ADRESSE ===== -->
  <section class="section ouv">
    <div class="container ouv__grid">
      <div>
        <span class="kicker">Ouvertures</span>
        <h2 class="titre titre--md">Quand passer <em>nous voir</em></h2>
        <div style="margin-top: 28px"><Horaires /></div>
      </div>
      <div class="ouv__adresse">
        <p class="ouv__rue">{IDENTITE.rue}<br />{IDENTITE.codePostal} {IDENTITE.ville}</p>
        <p class="ouv__lieu">Au cœur de Charleroi, sur le quai. Terre-6000.</p>
        <div class="actions">
          <a class="btn btn--blanc" href={IDENTITE.itineraire} target="_blank" rel="noopener">Itinéraire</a>
          <a class="link-arrow" href="/contact/">Nous contacter</a>
        </div>
      </div>
    </div>
  </section>

  <!-- ===== SCÈNE POST-GÉNÉRIQUE ===== -->
  <section class="section section--noir post">
    <div class="container container--narrow center">
      <span class="kicker">Scène post-générique</span>
      <h2 class="titre titre--md">Pourquoi Nakama's Coffee est devenu <em>Daily Pop Society</em></h2>
      <p class="copy copy--center">Un café manga né en avril 2024, une communauté qui a grandi plus vite que les murs, et un nom qui devait s'ouvrir à toute la pop culture. L'histoire, en bas de la page, comme la scène cachée après le générique.</p>
      <div class="actions actions--center"><a class="btn" href="/a-propos/">Lire l'histoire</a></div>
    </div>
  </section>
</Base>

<style>
  .chap__grille { margin-top: 44px; }
  .mois__grid { display: grid; grid-template-columns: 1.4fr 1fr; gap: 40px; align-items: end; }
  .mois__hand { justify-self: end; transform: rotate(-4deg); font-size: 1.9rem; }
  .ouv__grid { display: grid; grid-template-columns: 1.2fr 1fr; gap: clamp(32px, 6vw, 80px); align-items: start; }
  .ouv__adresse { padding: 28px; border: var(--bord); box-shadow: var(--ombre-case); background: var(--creme); }
  .ouv__rue { font-family: var(--font-title); font-size: 1.8rem; line-height: 1.05; text-transform: uppercase; }
  .ouv__lieu { margin-top: 12px; color: var(--gris); }
  .post .copy { margin-inline: auto; }
  @media (max-width: 960px) { .mois__grid, .ouv__grid { grid-template-columns: 1fr; } .mois__hand { justify-self: start; } }
</style>
```

- [ ] **Step 2 : Build + contrôle + captures desktop/tablette/mobile de la page entière, lecture**

Run : `pnpm test` (attendu : aucun écart, notamment aucune image sans `alt` et tous les `/media/illu/*` présents). Puis `echo '[["goto","http://localhost:4332/"],["wait","--networkidle"],["responsive","<scratchpad>/t7"]]' | "$B" chain` et lire `t7-desktop.png`, `t7-tablet.png`, `t7-mobile.png`. Attendu : cases avec ombre bordeaux et onomatopée, aucune grille cassée, texte lisible sur noir.

- [ ] **Step 3 : Commit**

```bash
git add src
git commit -m "feat: accueil — trois cases, licence du mois, horaires et adresse, scène post-générique"
```

---

### Task 8 : La carte — données de démo et page

**Files:**
- Create: `src/data/carte.ts`, `src/pages/la-carte.astro`
- Modify: `scripts/verifier.mjs` (PAGES)

- [ ] **Step 1 : Ajouter `'la-carte/index.html'` à `PAGES` dans `scripts/verifier.mjs`, lancer `pnpm test` → Expected : `page absente : la-carte/index.html`**

- [ ] **Step 2 : Écrire `src/data/carte.ts` (CARTE DE DÉMONSTRATION — à remplacer par la vraie carte)**

```ts
/* CARTE DE DÉMONSTRATION. Le dossier « Menu » du brief n'a pas été fourni :
   noms, descriptions et prix sont fictifs mais plausibles. Remplacer ici,
   les pages se mettent à jour seules. */
export type Item = { nom: string; desc: string; prix: string; tags?: ('végé' | 'sans alcool' | 'signature')[] };
export type Categorie = { slug: string; nom: string; intro: string; items: Item[] };

export const EPHEMERE = {
  licence: 'Daily Pop Coven',
  intro: 'La carte éphémère du mois : des créations inspirées des sorcières que tout le monde attend.',
  items: [
    { nom: 'Le Sabbat', desc: 'gin, mûre, romarin fumé, tonic noir', prix: '10 €', tags: ['signature'] },
    { nom: "Potion d'Agatha", desc: 'mocktail cassis, citron vert, basilic, perles de fruit', prix: '7 €', tags: ['sans alcool'] },
    { nom: 'Burger Hocus Pocus', desc: 'bœuf, cheddar fumé, oignons caramélisés, sauce chipotle', prix: '15 €' },
  ] as Item[],
};

export const CATEGORIES: Categorie[] = [
  {
    slug: 'cocktails', nom: 'Cocktails', intro: 'Des cocktails créés d\'après les personnages : leur caractère dans le verre.',
    items: [
      { nom: 'Le Zoro', desc: 'gin, yuzu, basilic, trois lames de citron vert', prix: '9 €', tags: ['signature'] },
      { nom: 'Le Stark', desc: 'whisky, miel, gingembre, twist d\'orange', prix: '10 €' },
      { nom: 'La Poudlard', desc: 'rhum épicé, pomme, cannelle, mousse de caramel', prix: '9,50 €' },
      { nom: 'Le Multivers', desc: 'vodka, litchi, fruit du dragon, crème de violette', prix: '10 €' },
    ],
  },
  {
    slug: 'mocktails', nom: 'Mocktails', intro: 'Les mêmes univers, sans alcool.',
    items: [
      { nom: 'Le Totoro', desc: 'concombre, menthe, citron vert, eau pétillante', prix: '6,50 €', tags: ['sans alcool'] },
      { nom: 'Le Pikachu', desc: 'mangue, passion, gingembre, jus de citron', prix: '6,50 €', tags: ['sans alcool'] },
      { nom: 'La Fraise Sailor', desc: 'fraise, basilic, sirop de rose, tonic', prix: '6,50 €', tags: ['sans alcool'] },
    ],
  },
  {
    slug: 'bubble-teas', nom: 'Bubble teas', intro: 'Perles de tapioca ou perles de fruit, chaud ou glacé.',
    items: [
      { nom: 'Mangue passion', desc: 'thé vert, perles passion', prix: '6 €', tags: ['sans alcool'] },
      { nom: 'Taro', desc: 'lait, taro, perles de tapioca', prix: '6 €', tags: ['sans alcool'] },
      { nom: 'Matcha', desc: 'thé matcha, lait d\'avoine, perles brown sugar', prix: '6,50 €', tags: ['sans alcool'] },
    ],
  },
  {
    slug: 'cafes', nom: 'Cafés & boissons chaudes', intro: 'Depuis l\'époque Nakama\'s Coffee, on prend le café au sérieux.',
    items: [
      { nom: 'Espresso', desc: 'arabica torréfié en Belgique', prix: '2,50 €', tags: ['sans alcool'] },
      { nom: 'Latte de l\'Hokage', desc: 'latte, sirop de sésame noir, latte art étoile', prix: '4,50 €', tags: ['sans alcool'] },
      { nom: 'Chocolat chaud Butterbeer', desc: 'chocolat, caramel beurre salé, chantilly', prix: '5 €', tags: ['sans alcool'] },
    ],
  },
  {
    slug: 'starters', nom: 'Starters', intro: 'À partager, ou pas.',
    items: [
      { nom: 'Nachos Nakama', desc: 'cheddar fondu, guacamole, pico de gallo, jalapeños', prix: '9 €', tags: ['végé'] },
      { nom: 'Chicken pop', desc: 'bouchées de poulet croustillant, sauce sriracha-miel', prix: '8,50 €' },
      { nom: 'Rouleaux du dragon', desc: 'mini rouleaux de printemps, sauce sweet chili', prix: '7,50 €', tags: ['végé'] },
    ],
  },
  {
    slug: 'burgers', nom: 'Burgers', intro: 'Pain brioché, frites maison, et une sauce qui a un nom.',
    items: [
      { nom: 'Burger Hokage', desc: 'bœuf, cheddar, sauce ramen, oignons crispy', prix: '15 €', tags: ['signature'] },
      { nom: 'Burger Vador', desc: 'pain noir, bœuf, bacon, cheddar fumé, sauce BBQ', prix: '15,50 €' },
      { nom: 'Burger Kirby', desc: 'galette de pois chiches, chèvre, miel, roquette', prix: '14 €', tags: ['végé'] },
      { nom: 'Burger Goku', desc: 'double bœuf, double cheddar, sauce spicy Super Saiyan', prix: '17 €' },
    ],
  },
  {
    slug: 'patisseries', nom: 'Pâtisseries', intro: 'Faites maison, elles changent avec la licence du mois.',
    items: [
      { nom: 'Cheesecake Spider', desc: 'coulis de fruits rouges en toile', prix: '6 €', tags: ['végé'] },
      { nom: 'Cookie Cookie Monster', desc: 'triple chocolat, cœur fondant', prix: '3,50 €', tags: ['végé'] },
      { nom: 'Mochi du mois', desc: 'trois mochis glacés, parfums selon la licence', prix: '6,50 €', tags: ['végé'] },
    ],
  },
];
```

- [ ] **Step 3 : Écrire `src/pages/la-carte.astro`**

```astro
---
import Base from '../layouts/Base.astro';
import TitleCard from '../components/TitleCard.astro';
import { EPHEMERE, CATEGORIES } from '../data/carte';
const illu = (id: string) => `/media/illu/${id}-960.webp`;
const visuels: Record<string, { src: string; alt: string }> = {
  cocktails: { src: illu('cocktail-zoro'), alt: 'Illustration : cocktail vert aux trois lames de citron vert' },
  mocktails: { src: illu('mocktail-fraise'), alt: 'Illustration : mocktail fraise basilic' },
  'bubble-teas': { src: illu('bubble-tea'), alt: 'Illustration : bubble tea mangue aux perles de tapioca' },
  cafes: { src: illu('cafe-latte'), alt: 'Illustration : latte avec un latte art en étoile' },
  starters: { src: illu('starters'), alt: 'Illustration : planche de nachos et bouchées à partager' },
  burgers: { src: illu('burger-hokage'), alt: 'Illustration : burger signature au cheddar fondant' },
  patisseries: { src: illu('patisserie'), alt: 'Illustration : part de cheesecake au coulis de fruits rouges' },
};
---
<Base title="La carte — Daily Pop Society, bar pop culture à Charleroi" description="Cocktails à personnages, mocktails, bubble teas, cafés, starters, burgers signature et pâtisseries maison. Chaque mois, une carte éphémère inspirée de la licence à l'honneur.">
  <TitleCard kicker="Chapitre 1 · La carte" variante="creme">Food. <em>Drinks.</em><br />Et une sauce qui a un nom.<Fragment slot="copy">Chaque boisson est créée d'après un personnage. Chaque mois, une licence prend le pouvoir sur la carte. Et oui, il y a des burgers.</Fragment></TitleCard>

  <nav class="ancres" aria-label="Catégories de la carte">
    <div class="container ancres__liste">
      <a href="#ephemere">Ce mois-ci</a>
      {CATEGORIES.map((c) => <a href={`#${c.slug}`}>{c.nom}</a>)}
    </div>
  </nav>

  <section class="section section--noir letterbox" id="ephemere">
    <div class="container">
      <span class="kicker">Carte éphémère · {EPHEMERE.licence}</span>
      <h2 class="titre titre--md">Ce mois-ci, <em>en édition limitée</em></h2>
      <p class="copy">{EPHEMERE.intro}</p>
      <ul class="eph" data-reveal data-reveal-stagger>
        {EPHEMERE.items.map((it) => (
          <li class="eph__item">
            <p class="eph__nom">{it.nom}</p>
            <p class="eph__desc">{it.desc}</p>
            <p class="eph__prix">{it.prix}</p>
          </li>
        ))}
      </ul>
    </div>
  </section>

  {CATEGORIES.map((c, i) => (
    <section class:list={['section', 'cat', { 'section--creme': i % 2 === 1 }]} id={c.slug}>
      <div class="container cat__grid">
        <div class="cat__visuel" data-reveal>
          <img src={visuels[c.slug].src} alt={visuels[c.slug].alt} width="960" height="720" loading="lazy" decoding="async" />
        </div>
        <div>
          <span class="kicker">{String(i + 1).padStart(2, '0')}</span>
          <h2 class="titre titre--md">{c.nom}</h2>
          <p class="copy">{c.intro}</p>
          <ul class="cat__items">
            {c.items.map((it) => (
              <li class="ligne">
                <span class="ligne__nom">{it.nom}{it.tags?.map((t) => <span class="tag">{t}</span>)}<small>{it.desc}</small></span>
                <span class="ligne__points" aria-hidden="true"></span>
                <span class="ligne__prix">{it.prix}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  ))}

  <section class="section center">
    <div class="container container--narrow">
      <p class="hand" style="font-size: 1.6rem">Carte de démonstration : les vrais noms et les vrais prix arrivent avec la carte du shop.</p>
      <p class="copy copy--center">Allergènes et options sur demande au comptoir. Les extras (mangas, jeux, coin gaming) sont offerts à qui consomme.</p>
    </div>
  </section>
</Base>

<style>
  .ancres { position: sticky; top: 0; z-index: 30; background: var(--noir); color: var(--blanc); border-bottom: 2px solid var(--bdx); }
  .ancres__liste { display: flex; gap: 22px; overflow-x: auto; padding-block: 12px; scrollbar-width: none; }
  .ancres__liste a { white-space: nowrap; font-size: 0.74rem; font-weight: 700; letter-spacing: 0.18em; text-transform: uppercase; text-decoration: none; opacity: 0.8; }
  .ancres__liste a:hover { opacity: 1; color: var(--rose); }
  .eph { margin-top: 36px; display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; }
  .eph__item { border: 2px solid rgba(255, 255, 255, 0.35); padding: 22px; background: rgba(255, 255, 255, 0.04); }
  .eph__nom { font-family: var(--font-title); font-size: 1.5rem; text-transform: uppercase; letter-spacing: 0.04em; }
  .eph__desc { margin-top: 6px; color: rgba(255, 255, 255, 0.75); }
  .eph__prix { margin-top: 12px; font-family: var(--font-title); color: var(--rose); font-size: 1.3rem; }
  .cat__grid { display: grid; grid-template-columns: 0.9fr 1.3fr; gap: clamp(28px, 5vw, 70px); align-items: start; }
  .cat__visuel { border: var(--bord); box-shadow: var(--ombre-case); background: var(--blanc); position: sticky; top: 90px; }
  .cat__items { margin-top: 28px; display: grid; gap: 14px; }
  .ligne__nom small { display: block; font-weight: 400; color: var(--gris); font-size: 0.9rem; }
  .tag { display: inline-block; margin-left: 8px; padding: 1px 7px; border: 1.5px solid var(--bdx); color: var(--bdx); font-size: 0.62rem; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase; vertical-align: middle; }
  @media (max-width: 960px) { .cat__grid { grid-template-columns: 1fr; } .cat__visuel { position: static; max-width: 420px; } .eph { grid-template-columns: 1fr; } }
</style>
```

- [ ] **Step 4 : Build + contrôle (`pnpm test` → 4 pages, aucun écart) + captures responsive de `/la-carte/`, lecture, commit**

```bash
git add scripts/verifier.mjs src
git commit -m "feat: la carte — données de démo, carte éphémère du mois, sept catégories"
```

---

### Task 9 : Events — données, carte d'event, page

**Files:**
- Create: `src/data/events.ts`, `src/components/EventCard.astro`, `src/pages/events.astro`
- Modify: `scripts/verifier.mjs` (PAGES)

- [ ] **Step 1 : Ajouter `'events/index.html'` à `PAGES`, `pnpm test` → Expected : `page absente : events/index.html`**

- [ ] **Step 2 : Écrire `src/data/events.ts` (tout vient du brief du 06/08/2026)**

```ts
export type Evenement = {
  titre: string;
  quand: string;          // texte affiché
  mois: string;           // AAAA-MM pour le tri
  desc: string;
  visuel: string;         // /media/… (illustration d'ambiance en attendant les photos)
  alt: string;
  reservation?: boolean;  // sur réservation uniquement
  aPlanifier?: boolean;   // date à confirmer par la gérante
};

const illu = (id: string) => `/media/illu/${id}-960.webp`;

/* Les prochains events (une licence par mois) */
export const A_VENIR: Evenement[] = [
  { titre: 'Daily Pop Coven', quand: '21 octobre, puis du 28 au 31 octobre', mois: '2026-10', desc: 'Viens célébrer le sabbat que toutes les sorcières attendent : carte éphémère, déco et soirées à thème.', visuel: '/media/logos/2025-10-halloween.webp', alt: 'Logo mensuel Halloween de Daily Pop Society' },
  { titre: 'Tim Burton', quand: 'Novembre', mois: '2026-11', desc: 'Un mois entier dans l\'univers de Tim Burton. Dates à venir.', visuel: illu('comptoir'), alt: 'Illustration : le comptoir du bar', aPlanifier: true },
  { titre: 'Daily Pop Christmas', quand: 'Décembre', mois: '2026-12', desc: 'Les plus gros succès des fêtes de fin d\'année réunis, et le closing annuel du shop. Dates à venir.', visuel: '/media/logos/2024-12-noel.webp', alt: 'Logo mensuel de Noël', aPlanifier: true },
];

/* Les soirées récurrentes */
export const SOIREES: Evenement[] = [
  { titre: 'Blind test pop culture', quand: 'Deux fois par mois, le vendredi à 19h', mois: '', desc: 'Films, séries, animés, jeux vidéo : tu reconnais, tu buzzes, tu gagnes.', visuel: illu('blind-test'), alt: 'Illustration : un micro sous un néon bordeaux' },
  { titre: 'Soirée JDR', quand: 'Sur réservation, à 18h', mois: '', desc: 'Blood on the Clocktower et d\'autres jeux de rôle. Places limitées, réservation par téléphone ou Messenger.', visuel: illu('jdr'), alt: 'Illustration : dés, feuilles de personnage et bougie', reservation: true },
  { titre: 'Animations du week-end', quand: 'Chaque week-end', mois: '', desc: 'Quiz, rassemblements cosplay, tournois sur Switch et PS4 : le programme se dévoile sur Instagram.', visuel: illu('coin-gaming'), alt: 'Illustration : manettes et étagère de mangas' },
];

/* « Précédemment dans Daily Pop » — les events passés (photos à venir de la cliente) */
export const PASSES: Evenement[] = [
  { titre: 'Séries cultes', quand: 'Du 2 au 5 septembre 2026', mois: '2026-09', desc: 'Quatre jours axés sur les séries et sitcoms cultes des années 2000.', visuel: illu('comptoir'), alt: 'Illustration d\'ambiance, photos de l\'event à venir' },
  { titre: 'Disney Nostalgie 90-2000', quand: 'Du 12 au 15 août 2026', mois: '2026-08', desc: 'Viens (re)découvrir les classiques de ton enfance.', visuel: illu('patisserie'), alt: 'Illustration d\'ambiance, photos de l\'event à venir' },
  { titre: 'Jurassic Pop', quand: 'Juillet 2026', mois: '2026-07', desc: 'Les dinosaures ont pris le bar.', visuel: illu('starters'), alt: 'Illustration d\'ambiance, photos de l\'event à venir' },
  { titre: 'Spider Day', quand: 'Juillet 2026', mois: '2026-07', desc: 'Une journée dans la toile, cosplay bienvenu.', visuel: illu('cocktail-zoro'), alt: 'Illustration d\'ambiance, photos de l\'event à venir' },
];
```

- [ ] **Step 3 : Écrire `src/components/EventCard.astro`**

```astro
---
import type { Evenement } from '../data/events';
interface Props { ev: Evenement; sombre?: boolean; passe?: boolean }
const { ev, sombre = false, passe = false } = Astro.props;
---
<article class:list={['evc', { 'evc--sombre': sombre, 'evc--passe': passe }]}>
  <div class="evc__media"><img src={ev.visuel} alt={ev.alt} width="960" height="720" loading="lazy" decoding="async" /></div>
  <div class="evc__body">
    <p class="evc__quand">{ev.quand}{ev.aPlanifier && ' · à planifier'}</p>
    <h3 class="evc__titre">{ev.titre}</h3>
    <p class="evc__desc">{ev.desc}</p>
    {ev.reservation && <p class="evc__resa">Sur réservation uniquement</p>}
  </div>
</article>

<style>
  .evc { display: grid; grid-template-columns: 200px 1fr; border: var(--bord); background: var(--blanc); color: var(--noir); box-shadow: var(--ombre-case); overflow: hidden; }
  .evc__media { border-right: var(--bord); background: var(--creme); }
  .evc__media img { width: 100%; height: 100%; object-fit: cover; }
  .evc__body { padding: 20px 22px; }
  .evc__quand { font-size: 0.72rem; font-weight: 700; letter-spacing: 0.22em; text-transform: uppercase; color: var(--rouge); }
  .evc__titre { margin-top: 6px; font-family: var(--font-title); font-size: 1.6rem; text-transform: uppercase; letter-spacing: 0.03em; line-height: 1; }
  .evc__desc { margin-top: 8px; color: var(--gris); line-height: 1.5; }
  .evc__resa { margin-top: 10px; display: inline-block; padding: 3px 10px; background: var(--noir); color: var(--blanc); font-size: 0.7rem; letter-spacing: 0.16em; text-transform: uppercase; }
  .evc--sombre { background: var(--noir); color: var(--blanc); border-color: var(--bdx); box-shadow: 6px 6px 0 var(--rouge); }
  .evc--sombre .evc__media { border-color: var(--bdx); }
  .evc--sombre .evc__desc { color: rgba(255, 255, 255, 0.75); }
  .evc--sombre .evc__quand { color: var(--rose); }
  .evc--passe { grid-template-columns: 1fr; }
  .evc--passe .evc__media { border-right: 0; border-bottom: var(--bord); aspect-ratio: 4 / 3; }
  .evc--passe .evc__media img { filter: grayscale(0.6) contrast(1.05); }
  @media (max-width: 600px) { .evc { grid-template-columns: 1fr; } .evc__media { border-right: 0; border-bottom: var(--bord); aspect-ratio: 16 / 9; } }
</style>
```

- [ ] **Step 4 : Écrire `src/pages/events.astro`**

```astro
---
import Base from '../layouts/Base.astro';
import TitleCard from '../components/TitleCard.astro';
import EventCard from '../components/EventCard.astro';
import { A_VENIR, SOIREES, PASSES } from '../data/events';
import { LICENCE_DU_MOIS, IDENTITE } from '../data/site';
---
<Base title="Events et soirées — Daily Pop Society, Charleroi" description="Une licence à l'honneur chaque mois, blind tests pop culture deux fois par mois, soirées JDR sur réservation, animations le week-end. Le programme du bar pop culture de Charleroi.">
  <TitleCard kicker="Chapitre 2 · Les events" variante="noir" letterbox>Ce mois-ci :<br /><em>{LICENCE_DU_MOIS.nom}</em><Fragment slot="copy">{LICENCE_DU_MOIS.accroche} {LICENCE_DU_MOIS.dates}. Une licence par mois, une carte éphémère, et des soirées toutes les semaines.</Fragment><Fragment slot="actions"><a class="btn" href={IDENTITE.instagram} target="_blank" rel="noopener">Le programme sur Instagram</a></Fragment></TitleCard>

  <section class="section">
    <div class="container">
      <span class="kicker">À venir</span>
      <h2 class="titre titre--md">Les prochaines <em>licences</em></h2>
      <div class="liste" data-reveal data-reveal-stagger>
        {A_VENIR.map((ev) => <EventCard ev={ev} />)}
      </div>
    </div>
  </section>

  <section class="section section--noir letterbox">
    <div class="container">
      <span class="kicker">Toutes les semaines</span>
      <h2 class="titre titre--md">Les <em>soirées</em></h2>
      <div class="liste" data-reveal data-reveal-stagger>
        {SOIREES.map((ev) => <EventCard ev={ev} sombre />)}
      </div>
      <p class="copy">Réservation JDR par téléphone au <a href={`tel:${IDENTITE.telephoneIntl}`}>{IDENTITE.telephone}</a> ou par Messenger.</p>
    </div>
  </section>

  <section class="section section--trame">
    <div class="container">
      <span class="kicker">Précédemment dans Daily Pop</span>
      <h2 class="titre titre--md">Les events <em>passés</em></h2>
      <p class="copy">Pour comprendre ce qu'est un event au shop. Les photos arrivent, en attendant voilà l'ambiance.</p>
      <div class="grille grille--2 passes" data-reveal data-reveal-stagger>
        {PASSES.map((ev) => <EventCard ev={ev} passe />)}
      </div>
    </div>
  </section>
</Base>

<style>
  .liste { margin-top: 36px; display: grid; gap: 22px; }
  .passes { margin-top: 36px; }
</style>
```

- [ ] **Step 5 : Build + contrôle (`pnpm test` → 5 pages) + captures responsive de `/events/`, lecture, commit**

```bash
git add scripts/verifier.mjs src
git commit -m "feat: events — licences à venir, soirées récurrentes, précédemment dans Daily Pop"
```

---

### Task 10 : Galerie par thèmes avec filtre progressif

**Files:**
- Create: `src/data/galerie.ts`, `src/pages/galerie.astro`
- Modify: `scripts/verifier.mjs` (PAGES)

- [ ] **Step 1 : Ajouter `'galerie/index.html'` à `PAGES`, `pnpm test` → Expected : `page absente : galerie/index.html`**

- [ ] **Step 2 : Écrire `src/data/galerie.ts`**

```ts
/* Galerie par thème — un thème = une licence ou un event. En attendant les
   photos de la cliente : illustrations d'ambiance et logos mensuels. */
export type Visuel = { src: string; alt: string; legende: string };
export type Theme = { slug: string; nom: string; visuels: Visuel[] };

const illu = (id: string) => `/media/illu/${id}-960.webp`;

export const THEMES: Theme[] = [
  {
    slug: 'le-shop', nom: 'Le shop',
    visuels: [
      { src: illu('comptoir'), alt: 'Illustration : le comptoir et ses étagères de mangas', legende: 'Le comptoir, les mangas, les figurines.' },
      { src: illu('coin-gaming'), alt: 'Illustration : le coin gaming', legende: 'Le coin gaming, Switch et PS4 à dispo.' },
      { src: illu('jdr'), alt: 'Illustration : une table de jeu de rôle', legende: 'La table des soirées JDR.' },
    ],
  },
  {
    slug: 'la-carte', nom: 'La carte',
    visuels: [
      { src: illu('cocktail-zoro'), alt: 'Illustration : le cocktail Zoro', legende: 'Le Zoro, trois lames de citron vert.' },
      { src: illu('burger-hokage'), alt: 'Illustration : le burger Hokage', legende: 'Le burger Hokage.' },
      { src: illu('bubble-tea'), alt: 'Illustration : bubble tea mangue', legende: 'Bubble tea mangue passion.' },
      { src: illu('patisserie'), alt: 'Illustration : cheesecake', legende: 'Cheesecake Spider.' },
    ],
  },
  {
    slug: 'soirees', nom: 'Soirées',
    visuels: [
      { src: illu('blind-test'), alt: 'Illustration : micro sous néon', legende: 'Blind test pop culture, un vendredi sur deux.' },
      { src: illu('starters'), alt: 'Illustration : planche à partager', legende: 'À partager pendant le quiz.' },
    ],
  },
  {
    slug: 'logos', nom: 'Les logos du mois',
    visuels: [
      { src: '/media/logos/2024-07-one-piece.webp', alt: 'Logo mensuel One Piece, juillet 2024', legende: 'Juillet 2024 — One Piece.' },
      { src: '/media/logos/2024-10-halloween.webp', alt: 'Logo mensuel Halloween, octobre 2024', legende: 'Octobre 2024 — Halloween.' },
      { src: '/media/logos/2025-05-pokemon.webp', alt: 'Logo mensuel Pokémon, mai 2025', legende: 'Mai 2025 — Pokémon.' },
      { src: '/media/logos/2025-11-my-hero-academia.webp', alt: 'Logo mensuel My Hero Academia, novembre 2025', legende: 'Novembre 2025 — My Hero Academia.' },
      { src: '/media/logos/2026-05-daily-pop-society.webp', alt: 'Nouveau logo Daily Pop Society, mai 2026', legende: 'Mai 2026 — le nouveau logo.' },
    ],
  },
];
```

- [ ] **Step 3 : Écrire `src/pages/galerie.astro`**

```astro
---
import Base from '../layouts/Base.astro';
import TitleCard from '../components/TitleCard.astro';
import { THEMES } from '../data/galerie';
---
<Base title="Galerie — Daily Pop Society, Charleroi" description="Le shop, la carte, les soirées et les logos du mois en images. La galerie par thèmes du bar pop culture de Charleroi, cosplay bienvenu.">
  <TitleCard kicker="Chapitre 3 · La galerie" variante="blanc">Les cases <em>du mois</em><Fragment slot="copy">Le shop, la carte, les soirées, les logos. Les photos des events arrivent au fil des mois.</Fragment></TitleCard>

  <section class="section">
    <div class="container">
      <div class="filtres" role="group" aria-label="Filtrer par thème">
        <button class="filtre is-active" data-theme="tous" aria-pressed="true">Tout</button>
        {THEMES.map((t) => <button class="filtre" data-theme={t.slug} aria-pressed="false">{t.nom}</button>)}
      </div>
      <div class="grille grille--3 gal">
        {THEMES.flatMap((t) => t.visuels.map((v) => (
          <figure class="gal__item" data-theme={t.slug}>
            <div class="gal__media"><img src={v.src} alt={v.alt} width="960" height="720" loading="lazy" decoding="async" /></div>
            <figcaption><span class="gal__theme">{t.nom}</span>{v.legende}</figcaption>
          </figure>
        )))}
      </div>
    </div>
  </section>
</Base>

<script>
  /* Filtre progressif : sans JS, tout est affiché. */
  const boutons = document.querySelectorAll<HTMLButtonElement>('.filtre');
  const items = document.querySelectorAll<HTMLElement>('.gal__item');
  boutons.forEach((b) => b.addEventListener('click', () => {
    const theme = b.dataset.theme;
    boutons.forEach((x) => { const on = x === b; x.classList.toggle('is-active', on); x.setAttribute('aria-pressed', String(on)); });
    items.forEach((it) => { it.hidden = theme !== 'tous' && it.dataset.theme !== theme; });
  }));
</script>

<style>
  .filtres { display: flex; gap: 10px; flex-wrap: wrap; margin-bottom: 32px; }
  .filtre { padding: 8px 16px; border: var(--bord); background: var(--blanc); font-size: 0.74rem; font-weight: 700; letter-spacing: 0.16em; text-transform: uppercase; }
  .filtre.is-active { background: var(--noir); color: var(--blanc); }
  .gal__item { border: var(--bord); box-shadow: var(--ombre-case); background: var(--blanc); }
  .gal__media { aspect-ratio: 4 / 3; overflow: hidden; border-bottom: var(--bord); background: var(--creme); }
  .gal__media img { width: 100%; height: 100%; object-fit: cover; transition: transform 0.5s var(--ease); }
  .gal__item:hover img { transform: scale(1.04); }
  .gal__item figcaption { padding: 12px 16px 14px; font-size: 0.92rem; color: var(--gris); }
  .gal__theme { display: block; font-size: 0.66rem; font-weight: 700; letter-spacing: 0.2em; text-transform: uppercase; color: var(--rouge); margin-bottom: 2px; }
</style>
```

- [ ] **Step 4 : Build + contrôle (6 pages) + capture, tester le filtre (`["click","[data-theme=logos]"],["screenshot",…]`), lecture, commit**

```bash
git add scripts/verifier.mjs src
git commit -m "feat: galerie par thèmes avec filtre progressif"
```

---

### Task 11 : À propos — l'histoire, le changement de nom, la frise des logos

**Files:**
- Create: `src/data/histoire.ts`, `src/components/FriseLogos.astro`, `src/pages/a-propos.astro`
- Modify: `scripts/verifier.mjs` (PAGES)

- [ ] **Step 1 : Ajouter `'a-propos/index.html'` à `PAGES`, `pnpm test` → Expected : `page absente : a-propos/index.html`**

- [ ] **Step 2 : Écrire `src/data/histoire.ts` (texte du brief, ton tutoyé)**

```ts
export type Etape = { date: string; titre: string; texte: string };

export const ETAPES: Etape[] = [
  { date: 'Avril 2024', titre: "Nakama's Coffee", texte: "Un café manga imaginé par Rachel, passionnée de pop culture depuis toujours. L'idée : un lieu où chacun se sent à sa place, une vraie safe place, que tu sois geek convaincu, amateur de ciné, de jeux vidéo, de séries, ou simplement curieux." },
  { date: 'Décembre 2025', titre: 'Le concept fait peau neuve', texte: "Face à l'engouement de la communauté, l'univers s'ouvre à toute la pop culture : films, séries, animés, jeux. Le nom « Nakama's Coffee » disait « manga » ; il fallait un nom qui dise tout le reste." },
  { date: 'Juin 2026', titre: 'Daily Pop Society, au cœur de Charleroi', texte: "Le shop s'installe Quai Arthur Rimbaud pour donner vie à cette nouvelle identité. Cocktails, mocktails, bubble teas, cafés, starters, burgers et pâtisseries, dans une ambiance immersive et pleine de références à tes univers préférés." },
];

export const POURQUOI_LE_NOM =
  "« Daily », parce qu'il s'y passe quelque chose tous les jours. « Pop », pour toute la pop culture, pas seulement les mangas. « Society », parce que c'est une communauté avant d'être un bar : un lieu de partage où la pop culture rassemble toutes les générations.";
```

- [ ] **Step 3 : Écrire `src/components/FriseLogos.astro`**

```astro
---
/* Frise horizontale des logos mensuels, groupés par année. Scroll natif (aucun JS). */
import { LOGOS } from '../data/logos';
const annees = [...new Set(LOGOS.map((l) => l.mois.slice(0, 4)))];
const libelle = (mois: string) => new Date(`${mois}-01T12:00:00`).toLocaleDateString('fr-BE', { month: 'long' });
---
<div class="frise" tabindex="0" aria-label="Frise des logos mensuels, défilement horizontal">
  {annees.map((a) => (
    <div class="frise__annee">
      <p class="frise__an">{a}</p>
      <ul class="frise__liste">
        {LOGOS.filter((l) => l.mois.startsWith(a)).map((l) => (
          <li class="frise__item">
            <img src={l.src} alt={`Logo ${l.licence}, ${libelle(l.mois)} ${a}`} width="160" height="160" loading="lazy" decoding="async" />
            <p class="frise__mois">{libelle(l.mois)}</p>
            <p class="frise__licence">{l.licence}</p>
          </li>
        ))}
      </ul>
    </div>
  ))}
</div>

<style>
  .frise { display: flex; gap: 40px; overflow-x: auto; padding: 24px 0 32px; scroll-snap-type: x proximity; }
  .frise__annee { flex: 0 0 auto; }
  .frise__an { font-family: var(--font-title); font-size: 3rem; line-height: 1; color: var(--rose); margin-bottom: 14px; }
  .frise__liste { display: flex; gap: 18px; }
  .frise__item { flex: 0 0 120px; text-align: center; scroll-snap-align: start; }
  .frise__item img { width: 120px; height: 120px; border-radius: 50%; border: 2px solid var(--blanc); background: var(--blanc); margin-inline: auto; }
  .frise__mois { margin-top: 8px; font-size: 0.66rem; letter-spacing: 0.2em; text-transform: uppercase; color: var(--rose); }
  .frise__licence { font-size: 0.82rem; font-weight: 600; line-height: 1.25; }
</style>
```

- [ ] **Step 4 : Écrire `src/pages/a-propos.astro`**

```astro
---
import Base from '../layouts/Base.astro';
import TitleCard from '../components/TitleCard.astro';
import FriseLogos from '../components/FriseLogos.astro';
import { ETAPES, POURQUOI_LE_NOM } from '../data/histoire';
import { IDENTITE } from '../data/site';
---
<Base title="À propos — de Nakama's Coffee à Daily Pop Society" description="L'histoire du bar pop culture de Charleroi : un café manga né en avril 2024, une communauté, un nouveau nom en 2025 et une nouvelle adresse en 2026. Rachel, alias l'Hokage, raconte pourquoi.">
  <TitleCard kicker="Chapitre 4 · L'histoire" variante="bordeaux-sombre" letterbox>De Nakama's Coffee<br />à <em>Daily Pop Society</em><Fragment slot="copy">Pourquoi on a changé de nom, qui est l'Hokage, et ce que veut dire « safe place » ici.</Fragment></TitleCard>

  <section class="section">
    <div class="container container--narrow">
      <ol class="etapes">
        {ETAPES.map((e, i) => (
          <li class="etape" data-reveal>
            <p class="etape__date">{e.date}</p>
            <h2 class="titre titre--sm">{e.titre}</h2>
            <p class="etape__texte">{e.texte}</p>
          </li>
        ))}
      </ol>
    </div>
  </section>

  <section class="section section--trame">
    <div class="container container--narrow center">
      <span class="kicker">Pourquoi ce nom</span>
      <h2 class="titre titre--md">Daily. Pop. <em>Society.</em></h2>
      <p class="copy copy--center">{POURQUOI_LE_NOM}</p>
    </div>
  </section>

  <section class="section section--noir letterbox">
    <div class="container">
      <span class="kicker">Chaque mois, un logo</span>
      <h2 class="titre titre--md">La timeline <em>des logos</em></h2>
      <p class="copy">Depuis avril 2024, chaque licence du mois a eu son logo. Fais défiler.</p>
      <FriseLogos />
    </div>
  </section>

  <section class="section">
    <div class="container qui">
      <div class="qui__logo"><img src="/media/logo-640.webp" alt="Le logo de Daily Pop Society : Rachel, un cocktail dans une main, un burger dans l'autre" width="640" height="640" loading="lazy" /></div>
      <div>
        <span class="kicker">L'Hokage</span>
        <h2 class="titre titre--md">Rachel, <em>derrière le bar</em></h2>
        <p class="copy">C'est elle sur le logo. Passionnée de pop culture depuis toujours, adoratrice de One Piece, elle imagine chaque mois la carte éphémère : des boissons et des burgers inspirés de personnages emblématiques.</p>
        <h3 class="titre titre--sm" style="margin-top: 36px">Cosplay friendly, safe place</h3>
        <p class="copy">Chacun est libre de venir en costume, à tout moment. Des rassemblements et des events thématiques sont organisés toute l'année. Mangas, comics, romans, jeux de société et coin gaming Switch / PS4 sont mis à dispo gratuitement pour qui consomme, selon le règlement visible au shop.</p>
        <div class="actions"><a class="btn" href="/events/">Voir les events</a><a class="link-arrow" href={IDENTITE.instagram} target="_blank" rel="noopener">Instagram</a></div>
      </div>
    </div>
  </section>
</Base>

<style>
  .etapes { display: grid; gap: 40px; }
  .etape { position: relative; padding-left: 36px; border-left: 3px solid var(--bdx); }
  .etape::before { content: ''; position: absolute; left: -9px; top: 6px; width: 15px; height: 15px; background: var(--rouge); border: 2px solid var(--noir); }
  .etape__date { font-size: 0.72rem; font-weight: 700; letter-spacing: 0.24em; text-transform: uppercase; color: var(--rouge); margin-bottom: 8px; }
  .etape__texte { margin-top: 10px; color: var(--gris); line-height: 1.65; font-size: 1.05rem; }
  .qui { display: grid; grid-template-columns: 0.8fr 1.2fr; gap: clamp(32px, 6vw, 80px); align-items: center; }
  .qui__logo { border: var(--bord); box-shadow: var(--ombre-case); background: var(--blanc); padding: 12px; }
  @media (max-width: 960px) { .qui { grid-template-columns: 1fr; } .qui__logo { max-width: 360px; } }
</style>
```

- [ ] **Step 5 : Build + contrôle (7 pages) + captures responsive de `/a-propos/` (vérifier que la frise défile : `["js","document.querySelector('.frise').scrollLeft=900"],["screenshot",…]`), lecture, commit**

```bash
git add scripts/verifier.mjs src
git commit -m "feat: à propos — l'histoire en trois temps, pourquoi le nom, frise des logos, l'Hokage"
```

---

### Task 12 : Contact

**Files:**
- Create: `src/pages/contact.astro`
- Modify: `scripts/verifier.mjs` (PAGES)

- [ ] **Step 1 : Ajouter `'contact/index.html'` à `PAGES`, `pnpm test` → Expected : `page absente : contact/index.html`**

- [ ] **Step 2 : Écrire `src/pages/contact.astro`**

```astro
---
import Base from '../layouts/Base.astro';
import TitleCard from '../components/TitleCard.astro';
import Horaires from '../components/Horaires.astro';
import { IDENTITE } from '../data/site';
---
<Base title="Contact et horaires — Daily Pop Society, Quai Arthur Rimbaud 9, Charleroi" description="Daily Pop Society, Quai Arthur Rimbaud 9 à 6000 Charleroi. Horaires d'ouverture, téléphone, e-mail, Instagram et Facebook. Réservation des soirées JDR par téléphone ou Messenger.">
  <TitleCard kicker="Chapitre 5 · Nous trouver" variante="noir" letterbox>Quai Arthur Rimbaud 9,<br /><em>Charleroi</em><Fragment slot="copy">Au cœur de Charleroi, sur le quai. Pas de réservation en ligne : un coup de fil, un message, et on te garde une place.</Fragment><Fragment slot="actions"><a class="btn" href={IDENTITE.itineraire} target="_blank" rel="noopener">Itinéraire</a><a class="btn btn--ghost" href={`tel:${IDENTITE.telephoneIntl}`}>Appeler</a></Fragment></TitleCard>

  <section class="section">
    <div class="container ct">
      <div>
        <span class="kicker">Horaires</span>
        <h2 class="titre titre--md">Quand <em>on est là</em></h2>
        <div style="margin-top: 28px"><Horaires /></div>
      </div>
      <div class="ct__bloc">
        <span class="kicker">Coordonnées</span>
        <p class="ct__adresse">{IDENTITE.rue}<br />{IDENTITE.codePostal} {IDENTITE.ville}, Belgique</p>
        <dl class="ct__liste">
          <dt>Téléphone</dt><dd><a href={`tel:${IDENTITE.telephoneIntl}`}>{IDENTITE.telephone}</a></dd>
          <dt>E-mail</dt><dd><a href={`mailto:${IDENTITE.email}`}>{IDENTITE.email}</a></dd>
          <dt>Instagram</dt><dd><a href={IDENTITE.instagram} target="_blank" rel="noopener">@dailypopsociety</a></dd>
          <dt>Facebook</dt><dd><a href={IDENTITE.facebook} target="_blank" rel="noopener">Daily Pop Society</a></dd>
        </dl>
        <p class="ct__resa">Soirées JDR sur réservation uniquement : par téléphone ou par Messenger. Les groupes et les rassemblements cosplay, pareil, on s'organise ensemble.</p>
        <p class="hand" style="margin-top: 18px">Cosplay bienvenu, tout le temps.</p>
      </div>
    </div>
  </section>
</Base>

<style>
  .ct { display: grid; grid-template-columns: 1.1fr 1fr; gap: clamp(32px, 6vw, 80px); align-items: start; }
  .ct__bloc { padding: 32px; border: var(--bord); box-shadow: var(--ombre-case); background: var(--creme); }
  .ct__adresse { font-family: var(--font-title); font-size: 1.7rem; line-height: 1.05; text-transform: uppercase; }
  .ct__liste { margin-top: 22px; display: grid; grid-template-columns: auto 1fr; gap: 8px 18px; }
  .ct__liste dt { font-size: 0.7rem; font-weight: 700; letter-spacing: 0.2em; text-transform: uppercase; color: var(--rouge); align-self: center; }
  .ct__liste dd { margin: 0; }
  .ct__liste a { font-weight: 600; }
  .ct__resa { margin-top: 22px; color: var(--gris); line-height: 1.6; }
  @media (max-width: 960px) { .ct { grid-template-columns: 1fr; } }
</style>
```

- [ ] **Step 3 : Build + contrôle (8 pages, aucun écart) + captures responsive de `/contact/`, lecture, commit**

```bash
git add scripts/verifier.mjs src
git commit -m "feat: contact — adresse, horaires, coordonnées, réservation JDR"
```

---

### Task 13 : SEO, image Open Graph, JSON-LD, performance

**Files:**
- Create: `public/media/og.png`
- Modify: `scripts/verifier.mjs` (contrôle du JSON-LD)

- [ ] **Step 1 : Étendre le contrôleur au JSON-LD (doit passer directement : le layout le produit déjà)**

Dans `scripts/verifier.mjs`, remplacer la ligne `if (p !== '404.html') ok(html.includes('application/ld+json'), …)` par :
```js
  if (p !== '404.html') {
    const m = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
    ok(!!m, `${p} : JSON-LD absent`);
    if (m) {
      try {
        const ld = JSON.parse(m[1]);
        ok(ld['@type'] === 'BarOrPub' && ld.address?.postalCode === '6000' && Array.isArray(ld.openingHoursSpecification) && ld.openingHoursSpecification.length === 7, `${p} : JSON-LD incomplet (type, adresse ou 7 créneaux d'ouverture)`);
      } catch { erreurs.push(`${p} : JSON-LD invalide`); }
    }
  }
```
Run : `pnpm test` → Expected : `✓ verifier : 8 pages contrôlées, aucun écart` (5 jours ouverts, dont 2 à deux créneaux = 7 créneaux).

- [ ] **Step 2 : Produire `public/media/og.png` (1200×630) depuis l'état final du générique**

```bash
B="$HOME/.claude/skills/gstack/browse/dist/browse"; S="<scratchpad>"
echo '[["viewport","1440x900"],["goto","http://localhost:4332/"],["wait","--networkidle"],["js","window.scrollTo(0, 2300)"],["screenshot","'"$S/og-src.png"'","--viewport"]]' | "$B" chain
node -e "import('sharp').then(({default:s})=>s('$S/og-src.png').resize(1200,630,{fit:'cover',position:'centre'}).png({compressionLevel:9}).toFile('public/media/og.png').then(()=>console.log('og ok')))"
```
Lire `public/media/og.png` : « DAILY POP / SOCIETY » en blanc sur bordeaux, bandes de logos estompées, title card lisible. Si la capture montre l'état intermédiaire (lettres remplies), ajuster le `scrollTo` (2000 → 2600).

- [ ] **Step 3 : Lighthouse mobile sur l'accueil et la carte (build de prod servi par `astro preview` sur 4333)**

```bash
pnpm build && (pnpm preview --port 4333 &) ; sleep 4
export CHROME_PATH=$(ls -d ~/AppData/Local/ms-playwright/chromium-*/chrome-win*/chrome.exe | tail -1)
for u in / /la-carte/; do
  npx --yes lighthouse "http://localhost:4333$u" --quiet --chrome-flags="--headless=new" --output=json --output-path="<scratchpad>/lh$(echo $u | tr / _).json"
  python3 -c "import json,sys; c=json.load(open(sys.argv[1]))['categories']; print(sys.argv[1], {k: round(v['score']*100) for k,v in c.items()})" "<scratchpad>/lh$(echo $u | tr / _).json"
done
```
Expected : les quatre scores ≥ 90 sur les deux pages. Sous 90 en performance : vérifier le poids des logos du générique (56 images de 160 px, ~8 Ko chacune, `loading="eager"` voulu), passer les illustrations hors écran en `loading="lazy"` (déjà fait), et le `preload` des deux fontes. Sous 90 en accessibilité : lire les audits `contrast` et `link-name` du JSON et corriger la couleur ou le libellé en cause. Arrêter le preview ensuite (`Stop-Process` du processus node sur 4333 ou fermer la tâche de fond).

- [ ] **Step 4 : Commit**

```bash
git add scripts/verifier.mjs public/media/og.png
git commit -m "feat: image Open Graph, contrôle du JSON-LD, passe Lighthouse"
```

---

### Task 14 : Conteneur nginx (Dockerfile, nginx.conf) et test local

**Files:**
- Create: `.dockerignore`, `Dockerfile`, `nginx.conf`

- [ ] **Step 1 : Écrire les trois fichiers (copie du gabarit xenia, 404 réelle)**

`.dockerignore` :
```
node_modules
dist
.astro
.git
.gstack
.superpowers
docs
brief
scripts
```

`Dockerfile` :
```dockerfile
# Site 100 % statique : on compile, puis on ne sert que des fichiers.
# Aucune variable d'environnement, aucun secret — rien à injecter au run.

FROM node:22-alpine AS build
WORKDIR /app
RUN corepack enable
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile
COPY . .
RUN pnpm build

FROM nginx:alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
```

`nginx.conf` :
```nginx
server {
  listen 80;
  server_name _;
  root /usr/share/nginx/html;
  index index.html;

  gzip on;
  gzip_comp_level 6;
  gzip_min_length 1024;
  gzip_types text/plain text/css application/javascript application/json image/svg+xml application/xml;

  # Les assets d'Astro portent un hash dans leur nom : immuables.
  location /_astro/ {
    expires 1y;
    add_header Cache-Control "public, immutable";
  }
  # Médias : longue durée, mais révocable (les noms ne sont pas hashés).
  location /media/ {
    expires 30d;
    add_header Cache-Control "public";
  }
  # Le HTML doit toujours être revalidé.
  location = /index.html {
    add_header Cache-Control "no-cache";
  }
  # Site multi-pages : une URL inconnue répond 404, pas de fallback SPA (soft-404).
  error_page 404 /404.html;
  location / {
    try_files $uri $uri/ =404;
  }
}
```

- [ ] **Step 2 : Construire et tester l'image en local**

```bash
docker build -t dps-maquette . && docker run -d --rm --name dps-test -p 8089:80 dps-maquette && sleep 2
for u in / /la-carte/ /events/ /galerie/ /a-propos/ /contact/ /mentions-legales/ /sitemap-index.xml /robots.txt /nimportequoi; do printf "%-24s %s\n" "$u" "$(curl -s -o /dev/null -w '%{http_code}' http://localhost:8089$u)"; done
docker stop dps-test
```
Expected : 200 partout sauf `/nimportequoi` → **404** (et son corps est la page 404 du site : `curl -s http://localhost:8089/nimportequoi | grep -c multivers` → 1).

- [ ] **Step 3 : Commit**

```bash
git add .dockerignore Dockerfile nginx.conf
git commit -m "chore: image nginx statique avec 404 réelle"
```

---

### Task 15 : Documentation PROJET.md et PROJET.html

**Files:**
- Create: `PROJET.md`, `PROJET.html`

- [ ] **Step 1 : Écrire `PROJET.md` (structure obligatoire des règles globales)**

```markdown
# Daily Pop Society — site vitrine
> Site statique du bar pop culture de Charleroi : générique façon Marvel Studios formé par les logos mensuels, carte, events, galerie, histoire du nom, contact.

## Stack technique
| Catégorie | Technologie |
|-----------|-------------|
| Framework | Astro 5 (sortie statique) |
| Animation | GSAP 3 + ScrollTrigger, import différé, scrub desktop uniquement |
| Fontes | Anton, Inter Variable, Caveat, Bangers (fontsource, auto-hébergées) |
| Images | WebP 3 tailles (sharp), logos découpés par Pillow |
| Illustrations | Kie.ai `nano-banana-pro`, style cel-shadé (démo, à remplacer par les photos) |
| Serveur | nginx alpine (Docker), Coolify maquettes |
| Tests | `scripts/verifier.mjs` sur `dist/`, `astro check`, Lighthouse |

## Démarrage rapide
```bash
pnpm install
pnpm dev          # http://localhost:4332
pnpm build        # dist/
pnpm test         # build + contrôle de dist/
python3 scripts/logos.py     # regénère logos + src/data/logos.ts
bash scripts/illustrations.sh && node scripts/webp.mjs   # illustrations manquantes (payant : 0,04 $/image)
```

## Architecture
- `src/data/` — la seule source de contenu : `site.ts` (identité, nav, licence du mois), `horaires.ts`, `carte.ts` (DÉMO), `events.ts`, `galerie.ts`, `logos.ts` (généré), `histoire.ts`
- `src/components/` — `Generique` (hero signature), `TitleCard`, `Case`, `EventCard`, `FriseLogos`, `Horaires`, `Header`, `Footer`
- `src/layouts/Base.astro` — SEO, Open Graph, JSON-LD `BarOrPub`, boot des reveals
- `src/lib/motion.ts` — socle GSAP (reduced-motion, seuil 1024, chargement différé)
- `src/pages/` — accueil, la-carte, events, galerie, a-propos, contact, mentions-legales, 404
- `scripts/` — `verifier.mjs`, `logos.py`, `illustrations.*`, `webp.mjs`
- `brief/` (gitignoré) — moodboard, info.txt, images du site actuel, PNG sources des illustrations
- Flux : données TS → pages Astro → HTML statique → nginx. Mise à jour mensuelle = éditer `site.ts` (licence du mois), `events.ts`, `carte.ts`.

## Variables d'environnement
| Variable | Description | Requis |
|----------|-------------|--------|
| `KIE_API_KEY` | Génération des illustrations (scripts uniquement, jamais au build ni au run) | ❌ |

## Roadmap & Features
| Feature | Statut | Date |
|---------|--------|------|
| Spec et plan validés | ✅ Done | 2026-09-07 |
| Socle, header, footer, 404, mentions légales | ✅ Done | 2026-09-07 |
| Le générique (scrub desktop, intro mobile, statique) | ✅ Done | 2026-09-07 |
| Illustrations cel-shadées | ✅ Done | 2026-09-07 |
| Pages carte, events, galerie, à propos, contact | ✅ Done | 2026-09-07 |
| SEO, OG, JSON-LD, Lighthouse | ✅ Done | 2026-09-07 |
| Maquette en ligne (chris-ia.com) | 🚧 In Progress | — |
| Vraie carte, photos, logo HD (cliente) | 📋 Planned | — |
| Mise en production dailypopsociety.be + coupure Netlify/Firebase | 📋 Planned | — |

## Journal des changements
### 2026-09-07
- ✨ Ajout : site complet (8 pages) sur le gabarit Astro des sites vitrines, port 4332
- ✨ Ajout : le générique — 28 logos mensuels découpés des planches de la cliente, hero épinglé
- ✨ Ajout : 11 illustrations cel-shadées (Kie), WebP en 3 tailles
- ✨ Ajout : contrôleur `scripts/verifier.mjs` (pages, SEO, alt, médias, JSON-LD)
- 📝 Décisions : site 100 % statique (pas de quiz/points/admin), français seul, pas de vidéo, direction « générique » I

## Problèmes connus
- Carte de démonstration : noms et prix fictifs jusqu'à réception de la vraie carte.
- Logos mensuels en 160 px (découpés des planches) : suffisants en mouvement, à remplacer par les fichiers HD de la cliente pour la frise.
- E-mail public à confirmer (contact@dailypopsociety.be affiché).
- ⚠️ Sécurité de l'ancien site : la base Firebase du site Netlify est lisible et modifiable sans authentification (noms, e-mails, points des clients). À couper/supprimer à la mise en production.

## Déploiement
- Maquette : Coolify maquettes (`*.chris-ia.com`), image Docker nginx, dépôt GitHub `cltconcept/dailypopsociety-website`. URL et identifiants de redéploiement : voir la section ci-dessous après la Task 16.
- Production (plus tard) : domaine `dailypopsociety.be` à réserver, DNS, puis coupure du site Netlify et suppression du projet Firebase.
```

- [ ] **Step 2 : Écrire `PROJET.html` — même contenu, page autonome : CSS inline, dark mode par défaut avec toggle, sidebar fixe d'ancres, badges de statut (vert Done, orange In Progress, bleu Planned), timeline pour le journal, responsive, police system-ui. Structure minimale à respecter :**

```html
<!doctype html><html lang="fr" data-theme="dark"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Daily Pop Society — PROJET</title>
<style>
:root{--bg:#0f0f10;--panel:#18181b;--txt:#e8e8ea;--muted:#9a9aa3;--acc:#B4162F;--line:#2a2a2f}
[data-theme=light]{--bg:#f7f7f8;--panel:#fff;--txt:#151517;--muted:#5d5d66;--line:#e2e2e6}
*{box-sizing:border-box}body{margin:0;font-family:system-ui,sans-serif;background:var(--bg);color:var(--txt);line-height:1.55}
header{padding:32px 40px;border-bottom:1px solid var(--line)}header h1{margin:0;font-size:2rem}header p{color:var(--muted)}
.badge{display:inline-block;padding:2px 10px;border-radius:999px;font-size:.75rem;font-weight:700;margin:2px}
.b-stack{background:var(--panel);border:1px solid var(--line)}.b-done{background:#1f6f3f;color:#fff}.b-prog{background:#b3641a;color:#fff}.b-plan{background:#1f4f8f;color:#fff}
.wrap{display:grid;grid-template-columns:240px 1fr}nav.side{position:sticky;top:0;height:100vh;padding:24px;border-right:1px solid var(--line)}
nav.side a{display:block;color:var(--muted);text-decoration:none;padding:6px 0}nav.side a:hover{color:var(--acc)}
main{padding:32px 40px;max-width:980px}section{margin-bottom:48px}h2{border-left:4px solid var(--acc);padding-left:12px}
table{width:100%;border-collapse:collapse;background:var(--panel)}th,td{padding:10px 12px;border-bottom:1px solid var(--line);text-align:left;vertical-align:top}
pre{background:var(--panel);padding:16px;overflow:auto;border:1px solid var(--line)}
.tl{border-left:2px solid var(--acc);padding-left:20px}.tl article{position:relative;margin-bottom:24px}.tl article::before{content:'';position:absolute;left:-27px;top:6px;width:12px;height:12px;border-radius:50%;background:var(--acc)}
button.toggle{position:fixed;right:16px;top:16px;padding:8px 12px;border:1px solid var(--line);background:var(--panel);color:var(--txt);cursor:pointer}
@media(max-width:800px){.wrap{grid-template-columns:1fr}nav.side{position:static;height:auto;border-right:0;border-bottom:1px solid var(--line)}}
</style></head><body>
<button class="toggle" onclick="document.documentElement.dataset.theme=document.documentElement.dataset.theme==='dark'?'light':'dark'">☀︎ / ☾</button>
<header><h1>Daily Pop Society — site vitrine</h1><p>Site statique du bar pop culture de Charleroi…</p><span class="badge b-stack">Astro 5</span><span class="badge b-stack">GSAP</span><span class="badge b-stack">nginx</span></header>
<div class="wrap"><nav class="side"><a href="#stack">Stack</a><a href="#demarrage">Démarrage</a><a href="#architecture">Architecture</a><a href="#env">Variables</a><a href="#roadmap">Roadmap</a><a href="#journal">Journal</a><a href="#problemes">Problèmes connus</a><a href="#deploiement">Déploiement</a></nav>
<main>
<section id="stack"><h2>🧱 Stack technique</h2><table>…lignes du MD…</table></section>
<section id="demarrage"><h2>🚀 Démarrage rapide</h2><pre>…commandes du MD…</pre></section>
<section id="architecture"><h2>🗂 Architecture</h2><ul>…puces du MD…</ul></section>
<section id="env"><h2>🔐 Variables d'environnement</h2><table>…</table></section>
<section id="roadmap"><h2>🗺 Roadmap</h2><table>… statuts en <span class="badge b-done">Done</span> / <span class="badge b-prog">In Progress</span> / <span class="badge b-plan">Planned</span> …</table></section>
<section id="journal"><h2>📜 Journal</h2><div class="tl"><article><h3>2026-09-07</h3><ul>…</ul></article></div></section>
<section id="problemes"><h2>⚠️ Problèmes connus</h2><ul>…</ul></section>
<section id="deploiement"><h2>☁️ Déploiement</h2><ul>…</ul></section>
</main></div></body></html>
```
Les `…` sont à remplir avec le contenu exact du `PROJET.md` de l'étape 1 (chaque ligne de tableau, chaque puce, chaque commande) : la page doit être complète, pas un squelette.

- [ ] **Step 3 : Ouvrir `PROJET.html` dans le navigateur par défaut pour vérifier (règle globale : livrable local, pas d'artefact), puis commit**

Run (PowerShell) : `Start-Process "C:\Dev\Noveo\_autres\website\dailypopsociety\PROJET.html"`

```bash
git add PROJET.md PROJET.html
git commit -m "docs: PROJET.md et PROJET.html"
```

---

### Task 16 : Maquette en ligne sur chris-ia.com

**Files:** aucun nouveau fichier de code ; `PROJET.md` / `PROJET.html` mis à jour avec l'URL et l'uuid.

- [ ] **Step 1 : Dépôt GitHub. Demander l'accord de l'utilisateur AVANT (le classifieur a déjà refusé `gh repo create --public` pour xenia ; le dépôt public est nécessaire au tirage par Coolify maquettes, et `brief/` est gitignoré donc rien de client n'y part).**

```bash
gh repo create cltconcept/dailypopsociety-website --public --source=. --remote=origin --push
git -C C:/Dev/Noveo/_autres/website/dailypopsociety log --oneline | head -3
```
Expected : dépôt créé, branche `main` poussée.

- [ ] **Step 2 : Invoquer le skill `deploy-maquette`** (Skill tool, `skill: deploy-maquette`, args : `dailypopsociety https://github.com/cltconcept/dailypopsociety-website`). Il crée le projet et l'application Coolify, déploie et vérifie. Sous-domaine attendu : `dailypopsociety.chris-ia.com`.

- [ ] **Step 3 : Vérification réelle des 8 URL + 404 + sitemap sur le domaine**

```bash
for u in / /la-carte/ /events/ /galerie/ /a-propos/ /contact/ /mentions-legales/ /sitemap-index.xml /robots.txt /media/og.png /nimportequoi; do printf "%-24s %s\n" "$u" "$(curl -s -o /dev/null -w '%{http_code}' https://dailypopsociety.chris-ia.com$u)"; done
```
Expected : 200 partout, 404 sur `/nimportequoi`. Puis une capture browse de la page d'accueil en ligne (desktop + mobile), lue, pour confirmer que les fontes et les logos sont servis.

- [ ] **Step 4 : Consigner dans `PROJET.md` (section Déploiement : URL, uuid de l'app, commande de redéploiement `GET http://46.224.83.139:8000/api/v1/deploy?uuid=<uuid>` avec le jeton de `~/.claude.json` → `mcpServers.coolify.env`) et régénérer `PROJET.html` ; passer « Maquette en ligne » en ✅ Done. Commit + push.**

```bash
git add PROJET.md PROJET.html
git commit -m "docs: maquette en ligne, identifiants de redéploiement"
git push origin HEAD
```

---

### Task 17 : Mémoire et compte rendu

- [ ] **Step 1 : Écrire la mémoire `C:\Users\debes\.claude\projects\C--Dev-Noveo--autres-website\memory\dailypopsociety-etat-reprise.md`** (type `project`) : état du chantier, décisions (statique, FR, pas de vidéo, direction I), reprise (`pnpm dev` → 4332), URL maquette, redéploiement, reste à faire cliente, point Firebase. Ajouter la ligne d'index dans `MEMORY.md`, et mettre à jour `sites-vitrines-clients.md` (port 4332 = dailypopsociety).

- [ ] **Step 2 : Arrêter le serveur de dev et le compagnon visuel** (`bash ~/.claude/plugins/cache/superpowers-marketplace/superpowers/5.1.0/skills/brainstorming/scripts/stop-server.sh C:/Dev/Noveo/_autres/website/dailypopsociety/.superpowers/brainstorm/1465-1788792365`).

- [ ] **Step 3 : Compte rendu à l'utilisateur** : URL de la maquette, ce qui est démo (carte, illustrations, photos d'events), la liste à demander à Rachel (spec §12), et le point de sécurité Firebase à lui expliquer.

---

## Auto-revue du plan (faite le 2026-09-07)

- **Couverture de la spec** : §4 pages → Tasks 5, 7-12 ; §5 système visuel → Task 2 (global.css) + 4 ; §6 générique → Task 5 ; §7 images → Task 6 ; §8 données → Tasks 2, 3, 8-11 ; §9 technique/SEO/perf → Tasks 1, 2, 13 ; §10 déploiement → Tasks 14, 16 ; §11 vérification → `verifier.mjs` à chaque tâche, captures, Lighthouse (Task 13), Docker (Task 14) ; §12 cliente + Firebase → Tasks 15, 17.
- **Cohérence des noms** : `illu()` défini localement dans chaque page qui l'utilise ; `LOGOS`/`MONTAGE` exportés par le script de la Task 3 et consommés en Tasks 5, 10, 11 ; `LICENCE_DU_MOIS`, `IDENTITE`, `NAV` de `site.ts` ; `JOURS`, `MENTION_HORAIRES`, `HORAIRES_SCHEMA` de `horaires.ts` ; classes CSS `.tc`, `.case`, `.sfx`, `.letterbox`, `.feuille`, `.ligne`, `.grille` définies en Task 2 et utilisées ensuite.
- **Ordre** : les illustrations (Task 6) précèdent les pages qui les référencent (7-12) ; les logos (Task 3) précèdent le générique (5).

