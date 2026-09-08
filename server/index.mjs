// Serveur unique : API des scores + site statique (dist/) avec les en-têtes
// de l'ancien nginx.conf. Aucune base de données : un JSON par mois dans DATA_DIR.
import { Hono } from 'hono';
import { serve } from '@hono/node-server';
import { serveStatic } from '@hono/node-server/serve-static';
import { bodyLimit } from 'hono/body-limit';
import { compress } from 'hono/compress';
import { readFile, stat } from 'node:fs/promises';
import { join, extname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { validerEnvoi, moisCourant, MOIS_RE, Stockage, LimiteurDebit } from './scores.mjs';

const PORT = Number(process.env.PORT ?? 80);
const DIST = resolve(process.env.DIST_DIR ?? join(import.meta.dirname, '..', 'dist'));
const DATA = resolve(process.env.DATA_DIR ?? join(import.meta.dirname, '..', 'data'));
const MAQUETTE = process.env.MAQUETTE === '1';
const CORPS_MAX = 1024;

const stockage = new Stockage(DATA);
const limiteur = new LimiteurDebit(20_000);
export const app = new Hono();

const SECURITE = {
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'X-Frame-Options': 'SAMEORIGIN',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
};

// Compression ici, dans le serveur : elle ne dépend d'aucune option Traefik.
app.use('*', compress());

app.use('*', async (c, next) => {
  await next();
  for (const [k, v] of Object.entries(SECURITE)) c.header(k, v);
  if (MAQUETTE) c.header('X-Robots-Tag', 'noindex'); // MAQUETTE : à retirer en production
});

app.get('/health', (c) => c.text('ok'));

/* Derrière Traefik, x-forwarded-for est « client, proxy1, proxy2… » : le client
   peut en forger le début, mais pas la DERNIÈRE valeur, écrite par notre proxy. */
const ip = (c) => {
  const chaine = c.req.header('x-forwarded-for');
  const dernier = chaine?.split(',').pop()?.trim();
  return dernier || c.env?.incoming?.socket?.remoteAddress || 'inconnu';
};

/* Le POST vient de la page du jeu, pas d'un autre site ni d'un formulaire tiers. */
const memeOrigine = (c) => {
  const site = c.req.header('sec-fetch-site');
  if (site && site !== 'same-origin' && site !== 'none') return false;
  const origine = c.req.header('origin');
  if (!origine) return true;
  // c.req.url est construit à partir de l'en-tête Host par @hono/node-server ;
  // le repli sert aux appels directs à app.request() (tests).
  const hote = c.req.header('host') ?? new URL(c.req.url).host;
  try { return new URL(origine).host === hote; } catch { return false; }
};

app.get('/api/scores', async (c) => {
  const mois = c.req.query('mois') ?? moisCourant();
  if (!MOIS_RE.test(mois)) return c.json({ erreur: 'mois invalide' }, 400);
  // « conserves » et non « total » : au-delà de 100 entrées, le fichier est
  // tronqué — ce nombre est celui des scores gardés, pas des parties jouées.
  const [top, conserves] = await Promise.all([stockage.top(mois, 10), stockage.conserves(mois)]);
  c.header('Cache-Control', 'no-store');
  return c.json({ mois, top, conserves });
});

app.post(
  '/api/scores',
  bodyLimit({ maxSize: CORPS_MAX, onError: (c) => c.json({ erreur: 'corps trop long' }, 413) }),
  async (c) => {
    if (!memeOrigine(c)) return c.json({ erreur: 'origine refusée' }, 403);
    if (!(c.req.header('content-type') ?? '').toLowerCase().startsWith('application/json')) {
      return c.json({ erreur: 'content-type application/json attendu' }, 415);
    }
    let corps;
    try { corps = await c.req.json(); } catch { return c.json({ erreur: 'JSON attendu' }, 400); }
    const v = validerEnvoi(corps);
    if (!v.ok) return c.json({ erreur: v.erreur }, 400);
    if (!limiteur.autorise(ip(c))) return c.json({ erreur: 'trop d\'envois, réessaie dans 20 secondes' }, 429);
    const mois = moisCourant();
    const { rang, top } = await stockage.ajouter(mois, v.valeur);
    c.header('Cache-Control', 'no-store');
    return c.json({ mois, rang, top }, 201);
  },
);

/* L'API et elle seule : /apiculture est une page du site, pas une route JSON. */
const estApi = (p) => p === '/api' || p.startsWith('/api/');

app.notFound(async (c) => {
  if (estApi(c.req.path)) return c.json({ erreur: 'route inconnue' }, 404);
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
  if (p !== '/' && !p.endsWith('/') && !extname(p) && !estApi(p)) {
    const index = join(DIST, p, 'index.html');
    if (await stat(index).then((s) => s.isFile()).catch(() => false)) {
      const u = new URL(c.req.url); // la query survit à la redirection
      return c.redirect(`${u.pathname}/${u.search}`, 301);
    }
  }
  await next();
});

// ⚠️ Piège vérifié au Step 6 (@hono/node-server 1.19.17, cf. server/package-lock.json) :
// serveStatic(root) fonctionne ici avec un chemin ABSOLU (join()/resolve() en interne
// gèrent un root absolu quel que soit le cwd) — testé en servant dist/ depuis la racine
// du dépôt. Si une version future régresse et exige un root relatif au cwd, remplacer
// par `relative(process.cwd(), DIST)` (import { relative } from 'node:path').
app.use('*', serveStatic({ root: DIST, rewriteRequestPath: (p) => (p.endsWith('/') ? `${p}index.html` : p) }));

// Démarrage seulement en exécution directe : les tests importent `app` et
// appellent app.request() sans ouvrir de port.
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  serve({ fetch: app.fetch, port: PORT }, (info) => {
    console.log(`dailypopsociety : http://localhost:${info.port} — dist=${DIST} data=${DATA}${MAQUETTE ? ' (maquette, noindex)' : ''}`);
  });
}
