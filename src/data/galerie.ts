/* Galerie par thème — un thème = une licence ou un event. En attendant les
   photos de la cliente : illustrations d'ambiance et logos mensuels. */
import { LOGOS } from './logos';
import type { RefVisuel } from '../lib/illu';

/* `alt` reste optionnel : sans lui, la description vient de l'id (ALT de
   lib/illu pour une illustration, le nom de la licence pour un logo). On ne
   l'écrit ici que si le contexte de la galerie demande autre chose. */
export type Visuel = RefVisuel & {
  legende?: string;
  /** `contain` pour un visuel qui ne doit pas être rogné (un logo). */
  ajustement?: 'cover' | 'contain';
  /** object-position, quand le sujet n'est pas au centre (« 50% 30% »). */
  focus?: string;
};
export type Theme = { slug: string; nom: string; visuels: Visuel[] };

/* « 2024-10 » → « Octobre 2024 ». Date construite en heure LOCALE et non
   `new Date('2024-10-01')`, qui se lit en UTC : un build à l'ouest de
   Greenwich afficherait le mois précédent. */
const moisLisible = (mois: string) => {
  const [an, m] = mois.split('-').map(Number);
  const texte = new Date(an, m - 1, 1).toLocaleDateString('fr-BE', { month: 'long', year: 'numeric' });
  return texte.charAt(0).toUpperCase() + texte.slice(1);
};

export const THEMES: Theme[] = [
  {
    slug: 'le-shop', nom: 'Le shop',
    visuels: [
      { id: 'comptoir', legende: 'Le comptoir, les mangas, les figurines.' },
      { id: 'coin-gaming', legende: 'Le coin gaming, Switch et PS4 à dispo.' },
      { id: 'jdr', legende: 'La table des soirées JDR.' },
    ],
  },
  {
    slug: 'la-carte', nom: 'La carte',
    visuels: [
      { id: 'cocktail-zoro', legende: 'Le Zoro, trois lames de citron vert.' },
      { id: 'burger-hokage', legende: 'Le burger Hokage.' },
      { id: 'bubble-tea', legende: 'Bubble tea mangue passion.' },
      { id: 'patisserie', legende: 'Cheesecake Spider.' },
      { id: 'cafe-latte', legende: 'Le latte, pour ceux qui restent la journée.' },
    ],
  },
  {
    slug: 'soirees', nom: 'Soirées',
    visuels: [
      { id: 'blind-test', legende: 'Blind test pop culture, un vendredi sur deux.' },
      { id: 'starters', legende: 'À partager pendant le quiz.' },
      { id: 'mocktail-fraise', legende: 'Un mocktail pour ceux qui conduisent.' },
    ],
  },
  {
    /* DÉRIVÉ de LOGOS (généré par scripts/logos.py) : la timeline complète, et
       non les cinq logos qu'une main avait recopiés ici. Un logo ajouté à la
       planche apparaît dans la galerie sans qu'on ouvre ce fichier. */
    slug: 'logos', nom: 'Les logos du mois',
    visuels: LOGOS.map((l) => ({
      id: `logo:${l.id}`,
      legende: `${moisLisible(l.mois)} — ${l.licence}`,
      ajustement: 'contain' as const,
    })),
  },
];
