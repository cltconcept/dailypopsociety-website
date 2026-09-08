// Contrôle de dist/ après build. Sortie 1 = une attente non satisfaite.
// PAGES est la liste des pages ATTENDUES : on l'étend AVANT de créer une page
// (le contrôle échoue, puis on crée la page, puis il passe).
import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const DIST = 'dist';
const ORIGINE = 'https://dailypopsociety.be';
const PAGES = ['index.html', '404.html'];
const erreurs = [];
const ok = (cond, msg) => { if (!cond) erreurs.push(msg); };

for (const p of PAGES) {
  const f = join(DIST, p);
  if (!existsSync(f)) { erreurs.push(`page absente : ${p}`); continue; }
  const html = readFileSync(f, 'utf8');
  const head = (html.match(/<head>([\s\S]*?)<\/head>/) || ['', ''])[1];
  ok(head !== '', `${p} : <head> introuvable`);
  ok(/<title>[^<]{10,}<\/title>/.test(head), `${p} : <title> absent ou trop court`);
  // Sur head, pas sur html : une description ne compte que dans l'en-tête.
  ok(/<meta name="description" content="[^"]{40,}"/.test(head), `${p} : description absente ou < 40 caractères`);
  ok(/<h1[\s>]/.test(html), `${p} : pas de <h1>`);
  ok(!/TODO|Lorem ipsum|__[A-Z]+__/.test(html), `${p} : placeholder trouvé (TODO / Lorem / __X__)`);
  for (const m of html.matchAll(/<img\b[^>]*>/g)) ok(/(^|\s)alt=/.test(m[0]), `${p} : <img> sans alt : ${m[0].slice(0, 80)}`);

  // Médias référencés : seules les URL de NOTRE origine se ramènent à un chemin
  // de dist/. Une URL externe (réseaux, maps) n'a rien à exister sur le disque.
  const medias = new Set();
  const chemin = (v) => {
    if (!/^(?:[a-z][a-z0-9+.-]*:)?\/\//i.test(v)) return v;
    try {
      const u = new URL(v, ORIGINE);
      return u.origin === ORIGINE ? u.pathname : '';
    } catch { return ''; }
  };
  for (const m of html.matchAll(/(?:src|href|content)="([^"]+)"/g)) {
    const v = chemin(m[1]);
    if (v.startsWith('/media/')) medias.add(v);
  }
  for (const m of html.matchAll(/srcset="([^"]+)"/g)) {
    for (const part of m[1].split(',')) {
      const v = chemin(part.trim().split(/\s+/)[0]);
      if (v.startsWith('/media/')) medias.add(v);
    }
  }
  for (const v of medias) ok(existsSync(join(DIST, v)), `${p} : média manquant ${v}`);

  // JSON-LD : on le PARSE au lieu de chercher la chaîne. C'est le seul moyen
  // de voir un horaire mal transformé (« 9:00 » au lieu de « 09:00 »).
  if (p !== '404.html') {
    const blocs = [...html.matchAll(/<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)];
    ok(blocs.length > 0, `${p} : JSON-LD absent`);
    const schemas = [];
    for (const b of blocs) {
      try { schemas.push(JSON.parse(b[1])); }
      catch (e) { erreurs.push(`${p} : JSON-LD invalide (${e.message})`); }
    }
    const bar = schemas.find((s) => s && s['@type'] === 'BarOrPub');
    ok(Boolean(bar), `${p} : aucun JSON-LD @type=BarOrPub`);
    if (bar) {
      ok(bar.address?.postalCode === '6000', `${p} : JSON-LD code postal inattendu (${bar.address?.postalCode})`);
      const creneaux = bar.openingHoursSpecification || [];
      ok(creneaux.length === 7, `${p} : JSON-LD ${creneaux.length} créneaux d'ouverture, 7 attendus`);
      for (const c of creneaux) {
        ok(/^\d{2}:\d{2}$/.test(c.opens), `${p} : JSON-LD opens mal formé : ${JSON.stringify(c.opens)}`);
        ok(/^\d{2}:\d{2}$/.test(c.closes), `${p} : JSON-LD closes mal formé : ${JSON.stringify(c.closes)}`);
      }
    }
  }
}
ok(existsSync(join(DIST, 'sitemap-index.xml')), 'sitemap-index.xml absent');
ok(existsSync(join(DIST, 'robots.txt')), 'robots.txt absent');

// Aucun fichier > 600 Ko dans dist/media (les WebP doivent rester légers)
const marcher = (d) => readdirSync(d).flatMap((n) => { const f = join(d, n); return statSync(f).isDirectory() ? marcher(f) : [f]; });
if (existsSync(join(DIST, 'media'))) for (const f of marcher(join(DIST, 'media'))) ok(statSync(f).size < 600 * 1024, `média trop lourd (> 600 Ko) : ${f}`);

if (erreurs.length) { console.error('✗ verifier :\n - ' + erreurs.join('\n - ')); process.exit(1); }
console.log(`✓ verifier : ${PAGES.length} pages contrôlées, aucun écart`);
