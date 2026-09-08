/* Les illustrations d'ambiance — UNE seule façon de construire leur URL et de
   les décrire. Chaque id existe en 480 / 960 / 1440 (cf. public/media/illu/,
   généré par scripts/illustrations.sh + scripts/illustrations.txt, puis
   converti par scripts/webp.mjs). Cette fonction était recopiée dans quatre
   fichiers : la copie qui oubliait le srcset servait une image 960 à un écran
   de 390 px. */
import { LOGOS } from '../data/logos';

export const LARGEURS = [480, 960, 1440] as const;

/* L'alternative textuelle appartient à l'ID, pas à la page qui pose l'image :
   la même illustration se décrivait de trois façons différentes dans trois
   fichiers (« le comptoir du bar », « le comptoir et ses étagères de mangas »,
   « Illustration d'ambiance »). Elle vit donc ici, une fois. Le préfixe
   « Illustration : » a sauté partout : le contexte le dit déjà, et un lecteur
   d'écran annonce déjà « image ». Une page peut la remplacer (champ `alt` du
   visuel) quand le contexte demande autre chose — jamais la réécrire à
   l'identique. */
export const ALT: Record<string, string> = {
  'cocktail-zoro': 'cocktail vert vif aux trois lames de citron vert, glaçons et paille noire',
  'mocktail-fraise': 'mocktail fraise et basilic en coupe, paille en papier',
  'bubble-tea': 'bubble tea mangue aux perles de tapioca noires',
  'cafe-latte': 'latte dans une tasse noire avec un latte art en étoile',
  'burger-hokage': 'burger empilé au cheddar fondant, oignons croustillants et sauce',
  starters: 'planche à partager : nachos, sauces, nems et bouchées de poulet',
  patisserie: 'part de cheesecake au coulis de fruits rouges',
  'blind-test': 'micro vintage sur pied sous un néon bordeaux',
  jdr: 'table de jeu de rôle : dés, feuilles de personnage, bougie',
  'coin-gaming': 'deux manettes sur un canapé devant une étagère de mangas et de figurines',
  comptoir: 'comptoir du bar avec ses étagères de mangas, figurines et ardoise',
};

/* Un id absent d'ALT n'a pas d'alternative : plutôt que de servir une image
   muette (ou un fichier qui n'existe pas), on casse le build. */
export const illu = (id: string) => {
  const alt = ALT[id];
  if (!alt) throw new Error(`illu : id inconnu « ${id} »`);
  return {
    src: `/media/illu/${id}-960.webp`,
    srcset: LARGEURS.map((w) => `/media/illu/${id}-${w}.webp ${w}w`).join(', '),
    alt,
  };
};

/* Largeur RENDUE d'une case de comics dans la grille à 3 colonnes :
   pleine largeur en mobile, moitié en tablette, 380 px au-delà. */
export const SIZES_CASE = '(max-width: 600px) 92vw, (max-width: 960px) 46vw, 380px';

/* ===== Visuels de contenu (events, galerie) =====
   Un visuel est désigné par un id : une illustration d'ambiance, ou un logo
   mensuel préfixé « logo: ». Les deux familles n'ont ni la même taille, ni le
   même cadrage, ni de srcset — la règle de résolution vit ICI, une fois, au
   lieu d'être devinée de l'URL dans chaque composant. */
export const PREFIXE_LOGO = 'logo:';

export type RefVisuel = { id: string; alt?: string };
export type VisuelResolu = {
  src: string;
  srcset?: string;
  alt: string;
  largeur: number;
  hauteur: number;
  logo: boolean;
};

export function visuel(v: RefVisuel): VisuelResolu {
  if (v.id.startsWith(PREFIXE_LOGO)) {
    const id = v.id.slice(PREFIXE_LOGO.length);
    const l = LOGOS.find((x) => x.id === id);
    if (!l) throw new Error(`visuel : logo inconnu « ${id} » (cf. src/data/logos.ts)`);
    return {
      src: l.src,
      alt: v.alt ?? `Logo mensuel ${l.licence}`,
      largeur: 160,
      hauteur: 160,
      logo: true,
    };
  }
  const i = illu(v.id);
  return { ...i, alt: v.alt ?? i.alt, largeur: 960, hauteur: 720, logo: false };
}
