// Tests d'intégration du serveur : app.request(), aucun port ouvert, aucun réseau.
// index.mjs lit process.env À L'IMPORT → les variables sont posées AVANT l'import
// dynamique du module, dans un before() qui construit un faux dist/ et un data/ vide.
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

let app;
let dist;
let data;

const PNG = Buffer.from('89504e470d0a1a0a0000000d49484452', 'hex'); // en-tête PNG, suffisant : le mime vient de l'extension

/** POST /api/scores prêt à l'emploi ; l'IP est celle de la DERNIÈRE valeur du XFF. */
const envoyer = (corps, entetes = {}) =>
  app.request('/api/scores', {
    method: 'POST',
    headers: { 'content-type': 'application/json', ...entetes },
    body: typeof corps === 'string' ? corps : JSON.stringify(corps),
  });

const partie = (pseudo) => ({ pseudo, score: 100, duree: 5 });

before(async () => {
  dist = await mkdtemp(join(tmpdir(), 'dps-dist-'));
  data = await mkdtemp(join(tmpdir(), 'dps-data-'));
  await mkdir(join(dist, 'la-carte'), { recursive: true });
  await mkdir(join(dist, '_astro'), { recursive: true });
  await mkdir(join(dist, 'media'), { recursive: true });
  // > 1 Ko : sous le seuil de hono/compress (1024), rien n'est compressé.
  const bourrage = `<p>${'Nakama Run. '.repeat(120)}</p>`;
  await writeFile(join(dist, 'index.html'), `<!doctype html><title>Daily Pop Society</title>${bourrage}`);
  await writeFile(join(dist, '404.html'), '<!doctype html><title>Perdu</title><p>Cette page a pris la mer.</p>');
  await writeFile(join(dist, 'la-carte', 'index.html'), '<!doctype html><title>La carte</title>');
  await writeFile(join(dist, '_astro', 'a.css'), 'body{color:red}');
  await writeFile(join(dist, 'media', 'x.png'), PNG);
  process.env.DIST_DIR = dist;
  process.env.DATA_DIR = data;
  process.env.MAQUETTE = '1';
  ({ app } = await import('./index.mjs'));
});

after(async () => {
  await rm(dist, { recursive: true, force: true });
  await rm(data, { recursive: true, force: true });
});

test('/health répond ok', async () => {
  const res = await app.request('/health');
  assert.equal(res.status, 200);
  assert.equal(await res.text(), 'ok');
});

test('/ sert index.html, revalidé, avec les en-têtes de sécurité et le noindex de maquette', async () => {
  const res = await app.request('/');
  assert.equal(res.status, 200);
  assert.equal(res.headers.get('cache-control'), 'no-cache');
  assert.equal(res.headers.get('x-content-type-options'), 'nosniff');
  assert.equal(res.headers.get('x-frame-options'), 'SAMEORIGIN');
  assert.equal(res.headers.get('x-robots-tag'), 'noindex'); // MAQUETTE=1
  assert.match(await res.text(), /Daily Pop Society/);
});

test('/_astro/* immuable, /media/* 30 jours', async () => {
  const css = await app.request('/_astro/a.css');
  assert.equal(css.status, 200);
  assert.equal(css.headers.get('cache-control'), 'public, max-age=31536000, immutable');
  const png = await app.request('/media/x.png');
  assert.equal(png.status, 200);
  assert.equal(png.headers.get('cache-control'), 'public, max-age=2592000');
});

test('/la-carte redirige en 301 vers /la-carte/ et garde la query', async () => {
  const res = await app.request('/la-carte');
  assert.equal(res.status, 301);
  assert.equal(res.headers.get('location'), '/la-carte/');
  const avecQuery = await app.request('/la-carte?x=1');
  assert.equal(avecQuery.status, 301);
  assert.equal(avecQuery.headers.get('location'), '/la-carte/?x=1');
  const page = await app.request('/la-carte/');
  assert.equal(page.status, 200);
  assert.match(await page.text(), /La carte/);
});

test('page inconnue : 404.html, en-têtes de sécurité conservés', async () => {
  const res = await app.request('/nimportequoi');
  assert.equal(res.status, 404);
  assert.match(await res.text(), /Cette page a pris la mer/);
  assert.equal(res.headers.get('x-content-type-options'), 'nosniff');
  assert.equal(res.headers.get('cache-control'), 'no-cache');
});

test('/api et /api/x rendent du JSON, pas la page 404', async () => {
  for (const chemin of ['/api', '/api/x']) {
    const res = await app.request(chemin);
    assert.equal(res.status, 404, chemin);
    assert.deepEqual(await res.json(), { erreur: 'route inconnue' }, chemin);
  }
});

test('/apiculture n est pas une route d API : page 404 puis 301 si la page existe', async () => {
  const sansPage = await app.request('/apiculture');
  assert.equal(sansPage.status, 404);
  assert.match(await sansPage.text(), /Cette page a pris la mer/); // 404.html, pas du JSON

  await mkdir(join(dist, 'apiculture'), { recursive: true });
  await writeFile(join(dist, 'apiculture', 'index.html'), '<!doctype html><title>Apiculture</title>');
  try {
    const res = await app.request('/apiculture');
    assert.equal(res.status, 301);
    assert.equal(res.headers.get('location'), '/apiculture/');
  } finally {
    await rm(join(dist, 'apiculture'), { recursive: true, force: true });
  }
});

test('POST valide : 201 avec le rang, puis GET rend le top et « conserves »', async () => {
  const res = await envoyer(partie('Luffy'), { 'x-forwarded-for': '10.0.0.1' });
  assert.equal(res.status, 201);
  const corps = await res.json();
  assert.equal(corps.rang, 1);
  assert.equal(corps.top[0].pseudo, 'Luffy');
  assert.match(corps.mois, /^\d{4}-\d{2}$/);

  const lecture = await app.request('/api/scores');
  assert.equal(lecture.status, 200);
  const vue = await lecture.json();
  assert.equal(typeof vue.conserves, 'number');
  assert.equal(vue.total, undefined); // renommé : ce n'est pas le nombre de parties
  assert.equal(lecture.headers.get('cache-control'), 'no-store');
});

test('deux envois de la même IP : le second est refusé en 429', async () => {
  assert.equal((await envoyer(partie('Nami'), { 'x-forwarded-for': '10.0.0.2' })).status, 201);
  const second = await envoyer(partie('Nami'), { 'x-forwarded-for': '10.0.0.2' });
  assert.equal(second.status, 429);
});

test('x-forwarded-for usurpé : seule la DERNIÈRE valeur compte', async () => {
  // Deux dernières valeurs différentes → deux clients distincts, les deux passent.
  assert.equal((await envoyer(partie('Zoro'), { 'x-forwarded-for': '9.9.9.9, 10.0.0.3' })).status, 201);
  assert.equal((await envoyer(partie('Zoro'), { 'x-forwarded-for': '9.9.9.9, 10.0.0.4' })).status, 201);
  // Même dernière valeur, début forgé différent → même client, refusé.
  const usurpe = await envoyer(partie('Zoro'), { 'x-forwarded-for': '1.2.3.4, 10.0.0.3' });
  assert.equal(usurpe.status, 429);
});

test('POST : content-type non JSON → 415', async () => {
  const res = await envoyer(partie('Sanji'), { 'content-type': 'text/plain', 'x-forwarded-for': '10.0.0.5' });
  assert.equal(res.status, 415);
});

test('POST : origine étrangère → 403 (origin et sec-fetch-site)', async () => {
  const etranger = await envoyer(partie('Crocodile'), { origin: 'https://pas-chez-nous.example', 'x-forwarded-for': '10.0.0.6' });
  assert.equal(etranger.status, 403);
  const croise = await envoyer(partie('Crocodile'), { 'sec-fetch-site': 'cross-site', 'x-forwarded-for': '10.0.0.7' });
  assert.equal(croise.status, 403);
  // Même origine : accepté.
  const propre = await envoyer(partie('Chopper'), { origin: 'http://localhost', 'sec-fetch-site': 'same-origin', 'x-forwarded-for': '10.0.0.8' });
  assert.equal(propre.status, 201);
});

test('POST : corps de 2 Ko → 413 avant toute lecture JSON', async () => {
  const gros = JSON.stringify({ ...partie('Brook'), bidon: 'x'.repeat(2048) });
  const res = await envoyer(gros, { 'x-forwarded-for': '10.0.0.9' });
  assert.equal(res.status, 413);
  assert.deepEqual(await res.json(), { erreur: 'corps trop long' });
});

test('POST : JSON illisible → 400', async () => {
  const res = await envoyer('{ pas du json', { 'x-forwarded-for': '10.0.0.10' });
  assert.equal(res.status, 400);
});

test('la compression est montée : / avec Accept-Encoding gzip repart encodé', async () => {
  const res = await app.request('/', { headers: { 'accept-encoding': 'gzip' } });
  assert.equal(res.status, 200);
  assert.match(res.headers.get('content-encoding') ?? '', /gzip|br/);
  assert.match(res.headers.get('vary') ?? '', /Accept-Encoding/i);
});
