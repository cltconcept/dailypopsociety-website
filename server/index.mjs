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

// ⚠️ Piège vérifié au Step 6 (@hono/node-server 1.19.17, cf. server/package-lock.json) :
// serveStatic(root) fonctionne ici avec un chemin ABSOLU (join()/resolve() en interne
// gèrent un root absolu quel que soit le cwd) — testé en servant dist/ depuis la racine
// du dépôt. Si une version future régresse et exige un root relatif au cwd, remplacer
// par `relative(process.cwd(), DIST)` (import { relative } from 'node:path').
app.use('*', serveStatic({ root: DIST, rewriteRequestPath: (p) => (p.endsWith('/') ? `${p}index.html` : p) }));

serve({ fetch: app.fetch, port: PORT }, (info) => {
  console.log(`dailypopsociety : http://localhost:${info.port} — dist=${DIST} data=${DATA}${MAQUETTE ? ' (maquette, noindex)' : ''}`);
});
