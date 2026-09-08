/* Les illustrations d'ambiance — UNE seule façon de construire leur URL.
   Chaque id existe en 480 / 960 / 1440 (cf. public/media/illu/, généré par
   scripts/illu.py). Cette fonction était recopiée dans quatre fichiers : la
   copie qui oubliait le srcset servait une image 960 à un écran de 390 px. */
export const LARGEURS = [480, 960, 1440] as const;

export const illu = (id: string) => ({
  src: `/media/illu/${id}-960.webp`,
  srcset: LARGEURS.map((w) => `/media/illu/${id}-${w}.webp ${w}w`).join(', '),
});

/* Largeur RENDUE d'une case de comics dans la grille à 3 colonnes :
   pleine largeur en mobile, moitié en tablette, 380 px au-delà. */
export const SIZES_CASE = '(max-width: 600px) 92vw, (max-width: 960px) 46vw, 380px';
