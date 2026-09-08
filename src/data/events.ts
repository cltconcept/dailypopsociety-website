import { illu } from '../lib/illu';

export type Evenement = {
  titre: string;
  quand: string;          // texte affiché
  mois: string;           // AAAA-MM pour le tri
  desc: string;
  visuel: string;         // /media/… (illustration d'ambiance en attendant les photos)
  alt: string;
  reservation?: boolean;  // sur réservation uniquement
  aPlanifier?: boolean;   // date à confirmer par la gérante
};

/* Les prochains events (une licence par mois) */
export const A_VENIR: Evenement[] = [
  { titre: 'Daily Pop Coven', quand: '21 octobre, puis du 28 au 31 octobre', mois: '2026-10', desc: 'Viens célébrer le sabbat que toutes les sorcières attendent : carte éphémère, déco et soirées à thème.', visuel: '/media/logos/2025-10-halloween.webp', alt: 'Logo mensuel Halloween de Daily Pop Society' },
  { titre: 'Tim Burton', quand: 'Novembre', mois: '2026-11', desc: 'Un mois entier dans l\'univers de Tim Burton. Dates à venir.', visuel: illu('comptoir').src, alt: 'Illustration : le comptoir du bar', aPlanifier: true },
  { titre: 'Daily Pop Christmas', quand: 'Décembre', mois: '2026-12', desc: 'Les plus gros succès des fêtes de fin d\'année réunis, et le closing annuel du shop. Dates à venir.', visuel: '/media/logos/2024-12-noel.webp', alt: 'Logo mensuel de Noël', aPlanifier: true },
];

/* Les soirées récurrentes */
export const SOIREES: Evenement[] = [
  { titre: 'Blind test pop culture', quand: 'Deux fois par mois, le vendredi à 19h', mois: '', desc: 'Films, séries, animés, jeux vidéo : tu reconnais, tu buzzes, tu gagnes.', visuel: illu('blind-test').src, alt: 'Illustration : un micro sous un néon bordeaux' },
  { titre: 'Soirée JDR', quand: 'Sur réservation, à 18h', mois: '', desc: 'Blood on the Clocktower et d\'autres jeux de rôle. Places limitées, réservation par téléphone ou Messenger.', visuel: illu('jdr').src, alt: 'Illustration : dés, feuilles de personnage et bougie', reservation: true },
  { titre: 'Animations du week-end', quand: 'Chaque week-end', mois: '', desc: 'Quiz, rassemblements cosplay, tournois sur Switch et PS4 : le programme se dévoile sur Instagram.', visuel: illu('coin-gaming').src, alt: 'Illustration : manettes et étagère de mangas' },
];

/* « Précédemment dans Daily Pop » — les events passés (photos à venir de la cliente) */
export const PASSES: Evenement[] = [
  { titre: 'Séries cultes', quand: 'Du 2 au 5 septembre 2026', mois: '2026-09', desc: 'Quatre jours axés sur les séries et sitcoms cultes des années 2000.', visuel: illu('comptoir').src, alt: 'Illustration d\'ambiance, photos de l\'event à venir' },
  { titre: 'Disney Nostalgie 90-2000', quand: 'Du 12 au 15 août 2026', mois: '2026-08', desc: 'Viens (re)découvrir les classiques de ton enfance.', visuel: illu('patisserie').src, alt: 'Illustration d\'ambiance, photos de l\'event à venir' },
  { titre: 'Jurassic Pop', quand: 'Juillet 2026', mois: '2026-07', desc: 'Les dinosaures ont pris le bar.', visuel: illu('starters').src, alt: 'Illustration d\'ambiance, photos de l\'event à venir' },
  { titre: 'Spider Day', quand: 'Juillet 2026', mois: '2026-07', desc: 'Une journée dans la toile, cosplay bienvenu.', visuel: illu('cocktail-zoro').src, alt: 'Illustration d\'ambiance, photos de l\'event à venir' },
];
