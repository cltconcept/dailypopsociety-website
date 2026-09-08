// Contrôle de dist/ après build. Sortie 1 = une attente non satisfaite.
// PAGES est la liste des pages ATTENDUES : on l'étend AVANT de créer une page
// (le contrôle échoue, puis on crée la page, puis il passe).
import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const DIST = 'dist';
const ORIGINE = 'https://dailypopsociety.be';
const PAGES = ['index.html', '404.html', 'mentions-legales/index.html', 'la-carte/index.html', 'events/index.html', 'galerie/index.html', 'a-propos/index.html', 'contact/index.html'];
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
  // Un seul <h1> par page : deux titres de premier niveau, c'est deux pages
  // qui se disputent le même document (lecteur d'écran comme moteur).
  const n = (html.match(/<h1[\s>]/g) || []).length;
  ok(n === 1, `${p} : ${n} <h1> (1 attendu)`);
  ok(!/TODO|Lorem ipsum|__[A-Z]+__|à confirmer|à compléter/i.test(html), `${p} : placeholder trouvé (TODO / Lorem / __X__ / à confirmer / à compléter)`);
  // alt="" décoratif : Astro sérialise une valeur vide en attribut nu (`alt`
  // sans `=`), HTML valide et équivalent à alt="" — la regex accepte les deux.
  // Le lookahead couvre aussi la balise auto-fermante `<img … alt/>`, et le
  // \s en tête interdit de prendre le `alt` d'un `data-alt` pour le bon.
  for (const m of html.matchAll(/<img\b[^>]*>/g)) ok(/\salt(?=[\s=>\/])/.test(m[0]), `${p} : <img> sans alt : ${m[0].slice(0, 80)}`);

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

  // Canonical : la page doit en porter un, dans le HEAD (un <link> égaré dans le
  // corps est ignoré des moteurs), et il doit désigner le domaine DE PRODUCTION.
  // Un canonical relatif ou pointant sur la maquette ferait indexer chris-ia.com
  // à la place de dailypopsociety.be — la faute la plus chère du lot.
  const canon = head.match(/<link[^>]*\srel="canonical"[^>]*\shref="([^"]*)"/);
  ok(Boolean(canon), `${p} : <link rel="canonical"> absent du <head>`);
  if (canon) ok(canon[1].startsWith(`${ORIGINE}/`), `${p} : canonical hors du domaine de production : ${canon[1]}`);

  // Liens internes : chaque href="/…" doit se ramener à un fichier de dist/.
  // Les ancres, tel:, mailto: et les liens externes n'ont rien à y exister.
  // Une URL de dossier (« /events/ ») est servie par son index.html : c'est LUI
  // qu'on cherche, sinon nginx répondrait 404 sur un lien du menu.
  for (const m of html.matchAll(/href="([^"]+)"/g)) {
    const v = m[1];
    if (!v.startsWith('/') || v.startsWith('//')) continue;
    const sansAncre = v.split('#')[0].split('?')[0];
    if (sansAncre === '') continue;
    const cible = sansAncre.endsWith('/') ? `${sansAncre}index.html` : sansAncre;
    ok(existsSync(join(DIST, cible)), `${p} : lien interne mort ${v} (attendu : dist${cible})`);
  }

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
      const JOURS_VALIDES = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
      // 25:00 et 09:70 passaient \d{2}:\d{2} : on borne les deux champs.
      const HEURE = /^([01]\d|2[0-3]):[0-5]\d$/;
      ok(creneaux.length >= 1, `${p} : JSON-LD aucun créneau d'ouverture`);
      const jours = new Set();
      for (const c of creneaux) {
        ok(c['@type'] === 'OpeningHoursSpecification', `${p} : JSON-LD créneau @type inattendu : ${JSON.stringify(c['@type'])}`);
        // dayOfWeek est licite en chaîne comme en tableau (schema.org).
        const dows = [].concat(c.dayOfWeek);
        ok(dows.every((j) => JOURS_VALIDES.includes(j)), `${p} : JSON-LD dayOfWeek inattendu : ${JSON.stringify(c.dayOfWeek)}`);
        for (const j of dows) if (JOURS_VALIDES.includes(j)) jours.add(j);
        ok(HEURE.test(c.opens), `${p} : JSON-LD opens mal formé : ${JSON.stringify(c.opens)}`);
        ok(HEURE.test(c.closes), `${p} : JSON-LD closes mal formé : ${JSON.stringify(c.closes)}`);
        // Comparaison de chaînes : au format HH:MM elle vaut la comparaison d'heures.
        // Un bar ferme APRÈS minuit : « 18:00 → 01:00 » est licite (schema.org le
        // lit comme une fermeture au petit matin), « 18:00 → 12:00 » ne l'est pas.
        // On tolère donc un closes <= 06:00, et rien d'autre au-dessous d'opens.
        const sensOk = c.opens < c.closes || c.closes <= '06:00';
        ok(!(HEURE.test(c.opens) && HEURE.test(c.closes)) || sensOk, `${p} : JSON-LD créneau à l'envers : ${c.opens} → ${c.closes}`);
      }
      // Un horaire qui perdrait la moitié de la semaine en silence se voit ici.
      // Seuil à 3 et non 5 : c'est un filet contre l'effondrement d'un tableau,
      // pas un avis sur le commerce. Un bar qui n'ouvrirait que du jeudi au
      // samedi est un horaire parfaitement valable, il ne doit pas faire rougir
      // le contrôleur — 0, 1 ou 2 jours, en revanche, sent la transformation ratée.
      ok(jours.size >= 3, `${p} : JSON-LD ${jours.size} jours d'ouverture distincts (3 attendus au minimum)`);
    }
  }
}
ok(existsSync(join(DIST, 'sitemap-index.xml')), 'sitemap-index.xml absent');
ok(existsSync(join(DIST, 'robots.txt')), 'robots.txt absent');

// Aucun fichier > 600 Ko dans dist/media (les WebP doivent rester légers)
const marcher = (d) => readdirSync(d).flatMap((n) => { const f = join(d, n); return statSync(f).isDirectory() ? marcher(f) : [f]; });
if (existsSync(join(DIST, 'media'))) for (const f of marcher(join(DIST, 'media'))) ok(statSync(f).size < 600 * 1024, `média trop lourd (> 600 Ko) : ${f}`);

// Garde de mise en production : la carte de démonstration porte des noms et des
// prix INVENTÉS. Tant que DEMO vaut true, elle ne doit pas partir chez le
// public. PROD=1 est le geste de mise en ligne ; il échoue tant que la vraie
// carte n'est pas en place. En dev (sans PROD), le contrôle reste muet.
if (process.env.PROD === '1') ok(!/export const DEMO = true/.test(readFileSync('src/data/carte.ts', 'utf8')), 'carte de démonstration encore active (DEMO = true) : mise en production refusée');

if (erreurs.length) { console.error('✗ verifier :\n - ' + erreurs.join('\n - ')); process.exit(1); }
console.log(`✓ verifier : ${PAGES.length} pages contrôlées, aucun écart`);
