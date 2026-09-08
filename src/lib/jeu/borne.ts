/* Borne : ouverture/fermeture du calque, HUD, fin de partie, envoi du score,
   classement du mois (borne + top 3 du hero). Amélioration progressive :
   sans JS le bouton START n'existe pas (hidden dans le HTML). */
import { chargerSprites, creerJeu, type Jeu } from './moteur';
import { loadGsap } from '../motion';

const CLE_RECORD = 'dps:record';
const CLE_PSEUDO = 'dps:pseudo';
type Entree = { pseudo: string; score: number; date: string };

const lire = (k: string) => { try { return localStorage.getItem(k) ?? ''; } catch { return ''; } };
const ecrire = (k: string, v: string) => { try { localStorage.setItem(k, v); } catch { /* stockage indisponible */ } };
const fmt = (n: number) => n.toLocaleString('fr-BE');

export function initBorne() {
  const calque = document.getElementById('borne');
  const bouton = document.getElementById('gen-start') as HTMLButtonElement | null;
  const topHero = document.getElementById('gen-top');
  if (!calque || !bouton) return;
  /* Recopiés dans des consts NON nullables : TypeScript ne conserve pas le
     narrowing d'un `const` à l'intérieur d'une `function` déclarée (elle peut
     être appelée avant le test), et ouvrir()/fermer() en sont. */
  const borne: HTMLElement = calque;
  const start: HTMLButtonElement = bouton;
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
  let dernierScore = -1, dernierTemps = -1;
  /* ===== Allumage / extinction en GSAP (le hero DEVIENT la borne) =====
     Le nom et le pied du générique reculent et s'éteignent, l'écran s'ouvre
     depuis une ligne horizontale (clip-path piloté par --ouv, façon tube cathodique) sous un
     éclair blanc, puis en-tête, HUD, écran et classement entrent en cascade.
     Le hero n'est touché QUE par ses conteneurs (.gen__titre, .gen__pied) :
     le scrub du générique anime leurs ENFANTS, aucun tween ne se marche dessus.
     `y: '-=…'` relatif et clearProps au retour : .gen__titre porte un
     translateY(-54%) en CSS qu'une valeur absolue écraserait.
     Reduced-motion ou GSAP absent : apparition immédiate, comme avant. */
  const partiesBorne = ['.borne__tete', '.borne__hud', '.borne__ecran', '.borne__classement']
    .map((s) => borne.querySelector<HTMLElement>(s)).filter((el): el is HTMLElement => el !== null);
  const partiesHero = ['.gen__titre', '.gen__pied']
    .map((s) => document.querySelector<HTMLElement>(s)).filter((el): el is HTMLElement => el !== null);
  const flash = borne.querySelector<HTMLElement>('.borne__flash');
  let enTransition = false;
  async function gsapOuNull() {
    if (reduced) return null;
    try { return (await loadGsap()).gsap; } catch { return null; }
  }
  async function allumer() {
    const gsap = await gsapOuNull();
    if (!gsap) { borne.hidden = false; return; }
    /* États de départ posés AVANT de dévoiler l'élément : aucun flash de la borne entière */
    gsap.set(borne, { '--ouv': 50 });
    gsap.set(partiesBorne, { autoAlpha: 0, y: 24 });
    borne.hidden = false;
    await new Promise<void>((resolve) => {
      const tl = gsap.timeline({ onComplete: resolve });
      tl.to(partiesHero, { autoAlpha: 0, scale: 0.94, y: '-=24', duration: 0.35, ease: 'power2.in' }, 0)
        .to(borne, { '--ouv': 0, duration: 0.55, ease: 'power3.inOut' }, 0.15);
      if (flash) tl.fromTo(flash, { opacity: 0.85 }, { opacity: 0, duration: 0.5, ease: 'power2.out' }, 0.3);
      tl.to(partiesBorne, { autoAlpha: 1, y: 0, duration: 0.45, stagger: 0.07, ease: 'power3.out' }, 0.45);
    });
  }
  async function eteindre() {
    const gsap = await gsapOuNull();
    if (!gsap) { borne.hidden = true; return; }
    await new Promise<void>((resolve) => {
      gsap.timeline({ onComplete: resolve })
        .to(partiesBorne, { autoAlpha: 0, y: 12, duration: 0.2, ease: 'power2.in' }, 0)
        .to(borne, { '--ouv': 50, duration: 0.4, ease: 'power3.in' }, 0.1)
        .to(partiesHero, { autoAlpha: 1, scale: 1, y: '+=24', duration: 0.4, ease: 'power2.out', clearProps: 'transform,opacity,visibility' }, 0.35);
    });
    borne.hidden = true;
  }
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
    if (enTransition || !borne.hidden) return;
    enTransition = true;
    document.body.style.overflow = 'hidden';
    inertReste(true);
    await allumer();
    enTransition = false;
    if (!jeu) {
      elMessage.textContent = 'Chargement…';
      const sprites = await chargerSprites();
      jeu = creerJeu(canvas, sprites, {
        reduced,
        /* Le premier tour de boucle efface l'invite : elle disait « appuie sur
           espace pour commencer » PENDANT toute la partie (le plan ne la
           masquait qu'au game over). Ici, quelle que soit la façon dont la
           partie a démarré — espace, tap ou bouton Rejouer. */
        onScore: (s, t) => {
          if (!elMessage.hidden) elMessage.hidden = true;
          // Écritures DOM seulement au changement (la boucle appelle ici 60 fois/s) ; ceil : « 1 s » dès la première seconde, pas « 0 s »
          if (s !== dernierScore) { dernierScore = s; elScore.textContent = fmt(s); }
          const ts = Math.ceil(t);
          if (ts !== dernierTemps) { dernierTemps = ts; elTemps.textContent = String(ts); }
        },
        onFin: (s, d) => finPartie(s, d),
      });
    }
    /* Une partie finie laissée derrière (fermeture après un game over) doit
       rendre la scène de départ, sinon l'invite « espace pour commencer »
       s'affiche sur l'image de la mort et le saut ne relance rien. */
    jeu.arreter();
    elScore.textContent = '0'; elTemps.textContent = '0';
    form.hidden = true; elErreur.textContent = ''; elRang.hidden = true;
    elMessage.hidden = false; elMessage.textContent = 'Appuie sur espace ou tape l\'écran pour commencer.';
    elLive.textContent = 'Jeu ouvert. Espace ou tap pour sauter.';
    canvas.focus();
    chargerTop();
  }

  async function fermer() {
    if (enTransition || borne.hidden) return;
    enTransition = true;
    jeu?.arreter();
    await eteindre();
    enTransition = false;
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
      /* La scène repart à zéro : sans ça l'invite ci-dessous ne dit pas vrai
         (le moteur reste « fini », le saut ne relance pas de partie). */
      jeu?.arreter();
      elScore.textContent = '0'; elTemps.textContent = '0';
      elMessage.hidden = false; elMessage.textContent = 'Espace ou tap pour rejouer.';
      elLive.textContent = elRang.textContent;
      canvas.focus();
    } catch {
      elErreur.textContent = 'Classement indisponible, réessaie plus tard.';
    }
  });

  rejouerBtn.addEventListener('click', () => { form.hidden = true; elMessage.hidden = true; jeu?.demarrer(); canvas.focus(); });
  fermerBtn.addEventListener('click', fermer);
  start.addEventListener('click', ouvrir);
  /* Sur document, pas sur #borne : un clic sur le fond du calque rend le focus
     à <body>, et l'événement ne remonterait plus jusqu'à la borne — Échap et
     le piège de focus ne fonctionneraient plus qu'après un nouveau clic dedans. */
  document.addEventListener('keydown', (e) => {
    if (borne.hidden) return;
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
