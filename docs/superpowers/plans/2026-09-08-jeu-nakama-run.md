# Nakama Run — plan d'implémentation

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ajouter au hero un mini-jeu runner (Nakama Run) ouvert par un bouton START, avec un classement du mois partagé, stocké dans un fichier JSON par un petit serveur Hono qui sert aussi le site, sans base de données.

**Architecture:** Le site reste statique (Astro → `dist/`). Un serveur Node (`server/index.mjs`, Hono) sert `dist/` avec les en-têtes de l'ancien `nginx.conf` et expose `GET/POST /api/scores` (fichier `DATA_DIR/scores-AAAA-MM.json`, écriture atomique). Côté client : un moteur canvas sans dépendance (`src/lib/jeu/moteur.ts`), une borne en calque (`src/components/Borne.astro` + `src/lib/jeu/borne.ts`) et un bouton START dans le générique. Spec : `docs/superpowers/specs/2026-09-08-jeu-nakama-run-design.md`.

**Tech Stack:** Astro 5, TypeScript, canvas 2D, Hono 4 + `@hono/node-server`, `node --test`, Pillow (chroma-key des sprites), Kie nano-banana-pro (6 sprites), Docker `node:22-alpine`.

**Conventions :** identiques au plan du site (`2026-09-07-site-dailypopsociety.md`, lignes 1-57) : commits en français avec les deux trailers, boucle visuelle browse avec `newtab` en tête de chaîne et `["url"]` avant capture, `data-reveal` visibles après scroll bas → 1,5 s → haut instantané, chemins de capture ABSOLUS dans le scratchpad. État de départ : HEAD après `0ac353a` (site complet, maquette en ligne, `pnpm test` = check + build + verifier).

---

## Structure des fichiers

| Fichier | Responsabilité |
|---|---|
| `scripts/sprites.txt`, `scripts/sprites.sh`, `scripts/chromakey.py` | Génération des 6 sprites sur fond magenta, détourage → `public/media/jeu/<id>.webp` (RGBA 256 px) |
| `server/package.json`, `server/package-lock.json` | Dépendances du serveur seul (hono, @hono/node-server) |
| `server/scores.mjs` | Validation (`validerEnvoi`), `moisCourant()`, classe `Stockage` (fichier JSON par mois, atomique, top 100), `LimiteurDebit` |
| `server/scores.test.mjs` | Tests unitaires `node --test` |
| `server/index.mjs` | Hono : `/health`, `/api/scores`, statique `dist/` avec en-têtes, redirection slash, 404 réelle |
| `src/lib/jeu/moteur.ts` | Moteur du runner : état, entités, physique, rendu canvas, entrées ; API `creerJeu(canvas, options)` |
| `src/lib/jeu/borne.ts` | UI de la borne : ouverture/fermeture, focus, HUD, fin de partie, envoi du score, classement, top 3 du hero |
| `src/components/Borne.astro` | Markup et styles du calque |
| `src/components/Generique.astro` | + bouton START et ligne « Top du mois » dans le pied |
| `src/pages/index.astro` | + `<Borne />` |
| `astro.config.mjs` | Proxy Vite `/api` → `http://localhost:4340` en dev |
| `Dockerfile`, suppression de `nginx.conf` | Image Node finale |
| `scripts/verifier.mjs` | + sprites présents, borne dans l'accueil, sitemap sans `/api/` |
| `package.json` | scripts `dev:api`, `test` étendu, `.gitignore` + `data/` |
| `src/pages/mentions-legales.astro`, `PROJET.md`, `PROJET.html` | Vie privée (pseudo + score), doc |

---

### Task 1 : Les 6 sprites (génération + chroma-key)

**Files:**
- Create: `scripts/sprites.txt`, `scripts/sprites.sh`, `scripts/chromakey.py`, `public/media/jeu/*.webp` (6), `brief/sprites-src/*.png` (hors git)

- [ ] **Step 1 : Écrire `scripts/sprites.txt`** (`id|sujet`)

```
avatar|a chibi young woman with long wavy red hair, green eyes, black tank top, small tattoos on her arms, wearing a straw hat, running to the right in a side-view running pose with one knee up, big cheerful smile
tonneau|a wooden pirate barrel with dark metal hoops, side view, slightly tilted
boulet|a black iron cannonball with a short lit fuse and a small burgundy spark
burger|a tall stacked cheeseburger with melted cheddar and crispy onions, side view
bubble-tea|a mango bubble tea in a clear cup with black tapioca pearls and a wide yellow straw
cocktail|a bright green cocktail in a highball glass with three lime wedges and a black straw
```

- [ ] **Step 2 : Écrire `scripts/sprites.sh`** (copie de `scripts/illustrations.sh` avec trois différences : dossier `brief/sprites-src`, liste `scripts/sprites.txt`, style)

Remplacer dans la copie : `mkdir -p brief/illu-src` → `brief/sprites-src` ; `out="brief/illu-src/$id.png"` → `brief/sprites-src` ; `< scripts/illustrations.txt` → `< scripts/sprites.txt` ; `"aspect_ratio":"4:3"` → `"1:1"` ; et la variable `STYLE` :

```bash
STYLE="Clean cel-shaded cartoon game sprite, anime-inspired sticker style, bold black outlines, flat colors with subtle cel shading, the subject is fully visible and centered with a small margin, on a perfectly flat solid magenta background (#FF00FF) with no gradient, no shadow on the background, no text, no letters, no watermark, no photorealism."
```

- [ ] **Step 3 : Écrire `scripts/chromakey.py`**

```python
"""Détoure les sprites générés sur fond magenta (#FF00FF) : brief/sprites-src/<id>.png
→ public/media/jeu/<id>.webp (RGBA, recadré au contenu, 256 px de côté max).
Chroma-key en distance HSV : le magenta pur devient transparent, la frange
proche du magenta est atténuée (alpha proportionnel), et le rose résiduel sur
les bords est désaturé. Relancer après toute régénération d'un sprite."""
from pathlib import Path
from PIL import Image
import colorsys

RACINE = Path(__file__).resolve().parent.parent
SRC = RACINE / 'brief' / 'sprites-src'
OUT = RACINE / 'public' / 'media' / 'jeu'
OUT.mkdir(parents=True, exist_ok=True)
TAILLE = 256

def alpha_pixel(r, g, b):
    h, s, v = colorsys.rgb_to_hsv(r / 255, g / 255, b / 255)
    # magenta : teinte ≈ 300° (0,833), saturation et valeur élevées
    dh = min(abs(h - 0.833), 1 - abs(h - 0.833))
    if s > 0.45 and v > 0.45 and dh < 0.06:
        return 0
    if s > 0.3 and v > 0.4 and dh < 0.12:
        return int(255 * min(1, (dh - 0.06) / 0.06))
    return 255

def detourer(png: Path) -> Path:
    im = Image.open(png).convert('RGB')
    px = im.load()
    out = Image.new('RGBA', im.size)
    po = out.load()
    for y in range(im.height):
        for x in range(im.width):
            r, g, b = px[x, y]
            a = alpha_pixel(r, g, b)
            if 0 < a < 255:
                # désature la frange rose : moyenne vers le gris de la luminance
                l = int(0.3 * r + 0.59 * g + 0.11 * b)
                r, g, b = (r + l) // 2, (g + l) // 2, (b + l) // 2
            po[x, y] = (r, g, b, a)
    bbox = out.getbbox()
    if bbox:
        out = out.crop(bbox)
    out.thumbnail((TAILLE, TAILLE), Image.LANCZOS)
    cible = OUT / f'{png.stem}.webp'
    out.save(cible, 'WEBP', quality=90, method=6)
    return cible

if __name__ == '__main__':
    pngs = sorted(SRC.glob('*.png'))
    if not pngs:
        raise SystemExit(f'aucun PNG dans {SRC}')
    for p in pngs:
        c = detourer(p)
        print(f'✓ {c.name} {Image.open(c).size}')
```

- [ ] **Step 4 : Générer (6 × 0,04 $ ≈ 0,24 $), détourer, contrôler**

Run : préflight (`KIE_API_KEY` présente, solde), puis `bash scripts/sprites.sh && python3 scripts/chromakey.py && ls -la public/media/jeu`
Expected : `récap : 6 générées, 0 en échec`, 6 WebP RGBA ≤ 256 px. Lire les 6 PNG sources (fond magenta uni ?) et les 6 WebP (Read) : sujet entier, contour net, aucun halo magenta visible. Un fond non uni (dégradé, ombre) → supprimer le PNG et relancer avec le sujet reformulé (« on a flat solid magenta background, the background is one single color »). Contrôle machine : `python3 -c "from PIL import Image; im=Image.open('public/media/jeu/avatar.webp'); print(im.mode, im.size, im.getpixel((0,0)))"` → `RGBA`, alpha 0 au coin.

- [ ] **Step 5 : Commit**

```bash
git add scripts/sprites.txt scripts/sprites.sh scripts/chromakey.py public/media/jeu
git commit -m "feat: sprites du jeu Nakama Run (6, chroma-key magenta → WebP alpha)"
```

---

### Task 2 : Serveur de scores (Hono) et ses tests

**Files:**
- Create: `server/package.json`, `server/scores.mjs`, `server/scores.test.mjs`, `server/index.mjs`
- Modify: `package.json` (scripts), `.gitignore` (+ `data/`, `server/node_modules/`), `astro.config.mjs` (proxy)

- [ ] **Step 1 : Écrire `server/package.json` puis installer**

```json
{
  "name": "dailypopsociety-server",
  "private": true,
  "type": "module",
  "engines": { "node": ">=22" },
  "scripts": { "start": "node index.mjs", "test": "node --test" },
  "dependencies": {
    "@hono/node-server": "^1.13.0",
    "hono": "^4.6.0"
  }
}
```

Run : `cd server && npm install --package-lock-only && npm ci` (crée `package-lock.json` et `server/node_modules/`). Ajouter `data/` et `server/node_modules/` à `.gitignore`.

- [ ] **Step 2 : Écrire le test `server/scores.test.mjs` (il doit ÉCHOUER : module absent)**

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { validerEnvoi, moisCourant, Stockage, LimiteurDebit } from './scores.mjs';

test('validerEnvoi accepte un envoi correct et normalise le pseudo', () => {
  const r = validerEnvoi({ pseudo: '  Luffy  du Quai ', score: 420, duree: 31 });
  assert.equal(r.ok, true);
  assert.deepEqual(r.valeur, { pseudo: 'Luffy du Quai', score: 420, duree: 31 });
});

test('validerEnvoi refuse pseudo trop court, trop long, caractères interdits, mot refusé', () => {
  for (const pseudo of ['L', 'a'.repeat(13), 'Luffy<b>', 'connard']) {
    const r = validerEnvoi({ pseudo, score: 10, duree: 5 });
    assert.equal(r.ok, false, pseudo);
  }
});

test('validerEnvoi borne score et durée, et applique le plafond 110 × durée + 50', () => {
  assert.equal(validerEnvoi({ pseudo: 'Zoro', score: -1, duree: 10 }).ok, false);
  assert.equal(validerEnvoi({ pseudo: 'Zoro', score: 10.5, duree: 10 }).ok, false);
  assert.equal(validerEnvoi({ pseudo: 'Zoro', score: 100, duree: 2 }).ok, false);
  assert.equal(validerEnvoi({ pseudo: 'Zoro', score: 100, duree: 181 }).ok, false);
  assert.equal(validerEnvoi({ pseudo: 'Zoro', score: 1151, duree: 10 }).ok, false);
  assert.equal(validerEnvoi({ pseudo: 'Zoro', score: 1150, duree: 10 }).ok, true);
});

test('moisCourant rend AAAA-MM en heure de Bruxelles', () => {
  assert.match(moisCourant(new Date('2026-10-31T23:30:00Z')), /^2026-11$/); // 00:30 le 1er nov. à Bruxelles
  assert.equal(moisCourant(new Date('2026-10-15T12:00:00Z')), '2026-10');
});

test('Stockage : ajoute, trie, plafonne à 100, sépare les mois, rend le rang', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'dps-'));
  try {
    const s = new Stockage(dir);
    const r1 = await s.ajouter('2026-10', { pseudo: 'Nami', score: 300, duree: 20 });
    const r2 = await s.ajouter('2026-10', { pseudo: 'Zoro', score: 900, duree: 40 });
    assert.equal(r1.rang, 1);
    assert.equal(r2.rang, 1);
    const top = await s.top('2026-10', 10);
    assert.deepEqual(top.map((e) => e.pseudo), ['Zoro', 'Nami']);
    assert.ok(top[0].date);
    for (let i = 0; i < 120; i++) await s.ajouter('2026-10', { pseudo: `Bot${i}`, score: 1000 + i, duree: 60 });
    const fichier = JSON.parse(await readFile(join(dir, 'scores-2026-10.json'), 'utf8'));
    assert.equal(fichier.scores.length, 100);
    assert.equal(fichier.mois, '2026-10');
    assert.equal(fichier.scores[0].score, 1119);
    assert.equal((await s.top('2026-11', 10)).length, 0);
    const rangBas = await s.ajouter('2026-10', { pseudo: 'Usopp', score: 5, duree: 4 });
    assert.equal(rangBas.rang, 101); // hors top 100 : rang calculé, non conservé
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test('Stockage : écritures concurrentes sérialisées, aucune perte', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'dps-'));
  try {
    const s = new Stockage(dir);
    await Promise.all(Array.from({ length: 25 }, (_, i) => s.ajouter('2026-10', { pseudo: `P${i}`, score: i, duree: 5 })));
    assert.equal((await s.top('2026-10', 100)).length, 25);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test('LimiteurDebit : un envoi par fenêtre et par clé', () => {
  let t = 1000;
  const l = new LimiteurDebit(20_000, () => t);
  assert.equal(l.autorise('1.1.1.1'), true);
  assert.equal(l.autorise('1.1.1.1'), false);
  assert.equal(l.autorise('2.2.2.2'), true);
  t += 20_001;
  assert.equal(l.autorise('1.1.1.1'), true);
});
```

Run : `cd server && node --test` → Expected : échec `Cannot find module './scores.mjs'`.

- [ ] **Step 3 : Écrire `server/scores.mjs`**

```js
// Validation et stockage des scores — fonctions pures + une classe de stockage
// fichier (un JSON par mois, écriture atomique, écritures sérialisées).
import { mkdir, readFile, writeFile, rename } from 'node:fs/promises';
import { join } from 'node:path';

export const PSEUDO_MIN = 2;
export const PSEUDO_MAX = 12;
export const DUREE_MIN = 3;
export const DUREE_MAX = 180;
export const TOP_CONSERVE = 100;
const PSEUDO_RE = /^[\p{L}\p{N} _-]+$/u;
const MOTS_REFUSES = ['connard', 'connasse', 'salope', 'pute', 'enculé', 'encule', 'nique', 'hitler', 'nazi'];

/** Plafond de score plausible pour une durée de partie (px/s max + bonus). */
export const plafond = (duree) => 110 * duree + 50;

export function validerEnvoi(corps) {
  if (!corps || typeof corps !== 'object') return { ok: false, erreur: 'corps invalide' };
  const pseudo = String(corps.pseudo ?? '').replace(/\s+/g, ' ').trim();
  const score = corps.score;
  const duree = corps.duree;
  if (pseudo.length < PSEUDO_MIN || pseudo.length > PSEUDO_MAX) return { ok: false, erreur: `pseudo : ${PSEUDO_MIN} à ${PSEUDO_MAX} caractères` };
  if (!PSEUDO_RE.test(pseudo)) return { ok: false, erreur: 'pseudo : lettres, chiffres, espace, tiret ou souligné' };
  const bas = pseudo.toLowerCase();
  if (MOTS_REFUSES.some((m) => bas.includes(m))) return { ok: false, erreur: 'pseudo refusé' };
  if (!Number.isInteger(score) || score < 0) return { ok: false, erreur: 'score : entier positif' };
  if (!Number.isInteger(duree) || duree < DUREE_MIN || duree > DUREE_MAX) return { ok: false, erreur: `durée : ${DUREE_MIN} à ${DUREE_MAX} s` };
  if (score > plafond(duree)) return { ok: false, erreur: 'score invraisemblable pour cette durée' };
  return { ok: true, valeur: { pseudo, score, duree } };
}

/** Mois courant en Europe/Brussels, au format AAAA-MM. */
export function moisCourant(date = new Date()) {
  return new Intl.DateTimeFormat('sv-SE', { timeZone: 'Europe/Brussels', year: 'numeric', month: '2-digit' }).format(date);
}

export const MOIS_RE = /^\d{4}-(0[1-9]|1[0-2])$/;

export class Stockage {
  #dir;
  #file = Promise.resolve();
  constructor(dir) { this.#dir = dir; }

  #chemin(mois) { return join(this.#dir, `scores-${mois}.json`); }

  async #lire(mois) {
    try {
      const d = JSON.parse(await readFile(this.#chemin(mois), 'utf8'));
      return Array.isArray(d.scores) ? d.scores : [];
    } catch (e) {
      if (e.code === 'ENOENT') return [];
      throw e;
    }
  }

  async #ecrire(mois, scores) {
    await mkdir(this.#dir, { recursive: true });
    const cible = this.#chemin(mois);
    const tmp = `${cible}.${process.pid}.${Date.now()}.tmp`;
    await writeFile(tmp, JSON.stringify({ mois, scores }, null, 2), 'utf8');
    await rename(tmp, cible);
  }

  /** Sérialise les écritures : chaque ajout attend le précédent. */
  #enFile(fn) {
    const p = this.#file.then(fn, fn);
    this.#file = p.catch(() => {});
    return p;
  }

  async top(mois, n = 10) {
    const scores = await this.#lire(mois);
    return scores.slice(0, n).map(({ pseudo, score, date }) => ({ pseudo, score, date }));
  }

  async total(mois) { return (await this.#lire(mois)).length; }

  /** Ajoute une entrée, renvoie { rang, top } — rang 1 = meilleur. */
  ajouter(mois, { pseudo, score, duree }) {
    return this.#enFile(async () => {
      const scores = await this.#lire(mois);
      const entree = { pseudo, score, duree, date: new Date().toISOString() };
      const rang = scores.filter((e) => e.score > score).length + 1;
      scores.push(entree);
      scores.sort((a, b) => b.score - a.score || a.date.localeCompare(b.date));
      scores.length = Math.min(scores.length, TOP_CONSERVE);
      await this.#ecrire(mois, scores);
      return { rang, top: scores.slice(0, 10).map(({ pseudo, score, date }) => ({ pseudo, score, date })) };
    });
  }
}

/** Un envoi par fenêtre (ms) et par clé ; horloge injectable pour les tests. */
export class LimiteurDebit {
  #fenetre; #horloge; #dernier = new Map();
  constructor(fenetreMs = 20_000, horloge = () => Date.now()) { this.#fenetre = fenetreMs; this.#horloge = horloge; }
  autorise(cle) {
    const t = this.#horloge();
    const d = this.#dernier.get(cle);
    if (d !== undefined && t - d < this.#fenetre) return false;
    this.#dernier.set(cle, t);
    if (this.#dernier.size > 5000) for (const [k, v] of this.#dernier) if (t - v > this.#fenetre) this.#dernier.delete(k);
    return true;
  }
}
```

Run : `cd server && node --test` → Expected : 7 tests, tous verts.

- [ ] **Step 4 : Écrire `server/index.mjs`**

```js
// Serveur unique : API des scores + site statique (dist/) avec les en-têtes
// de l'ancien nginx.conf. Aucune base de données : un JSON par mois dans DATA_DIR.
import { Hono } from 'hono';
import { serve } from '@hono/node-server';
import { serveStatic } from '@hono/node-server/serve-static';
import { readFile, stat } from 'node:fs/promises';
import { join, extname, resolve } from 'node:path';
import { validerEnvoi, moisCourant, MOIS_RE, Stockage, LimiteurDebit } from './scores.mjs';

const PORT = Number(process.env.PORT ?? 80);
const DIST = resolve(process.env.DIST_DIR ?? join(import.meta.dirname, '..', 'dist'));
const DATA = resolve(process.env.DATA_DIR ?? join(import.meta.dirname, '..', 'data'));
const MAQUETTE = process.env.MAQUETTE === '1';

const stockage = new Stockage(DATA);
const limiteur = new LimiteurDebit(20_000);
const app = new Hono();

const SECURITE = {
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'X-Frame-Options': 'SAMEORIGIN',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
};

app.use('*', async (c, next) => {
  await next();
  for (const [k, v] of Object.entries(SECURITE)) c.header(k, v);
  if (MAQUETTE) c.header('X-Robots-Tag', 'noindex'); // MAQUETTE : à retirer en production
});

app.get('/health', (c) => c.text('ok'));

const ip = (c) => (c.req.header('x-forwarded-for') ?? '').split(',')[0].trim() || c.env?.incoming?.socket?.remoteAddress || 'inconnu';

app.get('/api/scores', async (c) => {
  const mois = c.req.query('mois') ?? moisCourant();
  if (!MOIS_RE.test(mois)) return c.json({ erreur: 'mois invalide' }, 400);
  const [top, total] = await Promise.all([stockage.top(mois, 10), stockage.total(mois)]);
  c.header('Cache-Control', 'no-store');
  return c.json({ mois, top, total });
});

app.post('/api/scores', async (c) => {
  if (Number(c.req.header('content-length') ?? 0) > 1024) return c.json({ erreur: 'corps trop long' }, 413);
  let corps;
  try { corps = await c.req.json(); } catch { return c.json({ erreur: 'JSON attendu' }, 400); }
  const v = validerEnvoi(corps);
  if (!v.ok) return c.json({ erreur: v.erreur }, 400);
  if (!limiteur.autorise(ip(c))) return c.json({ erreur: 'trop d\'envois, réessaie dans 20 secondes' }, 429);
  const mois = moisCourant();
  const { rang, top } = await stockage.ajouter(mois, v.valeur);
  c.header('Cache-Control', 'no-store');
  return c.json({ mois, rang, top }, 201);
});

app.notFound(async (c) => {
  if (c.req.path.startsWith('/api/')) return c.json({ erreur: 'route inconnue' }, 404);
  const html = await readFile(join(DIST, '404.html'), 'utf8').catch(() => 'Page introuvable');
  c.header('Cache-Control', 'no-cache');
  return c.html(html, 404);
});

/* Cache : assets Astro hachés immuables, médias 30 j, HTML revalidé. */
app.use('*', async (c, next) => {
  await next();
  const p = c.req.path;
  if (c.res.status !== 200) return;
  if (p.startsWith('/_astro/')) c.header('Cache-Control', 'public, max-age=31536000, immutable');
  else if (p.startsWith('/media/')) c.header('Cache-Control', 'public, max-age=2592000');
  else if (p.endsWith('/') || p.endsWith('.html')) c.header('Cache-Control', 'no-cache');
});

/* /la-carte → /la-carte/ (le sitemap et les liens internes ont le slash) */
app.use('*', async (c, next) => {
  const p = c.req.path;
  if (p !== '/' && !p.endsWith('/') && !extname(p) && !p.startsWith('/api/')) {
    const index = join(DIST, p, 'index.html');
    if (await stat(index).then((s) => s.isFile()).catch(() => false)) return c.redirect(`${p}/`, 301);
  }
  await next();
});

app.use('*', serveStatic({ root: DIST, rewriteRequestPath: (p) => (p.endsWith('/') ? `${p}index.html` : p) }));

serve({ fetch: app.fetch, port: PORT }, (info) => {
  console.log(`dailypopsociety : http://localhost:${info.port} — dist=${DIST} data=${DATA}${MAQUETTE ? ' (maquette, noindex)' : ''}`);
});
```

⚠️ `serveStatic` de `@hono/node-server` attend un `root` **relatif au cwd** dans certaines versions : si les pages répondent 404 en local, utilise `root: relative(process.cwd(), DIST)` (`import { relative } from 'node:path'`) — vérifie au Step 6 et garde la forme qui marche, avec un commentaire.

- [ ] **Step 5 : Scripts, gitignore, proxy Vite**

`package.json` (racine) : ajouter `"dev:api": "cross-env PORT=4340 DATA_DIR=./data node server/index.mjs"` — sans `cross-env` (pas de dépendance de plus) : `"dev:api": "node --env-file=server/.env.dev server/index.mjs"` avec `server/.env.dev` contenant `PORT=4340` et `DATA_DIR=./data` et `DIST_DIR=./dist` (fichier committé, sans secret) ; `"test": "pnpm check && pnpm build && pnpm verifier && cd server && node --test"`.

`astro.config.mjs` : dans `defineConfig`, `vite: { server: { proxy: { '/api': 'http://localhost:4340' } } }`.

`.gitignore` : ajouter `data/` et `server/node_modules/`.

- [ ] **Step 6 : Test d'intégration en local**

Run (après `pnpm build`) : `pnpm dev:api` en `run_in_background: true`, puis
```bash
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:4340/health
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:4340/la-carte/
curl -s -o /dev/null -w "%{http_code} %{redirect_url}\n" http://localhost:4340/la-carte
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:4340/nimportequoi
curl -s -D - -o /dev/null http://localhost:4340/ | grep -iE "cache-control|x-content"
curl -s -X POST -H "Content-Type: application/json" -d '{"pseudo":"Luffy","score":420,"duree":31}' http://localhost:4340/api/scores
curl -s -X POST -H "Content-Type: application/json" -d '{"pseudo":"Luffy","score":420,"duree":31}' -o /dev/null -w "%{http_code}\n" http://localhost:4340/api/scores
curl -s -X POST -H "Content-Type: application/json" -d '{"pseudo":"L","score":1,"duree":3}' -o /dev/null -w "%{http_code}\n" http://localhost:4340/api/scores
curl -s http://localhost:4340/api/scores
cat data/scores-*.json
```
Expected : 200, 200, `301 http://localhost:4340/la-carte/`, 404, `no-cache` + `nosniff`, `{"mois":"2026-09","rang":1,"top":[…]}`, 429, 400, le top avec Luffy, le fichier JSON trié.

- [ ] **Step 7 : Commit**

```bash
git add server/package.json server/package-lock.json server/scores.mjs server/scores.test.mjs server/index.mjs server/.env.dev package.json astro.config.mjs .gitignore
git commit -m "feat: serveur Hono — site statique + API des scores en JSON par mois, tests"
```

---

### Task 3 : Moteur du jeu, borne et intégration au hero

**Files:**
- Create: `src/lib/jeu/moteur.ts`, `src/lib/jeu/borne.ts`, `src/components/Borne.astro`
- Modify: `src/components/Generique.astro` (bouton START, ligne top 3, tween), `src/pages/index.astro` (`<Borne />`), `src/styles/global.css` (`.borne` dans le bloc des surfaces sombres), `scripts/verifier.mjs`

- [ ] **Step 1 : Étendre le contrôleur (doit ÉCHOUER avant l'implémentation)**

Dans `scripts/verifier.mjs`, après la boucle des pages :
```js
// Le jeu : sprites, borne et bouton START dans l'accueil, aucune route /api dans le sitemap
for (const s of ['avatar', 'tonneau', 'boulet', 'burger', 'bubble-tea', 'cocktail']) ok(existsSync(join(DIST, 'media', 'jeu', `${s}.webp`)), `sprite manquant : ${s}.webp`);
const accueil = readFileSync(join(DIST, 'index.html'), 'utf8');
ok(accueil.includes('id="borne"') && accueil.includes('id="gen-start"'), 'accueil : borne ou bouton START absent');
if (existsSync(join(DIST, 'sitemap-0.xml'))) ok(!readFileSync(join(DIST, 'sitemap-0.xml'), 'utf8').includes('/api/'), 'sitemap : une route /api/ y figure');
```
Run : `pnpm build && pnpm verifier` → Expected : `accueil : borne ou bouton START absent` (les sprites existent depuis la Task 1).

- [ ] **Step 2 : Écrire `src/lib/jeu/moteur.ts`**

```ts
/* Nakama Run — moteur du runner. Aucune dépendance : canvas 2D + rAF.
   Coordonnées logiques 960×540 ; les entités portent leur ligne de PIED (y)
   et se dessinent au-dessus (y - h). Le score = distance/10 + bonus. */

export const LARGEUR = 960;
export const HAUTEUR = 540;
const SOL = 440;
const GRAVITE = 2200;
const SAUT = -820;
const V0 = 320;
const VMAX = 760;
const ACCEL = 8;
const COYOTE = 0.08;
const BONUS: Record<string, number> = { burger: 10, 'bubble-tea': 20, cocktail: 30 };
export const SPRITES = ['avatar', 'tonneau', 'boulet', 'burger', 'bubble-tea', 'cocktail'] as const;
export type NomSprite = (typeof SPRITES)[number];
export type Sprites = Partial<Record<NomSprite, HTMLImageElement>>;
export type Etat = 'pret' | 'en-cours' | 'fini';

export interface Options {
  reduced: boolean;
  onScore?: (score: number, temps: number) => void;
  onFin?: (score: number, dureeSecondes: number) => void;
}
export interface Jeu {
  demarrer(): void;
  sauter(): void;
  arreter(): void;
  detruire(): void;
  etat(): Etat;
}

interface Entite { type: string; x: number; y: number; w: number; h: number; vx: number }

/* Charge les sprites ; un sprite absent donne undefined (repli en formes pleines). */
export function chargerSprites(base = '/media/jeu/'): Promise<Sprites> {
  return Promise.all(
    SPRITES.map(
      (nom) =>
        new Promise<[NomSprite, HTMLImageElement | undefined]>((res) => {
          const img = new Image();
          img.onload = () => res([nom, img]);
          img.onerror = () => res([nom, undefined]);
          img.src = `${base}${nom}.webp`;
        })
    )
  ).then((paires) => Object.fromEntries(paires.filter(([, i]) => i)) as Sprites);
}

const COULEURS: Record<string, string> = { avatar: '#E3A1AB', tonneau: '#8B5A2B', boulet: '#0E0E0E', burger: '#C97A2B', 'bubble-tea': '#F2B632', cocktail: '#5CB85C' };

export function creerJeu(canvas: HTMLCanvasElement, sprites: Sprites, opts: Options): Jeu {
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('canvas 2D indisponible');
  let etat: Etat = 'pret';
  let raf = 0;
  let tPrev = 0;
  let temps = 0;
  let vitesse = V0;
  let distance = 0;
  let bonus = 0;
  let score = 0;
  let prochainObstacle = 1.2;
  let prochainBonus = 1.5;
  let decor = 0;
  const joueur = { x: 140, y: SOL, w: 72, h: 88, vy: 0, auSol: true, coyote: 0 };
  let obstacles: Entite[] = [];
  let bonusListe: Entite[] = [];
  const alea = (a: number, b: number) => a + Math.random() * (b - a);

  function redimensionner() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = LARGEUR * dpr;
    canvas.height = HAUTEUR * dpr;
    ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function reinitialiser() {
    temps = 0; vitesse = V0; distance = 0; bonus = 0; score = 0;
    prochainObstacle = 1.2; prochainBonus = 1.5; decor = 0;
    Object.assign(joueur, { y: SOL, vy: 0, auSol: true, coyote: 0 });
    obstacles = []; bonusListe = [];
  }

  function demarrer() {
    if (etat === 'en-cours') return;
    reinitialiser();
    etat = 'en-cours';
    tPrev = performance.now();
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(boucle);
  }

  function sauter() {
    if (etat === 'pret') { demarrer(); return; }
    if (etat !== 'en-cours') return;
    if (joueur.auSol || joueur.coyote > 0) {
      joueur.vy = SAUT; joueur.auSol = false; joueur.coyote = 0;
    }
  }

  function fin() {
    etat = 'fini';
    cancelAnimationFrame(raf);
    dessiner();
    opts.onFin?.(score, Math.max(1, Math.round(temps)));
  }

  function arreter() {
    if (etat === 'en-cours') { etat = 'pret'; cancelAnimationFrame(raf); reinitialiser(); dessiner(); }
  }

  const chevauche = (a: { x: number; y: number; w: number; h: number }, b: { x: number; y: number; w: number; h: number }) =>
    a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;

  function maj(dt: number) {
    temps += dt;
    vitesse = Math.min(VMAX, vitesse + ACCEL * dt);
    distance += vitesse * dt;
    decor += vitesse * dt;

    joueur.vy += GRAVITE * dt;
    joueur.y += joueur.vy * dt;
    if (joueur.y >= SOL) { joueur.y = SOL; joueur.vy = 0; joueur.auSol = true; }
    else if (joueur.auSol) { joueur.auSol = false; joueur.coyote = COYOTE; }
    if (!joueur.auSol) joueur.coyote = Math.max(0, joueur.coyote - dt);

    prochainObstacle -= dt;
    if (prochainObstacle <= 0) {
      const boulet = temps > 8 && Math.random() < 0.35;
      obstacles.push(boulet ? { type: 'boulet', x: LARGEUR + 40, y: SOL, w: 44, h: 44, vx: 1.35 } : { type: 'tonneau', x: LARGEUR + 40, y: SOL, w: 58, h: 66, vx: 1 });
      prochainObstacle = Math.max(0.75, 1.6 - temps * 0.02) * alea(0.85, 1.35);
    }
    prochainBonus -= dt;
    if (prochainBonus <= 0) {
      const types = ['burger', 'bubble-tea', 'cocktail'];
      bonusListe.push({ type: types[Math.floor(Math.random() * 3)], x: LARGEUR + 40, y: SOL - (Math.random() < 0.5 ? 60 : 150), w: 44, h: 44, vx: 1 });
      prochainBonus = alea(1.2, 2.5);
    }

    for (const o of obstacles) o.x -= vitesse * o.vx * dt;
    for (const b of bonusListe) b.x -= vitesse * dt;
    obstacles = obstacles.filter((o) => o.x + o.w > -20);
    bonusListe = bonusListe.filter((b) => b.x + b.w > -20);

    const j = { x: joueur.x + 12, y: joueur.y - joueur.h + 10, w: joueur.w - 24, h: joueur.h - 14 };
    for (const o of obstacles) {
      if (chevauche(j, { x: o.x + 6, y: o.y - o.h + 6, w: o.w - 12, h: o.h - 8 })) { fin(); return; }
    }
    bonusListe = bonusListe.filter((b) => {
      if (chevauche(j, { x: b.x, y: b.y - b.h, w: b.w, h: b.h })) { bonus += BONUS[b.type] ?? 0; return false; }
      return true;
    });
    score = Math.floor(distance / 10) + bonus;
    opts.onScore?.(score, temps);
  }

  function sprite(nom: string, x: number, pied: number, w: number, h: number) {
    const img = sprites[nom as NomSprite];
    if (img) ctx!.drawImage(img, x, pied - h, w, h);
    else { ctx!.fillStyle = COULEURS[nom] ?? '#fff'; ctx!.fillRect(x, pied - h, w, h); }
  }

  function dessiner() {
    const c = ctx!;
    const p = opts.reduced ? 0 : decor;
    // ciel
    const ciel = c.createLinearGradient(0, 0, 0, SOL);
    ciel.addColorStop(0, '#7B1E2B'); ciel.addColorStop(0.55, '#B4162F'); ciel.addColorStop(1, '#E3A1AB');
    c.fillStyle = ciel; c.fillRect(0, 0, LARGEUR, HAUTEUR);
    // nuages (parallaxe 0,2)
    c.fillStyle = 'rgba(255,255,255,0.22)';
    for (let i = 0; i < 6; i++) {
      const x = ((i * 230 - p * 0.2) % (LARGEUR + 260) + LARGEUR + 260) % (LARGEUR + 260) - 130;
      const y = 60 + (i % 3) * 55;
      c.beginPath(); c.ellipse(x, y, 70, 22, 0, 0, Math.PI * 2); c.ellipse(x + 40, y - 12, 45, 20, 0, 0, Math.PI * 2); c.fill();
    }
    // mouettes (parallaxe 0,35)
    c.strokeStyle = 'rgba(255,255,255,0.7)'; c.lineWidth = 2;
    for (let i = 0; i < 3; i++) {
      const x = ((i * 380 - p * 0.35) % (LARGEUR + 100) + LARGEUR + 100) % (LARGEUR + 100) - 50;
      const y = 120 + i * 40 + Math.sin(temps * 4 + i) * 6;
      c.beginPath(); c.moveTo(x - 12, y); c.quadraticCurveTo(x - 6, y - 8, x, y); c.quadraticCurveTo(x + 6, y - 8, x + 12, y); c.stroke();
    }
    // mer (parallaxe 0,5)
    c.fillStyle = '#4E0F1A'; c.fillRect(0, SOL - 70, LARGEUR, 70);
    c.fillStyle = 'rgba(255,255,255,0.12)';
    for (let i = 0; i < 12; i++) {
      const x = ((i * 100 - p * 0.5) % (LARGEUR + 100) + LARGEUR + 100) % (LARGEUR + 100) - 50;
      c.fillRect(x, SOL - 58 + (i % 2) * 18, 60, 4);
    }
    // pont (parallaxe 1)
    c.fillStyle = '#6B4423'; c.fillRect(0, SOL, LARGEUR, HAUTEUR - SOL);
    c.fillStyle = '#5A3719';
    for (let i = 0; i < 14; i++) {
      const x = ((i * 80 - p) % (LARGEUR + 80) + LARGEUR + 80) % (LARGEUR + 80) - 40;
      c.fillRect(x, SOL, 3, HAUTEUR - SOL);
    }
    c.fillStyle = '#0E0E0E'; c.fillRect(0, SOL - 4, LARGEUR, 4);
    // entités
    for (const b of bonusListe) sprite(b.type, b.x, b.y + Math.sin(temps * 6 + b.x) * 4, b.w, b.h);
    for (const o of obstacles) sprite(o.type, o.x, o.y, o.w, o.h);
    const bob = joueur.auSol && etat === 'en-cours' ? Math.sin(temps * 18) * 3 : 0;
    sprite('avatar', joueur.x, joueur.y + bob, joueur.w, joueur.h);
  }

  function boucle(t: number) {
    const dt = Math.min(0.05, (t - tPrev) / 1000);
    tPrev = t;
    maj(dt);
    if (etat === 'en-cours') { dessiner(); raf = requestAnimationFrame(boucle); }
  }

  const surTouche = (e: KeyboardEvent) => {
    if (e.key === ' ' || e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') { e.preventDefault(); sauter(); }
  };
  const surPointeur = (e: PointerEvent) => { e.preventDefault(); canvas.focus(); sauter(); };
  canvas.addEventListener('pointerdown', surPointeur);
  canvas.addEventListener('keydown', surTouche);
  window.addEventListener('resize', redimensionner);
  redimensionner();
  reinitialiser();
  dessiner();

  return {
    demarrer,
    sauter,
    arreter,
    detruire() {
      cancelAnimationFrame(raf);
      canvas.removeEventListener('pointerdown', surPointeur);
      canvas.removeEventListener('keydown', surTouche);
      window.removeEventListener('resize', redimensionner);
    },
    etat: () => etat,
  };
}
```

- [ ] **Step 3 : Écrire `src/components/Borne.astro`**

```astro
---
/* La borne : calque plein écran ouvert par le bouton START du générique.
   Déplacée dans <body> au boot (borne.ts) pour pouvoir rendre le reste inert. */
---
<div class="borne" id="borne" hidden role="dialog" aria-modal="true" aria-labelledby="borne-titre">
  <div class="borne__cadre">
    <header class="borne__tete">
      <div>
        <span class="kicker">Nakama Run</span>
        <h2 id="borne-titre" class="titre titre--sm">Saute, attrape, <em>marque</em></h2>
      </div>
      <p class="borne__aide">Espace, flèche haut ou tap pour sauter.</p>
      <button type="button" class="borne__fermer" id="borne-fermer" aria-label="Fermer le jeu">✕</button>
    </header>
    <div class="borne__corps">
      <section class="borne__jeu" aria-label="Zone de jeu">
        <div class="borne__hud" aria-hidden="true">
          <span>Score <b id="borne-score">0</b></span>
          <span>Temps <b id="borne-temps">0</b> s</span>
          <span>Record perso <b id="borne-record">0</b></span>
        </div>
        <div class="borne__ecran">
          <canvas id="borne-canvas" width="960" height="540" tabindex="0" role="img" aria-label="Nakama Run : l'avatar du bar court sur le pont d'un navire et saute les tonneaux"></canvas>
          <p class="borne__message" id="borne-message">Appuie sur espace ou tape l'écran pour commencer.</p>
          <form class="borne__fin" id="borne-fin" hidden>
            <p class="borne__fin-score">Score : <b id="borne-fin-score">0</b></p>
            <label for="borne-pseudo">Ton pseudo</label>
            <input id="borne-pseudo" name="pseudo" minlength="2" maxlength="12" required autocomplete="nickname" />
            <div class="actions">
              <button type="submit" class="btn">Envoyer mon score</button>
              <button type="button" class="btn btn--ghost" id="borne-rejouer">Rejouer</button>
            </div>
            <p class="borne__erreur" id="borne-erreur" role="alert"></p>
          </form>
        </div>
        <p class="sr-only" aria-live="polite" id="borne-live"></p>
      </section>
      <aside class="borne__classement" aria-labelledby="borne-top-titre">
        <h3 id="borne-top-titre" class="kicker">Top 10 du mois</h3>
        <ol id="borne-top" role="list" class="borne__liste"></ol>
        <p class="borne__rang" id="borne-rang" hidden></p>
        <p class="borne__note">Classement remis à zéro chaque mois.</p>
      </aside>
    </div>
  </div>
</div>

<style>
  .borne { position: fixed; inset: 0; z-index: 200; overflow: auto; color: var(--txt);
    background: radial-gradient(ellipse at 50% 60%, #9A2334 0%, var(--bdx) 45%, var(--bdx-deep) 100%); }
  .borne__cadre { max-width: 1180px; margin: 0 auto; padding: clamp(16px, 3vw, 32px) var(--gutter); min-height: 100%; display: flex; flex-direction: column; gap: 18px; }
  .borne__tete { display: flex; align-items: flex-end; justify-content: space-between; gap: 16px; flex-wrap: wrap; }
  .borne__aide { font-size: 0.8rem; letter-spacing: 0.12em; text-transform: uppercase; opacity: 0.85; }
  .borne__fermer { width: 44px; height: 44px; border: 2px solid var(--blanc); font-size: 1.2rem; line-height: 1; background: rgba(0, 0, 0, 0.25); }
  .borne__fermer:hover { background: var(--blanc); color: var(--noir); }
  .borne__corps { display: grid; grid-template-columns: 1.7fr 1fr; gap: clamp(18px, 3vw, 36px); align-items: start; }
  .borne__hud { display: flex; gap: 22px; font-family: var(--font-title); font-size: 1.1rem; letter-spacing: 0.08em; text-transform: uppercase; margin-bottom: 8px; }
  .borne__hud b { color: var(--accent); }
  .borne__ecran { position: relative; border: var(--bord); box-shadow: var(--ombre-btn) 8px 8px 0; background: var(--noir); }
  .borne__ecran canvas { display: block; width: 100%; height: auto; aspect-ratio: 16 / 9; cursor: pointer; touch-action: none; }
  .borne__ecran canvas:focus-visible { outline-offset: -4px; }
  .borne__message { position: absolute; left: 0; right: 0; bottom: 14px; text-align: center; font-family: var(--font-title); font-size: clamp(0.9rem, 1.6vw, 1.2rem); letter-spacing: 0.1em; text-transform: uppercase; text-shadow: 0 2px 0 rgba(0, 0, 0, 0.4); pointer-events: none; }
  .borne__fin { position: absolute; inset: 0; display: grid; place-content: center; gap: 12px; padding: 24px; background: rgba(14, 14, 14, 0.88); text-align: center; }
  .borne__fin[hidden] { display: none; }
  .borne__fin-score { font-family: var(--font-title); font-size: clamp(1.6rem, 4vw, 2.8rem); text-transform: uppercase; }
  .borne__fin-score b { color: var(--accent); }
  .borne__fin label { font-size: 0.78rem; letter-spacing: 0.16em; text-transform: uppercase; }
  .borne__fin input { padding: 12px 14px; font: inherit; font-size: 1.1rem; text-align: center; border: var(--bord); background: var(--blanc); color: var(--noir); width: min(100%, 320px); justify-self: center; }
  .borne__fin .actions { margin-top: 6px; justify-content: center; }
  .borne__erreur { min-height: 1.2em; color: var(--accent); font-weight: 600; }
  .borne__classement { border: 2px solid rgba(255, 255, 255, 0.35); padding: 20px; background: rgba(0, 0, 0, 0.22); }
  .borne__liste { display: grid; gap: 6px; counter-reset: rang; }
  .borne__liste li { display: flex; gap: 12px; align-items: baseline; font-size: 1rem; }
  .borne__liste li::before { counter-increment: rang; content: counter(rang) '.'; font-family: var(--font-title); width: 2ch; color: var(--accent); }
  .borne__liste .pseudo { flex: 1; font-weight: 600; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .borne__liste .score { font-family: var(--font-title); letter-spacing: 0.06em; }
  .borne__liste li.moi { color: var(--accent); }
  .borne__rang { margin-top: 12px; font-family: var(--font-title); font-size: 1.2rem; text-transform: uppercase; letter-spacing: 0.06em; }
  .borne__note { margin-top: 12px; font-size: 0.82rem; opacity: 0.75; }
  .borne__vide { opacity: 0.75; font-size: 0.92rem; }
  @media (max-width: 960px) { .borne__corps { grid-template-columns: 1fr; } .borne__hud { font-size: 0.95rem; gap: 14px; } }
</style>
```

Ajouter `.borne` à la liste du bloc « surfaces sombres » de `global.css`.

- [ ] **Step 4 : Écrire `src/lib/jeu/borne.ts`**

```ts
/* Borne : ouverture/fermeture du calque, HUD, fin de partie, envoi du score,
   classement du mois (borne + top 3 du hero). Amélioration progressive :
   sans JS le bouton START n'existe pas (hidden dans le HTML). */
import { chargerSprites, creerJeu, type Jeu } from './moteur';

const CLE_RECORD = 'dps:record';
const CLE_PSEUDO = 'dps:pseudo';
type Entree = { pseudo: string; score: number; date: string };

const lire = (k: string) => { try { return localStorage.getItem(k) ?? ''; } catch { return ''; } };
const ecrire = (k: string, v: string) => { try { localStorage.setItem(k, v); } catch { /* stockage indisponible */ } };
const fmt = (n: number) => n.toLocaleString('fr-BE');

export function initBorne() {
  const borne = document.getElementById('borne');
  const start = document.getElementById('gen-start') as HTMLButtonElement | null;
  const topHero = document.getElementById('gen-top');
  if (!borne || !start) return;
  document.body.append(borne); // hors de <main> : on peut rendre le reste inert

  const $ = <T extends HTMLElement>(id: string) => borne.querySelector<T>(`#${id}`)!;
  const canvas = $<HTMLCanvasElement>('borne-canvas');
  const elScore = $('borne-score'), elTemps = $('borne-temps'), elRecord = $('borne-record');
  const elMessage = $('borne-message'), elLive = $('borne-live');
  const form = $<HTMLFormElement>('borne-fin'), elFinScore = $('borne-fin-score');
  const input = $<HTMLInputElement>('borne-pseudo'), elErreur = $('borne-erreur');
  const elTop = $<HTMLOListElement>('borne-top'), elRang = $('borne-rang');
  const fermerBtn = $('borne-fermer'), rejouerBtn = $('borne-rejouer');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

  let jeu: Jeu | null = null;
  let dernier = { score: 0, duree: 0 };
  let record = Number(lire(CLE_RECORD)) || 0;
  let dernierPseudo = '';
  elRecord.textContent = fmt(record);
  input.value = lire(CLE_PSEUDO);

  function rendreTop(top: Entree[], pseudoMoi = '') {
    elTop.innerHTML = '';
    if (!top.length) { elTop.innerHTML = '<li class="borne__vide">Personne ce mois-ci. Sois le premier.</li>'; return; }
    for (const e of top) {
      const li = document.createElement('li');
      if (pseudoMoi && e.pseudo === pseudoMoi) li.className = 'moi';
      const p = document.createElement('span'); p.className = 'pseudo'; p.textContent = e.pseudo;
      const s = document.createElement('span'); s.className = 'score'; s.textContent = fmt(e.score);
      li.append(p, s); elTop.append(li);
    }
  }

  function rendreTopHero(top: Entree[]) {
    if (!topHero) return;
    if (!top.length) { topHero.hidden = true; return; }
    topHero.textContent = 'Top du mois : ' + top.slice(0, 3).map((e, i) => `${i + 1}. ${e.pseudo} ${fmt(e.score)}`).join(' · ');
    topHero.hidden = false;
  }

  async function chargerTop() {
    try {
      const r = await fetch('/api/scores', { headers: { Accept: 'application/json' } });
      if (!r.ok) throw new Error(String(r.status));
      const d = (await r.json()) as { top: Entree[] };
      rendreTop(d.top, dernierPseudo); rendreTopHero(d.top);
    } catch {
      elTop.innerHTML = '<li class="borne__vide">Classement indisponible pour le moment.</li>';
    }
  }

  function inertReste(on: boolean) {
    for (const el of document.querySelectorAll<HTMLElement>('body > :not(#borne)')) {
      if (el.tagName === 'SCRIPT') continue;
      el.inert = on;
    }
  }

  async function ouvrir() {
    borne.hidden = false;
    document.body.style.overflow = 'hidden';
    inertReste(true);
    if (!jeu) {
      elMessage.textContent = 'Chargement…';
      const sprites = await chargerSprites();
      jeu = creerJeu(canvas, sprites, {
        reduced,
        onScore: (s, t) => { elScore.textContent = fmt(s); elTemps.textContent = String(Math.floor(t)); },
        onFin: (s, d) => finPartie(s, d),
      });
    }
    form.hidden = true; elErreur.textContent = ''; elRang.hidden = true;
    elMessage.hidden = false; elMessage.textContent = 'Appuie sur espace ou tape l\'écran pour commencer.';
    elLive.textContent = 'Jeu ouvert. Espace ou tap pour sauter.';
    canvas.focus();
    chargerTop();
  }

  function fermer() {
    jeu?.arreter();
    borne.hidden = true;
    document.body.style.overflow = '';
    inertReste(false);
    start.focus();
  }

  function finPartie(score: number, duree: number) {
    dernier = { score, duree };
    if (score > record) { record = score; ecrire(CLE_RECORD, String(record)); elRecord.textContent = fmt(record); }
    elMessage.hidden = true;
    elFinScore.textContent = fmt(score);
    elErreur.textContent = '';
    form.hidden = false;
    elLive.textContent = `Partie terminée. Score ${score}. Entre ton pseudo pour le classement.`;
    input.focus();
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const pseudo = input.value.replace(/\s+/g, ' ').trim();
    elErreur.textContent = '';
    try {
      const r = await fetch('/api/scores', { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify({ pseudo, score: dernier.score, duree: dernier.duree }) });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) { elErreur.textContent = (d as { erreur?: string }).erreur ?? 'Envoi impossible.'; return; }
      dernierPseudo = pseudo; ecrire(CLE_PSEUDO, pseudo);
      const { rang, top } = d as { rang: number; top: Entree[] };
      rendreTop(top, pseudo); rendreTopHero(top);
      elRang.textContent = rang === 1 ? 'Tu es en tête du mois.' : `Tu es ${rang}e ce mois-ci.`;
      elRang.hidden = false;
      form.hidden = true;
      elMessage.hidden = false; elMessage.textContent = 'Espace ou tap pour rejouer.';
      elLive.textContent = elRang.textContent;
      canvas.focus();
    } catch {
      elErreur.textContent = 'Classement indisponible, réessaie plus tard.';
    }
  });

  rejouerBtn.addEventListener('click', () => { form.hidden = true; elMessage.hidden = false; jeu?.demarrer(); canvas.focus(); });
  fermerBtn.addEventListener('click', fermer);
  start.addEventListener('click', ouvrir);
  borne.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') { e.preventDefault(); fermer(); return; }
    if (e.key !== 'Tab') return;
    const focalisables = Array.from(borne.querySelectorAll<HTMLElement>('button, input, canvas, [tabindex="0"]')).filter((el) => !el.closest('[hidden]'));
    const premier = focalisables[0], dernierEl = focalisables[focalisables.length - 1];
    if (e.shiftKey && document.activeElement === premier) { e.preventDefault(); dernierEl.focus(); }
    else if (!e.shiftKey && document.activeElement === dernierEl) { e.preventDefault(); premier.focus(); }
  });

  start.hidden = false;
  chargerTop();
}
```

- [ ] **Step 5 : Intégrer au générique et à l'accueil**

`src/components/Generique.astro` :
- Dans `.gen__pied`, après `.gen__carte` : `<button type="button" class="gen__start" id="gen-start" hidden>Start</button>` et, avant `.gen__pied` (élément frère) : `<p class="gen__top" id="gen-top" hidden></p>`.
- CSS : `.gen__start { font-family: var(--font-title); font-size: 1rem; letter-spacing: 0.24em; text-transform: uppercase; padding: 9px 22px; border: var(--bord); background: var(--rouge); color: var(--blanc); box-shadow: var(--ombre-btn) 4px 4px 0; cursor: pointer; }` + `.gen__start:hover { transform: translate(-2px, -2px); }` ; `.gen__top { position: absolute; left: var(--gutter); right: var(--gutter); bottom: clamp(88px, 12vh, 118px); text-align: center; font-size: 0.72rem; letter-spacing: 0.2em; text-transform: uppercase; z-index: 3; opacity: 0.9; }` ; en mobile `.gen__top { font-size: 0.62rem; }` ; pré-paint : `:global(html.js-intro) .gen__start, :global(html.js-intro) .gen__top { opacity: 0; visibility: hidden; }`.
- Script : les tweens qui font entrer `carte` (`autoAlpha`) ciblent `[carte, start, top].filter(Boolean)` (déclarer `const start = gen.querySelector('.gen__start')`, `const top = gen.querySelector('.gen__top')`). Le pied passe en `flex-wrap: wrap; justify-content: center` pour que START tienne à côté de la carte (mobile : sous la carte).
- `src/pages/index.astro` : importer `Borne` et poser `<Borne />` après `<Generique />` ; ajouter un `<script>import { initBorne } from '../lib/jeu/borne'; initBorne();</script>` en bas du fichier (Astro le rend en module client).

- [ ] **Step 6 : Build + contrôle + boucle visuelle**

Run : `pnpm build && pnpm verifier` (les tests serveur passent par `pnpm test`, plus long) → `✓ verifier : 8 pages contrôlées, aucun écart`. `pnpm check` → 0 erreur. Puis `pnpm dev` (4332) et `pnpm dev:api` (4340) en arrière-plan ; captures browse (`jeu-*.png`) :
1. Accueil desktop à la fin du générique : START visible à côté de la title card, ligne « Top du mois » (vide tant qu'aucun score, donc masquée).
2. `["click","#gen-start"]` → la borne : canvas dessiné (ciel bordeaux, mer, pont, avatar), HUD, classement « Personne ce mois-ci ».
3. Partie simulée : `["js","document.querySelector('#borne-canvas').focus()"]`, puis boucle de sauts : `["js","(async()=>{const c=document.querySelector('#borne-canvas');for(let i=0;i<14;i++){c.dispatchEvent(new KeyboardEvent('keydown',{key:' ',bubbles:true}));await new Promise(r=>setTimeout(r,650));}return document.querySelector('#borne-score').textContent})()"]` → capture pendant la partie ; laisser courir jusqu'au game over (ou forcer en n'appuyant plus) ; capture du formulaire de fin.
4. Envoi : `["fill","#borne-pseudo","Luffy"]`, `["click","#borne-fin button[type=submit]"]`, attente 500 ms, capture : classement avec Luffy, rang annoncé, ligne top du hero mise à jour (fermer la borne avec `#borne-fermer` et capturer le pied du générique).
5. Mobile 390 : START sous la carte, borne en une colonne, tap = saut (`pointerdown` sur le canvas).
6. `console --errors` vide ; `document.body.style.overflow` revient à `''` après fermeture ; `document.querySelector('main').inert === false` après fermeture.
Arrêter les deux serveurs à la fin.

- [ ] **Step 7 : Commit**

```bash
git add src scripts/verifier.mjs
git commit -m "feat: Nakama Run — moteur canvas, borne en calque, bouton START et top 3 du mois dans le hero"
```

---

### Task 4 : Image Docker Node, mentions légales, documentation

**Files:**
- Modify: `Dockerfile`, `.dockerignore`, `src/pages/mentions-legales.astro`, `PROJET.md`, `PROJET.html`, `docs/superpowers/specs/2026-09-07-site-dailypopsociety-design.md` (§3 : « jeu en ligne » sort des exclusions, renvoi à la spec du jeu)
- Delete: `nginx.conf`

- [ ] **Step 1 : Réécrire `Dockerfile`**

```dockerfile
# Site statique compilé par Astro, servi par un petit serveur Node (Hono) qui
# porte aussi l'API des scores du jeu (fichier JSON par mois sur le volume /data).
# Aucun secret : MAQUETTE=1 ajoute seulement X-Robots-Tag: noindex.

FROM node:22-alpine AS build
WORKDIR /app
RUN corepack enable
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile
COPY . .
RUN pnpm build

FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production PORT=80 DATA_DIR=/data DIST_DIR=/app/dist
COPY server/package.json server/package-lock.json ./server/
RUN cd server && npm ci --omit=dev
COPY server/*.mjs ./server/
COPY --from=build /app/dist ./dist
RUN mkdir -p /data
VOLUME ["/data"]
EXPOSE 80
CMD ["node", "server/index.mjs"]
```

`.dockerignore` : retirer `scripts` si présent n'est pas nécessaire (le build n'en a pas besoin) ; ajouter `data`, `server/node_modules`, `server/.env.dev`. Supprimer `nginx.conf` (`git rm nginx.conf`).

- [ ] **Step 2 : Build et test de l'image en local**

```bash
docker build -t dps-maquette . && docker run -d --rm --name dps-test -p 8089:80 -e MAQUETTE=1 -v dps-data-test:/data dps-maquette && sleep 2
for u in / /la-carte/ /la-carte /events/ /galerie/ /a-propos/ /contact/ /mentions-legales/ /sitemap-index.xml /robots.txt /media/og.png /media/jeu/avatar.webp /health /api/scores /nimportequoi; do printf "%-24s %s\n" "$u" "$(curl -s -o /dev/null -w '%{http_code}' http://localhost:8089$u)"; done
curl -s -D - -o /dev/null http://localhost:8089/ | grep -iE "cache-control|x-robots|x-content"
curl -s -X POST -H "Content-Type: application/json" -d '{"pseudo":"Test","score":120,"duree":9}' http://localhost:8089/api/scores
docker stop dps-test && docker run -d --rm --name dps-test2 -p 8089:80 -e MAQUETTE=1 -v dps-data-test:/data dps-maquette && sleep 2 && curl -s http://localhost:8089/api/scores && docker stop dps-test2 && docker volume rm dps-data-test
```
Expected : 200 partout, `301` sur `/la-carte`, `404` sur `/nimportequoi` ; `no-cache`, `noindex`, `nosniff` ; `201` avec `rang` ; **après redémarrage, le score « Test » est toujours là** (le volume porte les données).

- [ ] **Step 3 : Mentions légales et documentation**

`src/pages/mentions-legales.astro`, section Vie privée : ajouter « Le mini-jeu Nakama Run enregistre, si tu le souhaites, un pseudo, un score et une date pour le classement du mois ; rien d'autre. Les classements sont remis à zéro chaque mois. Pour retirer un pseudo, écris-nous. »

`PROJET.md` / `PROJET.html` : stack (Hono remplace nginx), démarrage (`pnpm dev:api` en plus de `pnpm dev`, proxy `/api`), architecture (`server/`, `src/lib/jeu/`, `Borne.astro`, `scripts/sprites.*`, `scripts/chromakey.py`), variables d'environnement du serveur (`PORT`, `DATA_DIR`, `DIST_DIR`, `MAQUETTE`), roadmap « Mini-jeu Nakama Run + classement du mois » ✅ Done 2026-09-08, journal, problèmes connus (anti-triche limité aux garde-fous ; modération des pseudos = éditer le JSON du mois sur le volume), déploiement (volume `/data` à déclarer sur l'app Coolify, `MAQUETTE=1` en variable d'environnement, à retirer en prod).

Spec du site §3 : remplacer « jeu en ligne » dans les exclusions par une note « le mini-jeu Nakama Run est spécifié à part (`2026-09-08-jeu-nakama-run-design.md`) ».

- [ ] **Step 4 : `pnpm test` complet, commit**

Run : `pnpm test` → check 0 erreur, build 8 pages, `✓ verifier`, tests serveur verts.
```bash
git add Dockerfile .dockerignore src/pages/mentions-legales.astro PROJET.md PROJET.html docs/superpowers/specs
git rm -q nginx.conf
git commit -m "chore: image Node (Hono) à la place de nginx, mentions légales et doc du jeu"
```

---

### Task 5 : Déploiement de la maquette avec volume, vérification, mémoire

- [ ] **Step 1 : Volume et variable sur l'app Coolify** (app `o129qzwy4inm5tsgfrmqrtw7`, Coolify maquettes `http://46.224.83.139:8000`, jeton dans `~/.claude.json` → `mcpServers.coolify.env.COOLIFY_ACCESS_TOKEN`, jamais affiché) : déclarer un stockage persistant `/data` (nom `dps-scores`, chemin conteneur `/data`) — par l'API `POST /api/v1/applications/{uuid}/storages` si elle existe sur cette version, sinon par l'outil MCP `coolify` (`storages`) qui pointe sur la même instance ; poser la variable d'environnement `MAQUETTE=1` (`POST /api/v1/applications/{uuid}/envs` `{key, value, is_preview:false}`). Vérifier par `GET /api/v1/applications/{uuid}` que le stockage et la variable apparaissent.

- [ ] **Step 2 : Push et redéploiement** : `git push origin HEAD`, `GET /api/v1/deploy?uuid=o129qzwy4inm5tsgfrmqrtw7`, suivre `GET /api/v1/deployments/<deployment_uuid>` jusqu'à `finished`.

- [ ] **Step 3 : Vérification en ligne** : les 8 pages + sitemap + robots + og + `/media/jeu/avatar.webp` en 200, `/la-carte` → 301, 404 réelle, en-têtes (`no-cache`, `noindex`, `nosniff`, `immutable` sur `/_astro/`), `GET /api/scores` → `{"mois":…,"top":[…]}`, `POST` valide → 201, `POST` répété → 429. **Persistance** : envoyer un score « Nakama », redéployer (nouveau `deploy`), relire `GET /api/scores` → le score est toujours là. Au navigateur (browse) : générique intact, START visible, ouverture de la borne, partie simulée, envoi d'un score, ligne top 3 du hero mise à jour, console vide, mobile 390.

- [ ] **Step 4 : Documentation et mémoire** : `PROJET.md`/`PROJET.html` (section Déploiement : volume, variable, procédure) commités et poussés ; mémoire `dailypopsociety-etat-reprise.md` complétée (jeu, serveur Hono, volume, modération des pseudos = fichier JSON du mois, pièges) ; cocher les cases du plan.

---

## Auto-revue du plan (2026-09-08)

- Couverture de la spec du jeu : §3 jeu → Task 3 (`moteur.ts`) ; §4 borne → Task 3 (`Borne.astro`, `borne.ts`, générique) ; §5 API → Task 2 ; §6 serveur et Docker → Tasks 2 et 4 ; §7 vérification → tests unitaires (Task 2), intégration (Tasks 2 et 4), boucle visuelle (Task 3), déploiement et persistance (Task 5) ; sprites → Task 1 ; mentions légales et doc → Task 4.
- Cohérence des noms : `chargerSprites`/`creerJeu`/`Jeu` (`demarrer`, `sauter`, `arreter`, `detruire`, `etat`) définis en Task 3 Step 2 et consommés au Step 4 ; ids DOM (`borne`, `gen-start`, `gen-top`, `borne-*`) identiques entre `Borne.astro`, `borne.ts`, `Generique.astro` et le contrôleur ; `validerEnvoi`, `moisCourant`, `MOIS_RE`, `Stockage`, `LimiteurDebit` exportés par `scores.mjs` et importés par `index.mjs` et les tests ; variables `PORT`, `DATA_DIR`, `DIST_DIR`, `MAQUETTE` identiques entre `index.mjs`, `.env.dev`, `Dockerfile` et la doc.
- Ordre : sprites (1) et serveur (2) indépendants et parallélisables ; la borne (3) a besoin des deux ; l'image (4) a besoin du serveur ; le déploiement (5) de tout.

