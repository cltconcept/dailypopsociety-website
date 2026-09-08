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
