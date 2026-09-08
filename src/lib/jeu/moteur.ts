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

  /* Remet la scène de départ depuis N'IMPORTE quel état sauf « pret ».
     Le plan ne rendait la main que depuis « en-cours » : une partie finie
     restait « fini » à la fermeture du calque comme après l'envoi du score,
     et l'invite « espace pour rejouer » ne répondait plus (sauter() sort
     immédiatement hors de « pret » / « en-cours »). */
  function arreter() {
    if (etat === 'pret') return;
    etat = 'pret';
    cancelAnimationFrame(raf);
    reinitialiser();
    dessiner();
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

  /* Dessine un sprite DANS la boîte (w × h) sans le déformer — « contain ».
     Les WebP sont recadrés au contenu, donc pas carrés (tonneau 256×204,
     bubble tea 139×256) : les étirer sur une boîte fixe écrasait le tonneau
     de 30 % et étirait le bubble tea de 70 %. La boîte reste la boîte de
     COLLISION (inchangée), le dessin s'y inscrit : hauteur gardée et largeur
     dérivée du ratio, sauf si le sprite déborde en largeur (tonneau) — c'est
     alors la largeur qui commande. Dans les deux cas le PIED reste posé au
     même endroit, et le sprite est centré horizontalement. */
  function sprite(nom: string, x: number, pied: number, w: number, h: number) {
    const img = sprites[nom as NomSprite];
    if (!img || !img.naturalWidth || !img.naturalHeight) {
      ctx!.fillStyle = COULEURS[nom] ?? '#fff';
      ctx!.fillRect(x, pied - h, w, h);
      return;
    }
    const ratio = img.naturalWidth / img.naturalHeight;
    let dw = h * ratio;
    let dh = h;
    if (dw > w) { dw = w; dh = w / ratio; }
    ctx!.drawImage(img, x + (w - dw) / 2, pied - dh, dw, dh);
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
