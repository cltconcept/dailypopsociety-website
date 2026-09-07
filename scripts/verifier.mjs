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
