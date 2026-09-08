import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { validerEnvoi, moisCourant, Stockage, LimiteurDebit } from './scores.mjs';

test('validerEnvoi accepte un envoi correct et normalise le pseudo', () => {
  // Note d'implémentation (écart signalé au rapport) : le plan proposait
  // '  Luffy  du Quai ' → 'Luffy du Quai', mais ce résultat fait 13
  // caractères alors que PSEUDO_MAX = 12 (cf. scores.mjs et spec §5,
  // « 2-12 caractères ») — et remonter PSEUDO_MAX casserait le test suivant
  // ('a'.repeat(13) doit être refusé). L'exemple était donc mal compté ;
  // corrigé ici à 10 caractères en conservant le comportement testé (trim +
  // espaces multiples réduits à un seul).
  const r = validerEnvoi({ pseudo: '  Luffy  Quai ', score: 420, duree: 31 });
  assert.equal(r.ok, true);
  assert.deepEqual(r.valeur, { pseudo: 'Luffy Quai', score: 420, duree: 31 });
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

test('validerEnvoi : mots refusés comparés en mots entiers', () => {
  for (const pseudo of ['Panique', 'Monique', 'Députe', 'Nazaire', 'Reputes']) {
    assert.equal(validerEnvoi({ pseudo, score: 10, duree: 5 }).ok, true, pseudo);
  }
  for (const pseudo of ['connard', 'sale pute', 'Putain', 'nazi', 'Nique ta']) {
    assert.equal(validerEnvoi({ pseudo, score: 10, duree: 5 }).ok, false, pseudo);
  }
});

test('Stockage : à score égal, le dernier arrivé passe derrière', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'dps-'));
  try {
    const s = new Stockage(dir);
    const a = await s.ajouter('2026-10', { pseudo: 'Ace', score: 500, duree: 10 });
    const b = await s.ajouter('2026-10', { pseudo: 'Sabo', score: 500, duree: 10 });
    assert.equal(a.rang, 1);
    assert.equal(b.rang, 2); // pas deux « rang 1 » pour le même score
    const c = await s.ajouter('2026-10', { pseudo: 'Shanks', score: 900, duree: 20 });
    assert.equal(c.rang, 1);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test('Stockage : JSON corrompu mis de côté, le mois repart vide', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'dps-'));
  try {
    const s = new Stockage(dir);
    await writeFile(join(dir, 'scores-2026-10.json'), '{ "scores": [ ceci n\'est pas du JSON', 'utf8');
    assert.deepEqual(await s.top('2026-10', 10), []);
    const fichiers = await readdir(dir);
    assert.equal(fichiers.filter((f) => f.endsWith('.corrompu')).length, 1, fichiers.join(','));
    assert.equal(fichiers.includes('scores-2026-10.json'), false);
    const r = await s.ajouter('2026-10', { pseudo: 'Robin', score: 42, duree: 5 });
    assert.equal(r.rang, 1);

    // Seconde corruption : l'horodatage doit donner un second fichier, pas
    // écraser le premier. Pause de 5 ms car l'horodatage est à la milliseconde.
    await new Promise((r2) => setTimeout(r2, 5));
    await writeFile(join(dir, 'scores-2026-10.json'), 'encore du n import quoi', 'utf8');
    assert.deepEqual(await s.top('2026-10', 10), []);
    const apres = (await readdir(dir)).filter((f) => f.endsWith('.corrompu'));
    assert.equal(apres.length, 2, apres.join(','));
    assert.equal(new Set(apres).size, 2);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test('Stockage : aucun fichier .tmp orphelin après écriture', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'dps-'));
  try {
    const s = new Stockage(dir);
    await Promise.all(Array.from({ length: 5 }, (_, i) => s.ajouter('2026-10', { pseudo: `T${i}`, score: i, duree: 5 })));
    const fichiers = await readdir(dir);
    assert.deepEqual(fichiers.filter((f) => f.endsWith('.tmp')), []);
    assert.deepEqual(fichiers, ['scores-2026-10.json']);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});
