/* Galerie par thème — un thème = une licence ou un event. En attendant les
   photos de la cliente : illustrations d'ambiance et logos mensuels. */
export type Visuel = { src: string; alt: string; legende: string };
export type Theme = { slug: string; nom: string; visuels: Visuel[] };

const illu = (id: string) => `/media/illu/${id}-960.webp`;

export const THEMES: Theme[] = [
  {
    slug: 'le-shop', nom: 'Le shop',
    visuels: [
      { src: illu('comptoir'), alt: 'Illustration : le comptoir et ses étagères de mangas', legende: 'Le comptoir, les mangas, les figurines.' },
      { src: illu('coin-gaming'), alt: 'Illustration : le coin gaming', legende: 'Le coin gaming, Switch et PS4 à dispo.' },
      { src: illu('jdr'), alt: 'Illustration : une table de jeu de rôle', legende: 'La table des soirées JDR.' },
    ],
  },
  {
    slug: 'la-carte', nom: 'La carte',
    visuels: [
      { src: illu('cocktail-zoro'), alt: 'Illustration : le cocktail Zoro', legende: 'Le Zoro, trois lames de citron vert.' },
      { src: illu('burger-hokage'), alt: 'Illustration : le burger Hokage', legende: 'Le burger Hokage.' },
      { src: illu('bubble-tea'), alt: 'Illustration : bubble tea mangue', legende: 'Bubble tea mangue passion.' },
      { src: illu('patisserie'), alt: 'Illustration : cheesecake', legende: 'Cheesecake Spider.' },
    ],
  },
  {
    slug: 'soirees', nom: 'Soirées',
    visuels: [
      { src: illu('blind-test'), alt: 'Illustration : micro sous néon', legende: 'Blind test pop culture, un vendredi sur deux.' },
      { src: illu('starters'), alt: 'Illustration : planche à partager', legende: 'À partager pendant le quiz.' },
    ],
  },
  {
    slug: 'logos', nom: 'Les logos du mois',
    visuels: [
      { src: '/media/logos/2024-07-one-piece.webp', alt: 'Logo mensuel One Piece, juillet 2024', legende: 'Juillet 2024 — One Piece.' },
      { src: '/media/logos/2024-10-halloween.webp', alt: 'Logo mensuel Halloween, octobre 2024', legende: 'Octobre 2024 — Halloween.' },
      { src: '/media/logos/2025-05-pokemon.webp', alt: 'Logo mensuel Pokémon, mai 2025', legende: 'Mai 2025 — Pokémon.' },
      { src: '/media/logos/2025-11-my-hero-academia.webp', alt: 'Logo mensuel My Hero Academia, novembre 2025', legende: 'Novembre 2025 — My Hero Academia.' },
      { src: '/media/logos/2026-05-daily-pop-society.webp', alt: 'Nouveau logo Daily Pop Society, mai 2026', legende: 'Mai 2026 — le nouveau logo.' },
    ],
  },
];
