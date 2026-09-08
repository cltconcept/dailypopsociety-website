/* Les events du shop — UNE seule liste, datée. La partition (à venir / passés /
   soirées récurrentes) se fait au build depuis les dates, dans events.astro :
   trois listes tenues à la main, c'est un event qui reste « à venir » six mois
   après avoir eu lieu parce que personne ne l'a déplacé. */
import { LICENCE_DU_MOIS } from './site';
import type { RefVisuel } from '../lib/illu';

export type Evenement = {
  titre: string;
  /** ISO AAAA-MM-JJ. Absents tous les deux = soirée récurrente, sans date. */
  debut?: string;
  /** Dernier jour de l'event : c'est LUI qui le fait basculer dans le passé. */
  fin?: string;
  /** Le texte affiché — les dates ISO ne servent qu'au tri et au JSON-LD. */
  quand: string;
  desc: string;
  /** Id d'illustration (cf. ALT de lib/illu) ou « logo:<id de LOGOS> ». */
  visuel: RefVisuel;
  reservation?: boolean;  // sur réservation uniquement
  aPlanifier?: boolean;   // dates à confirmer par la gérante
};

export const EVENTS: Evenement[] = [
  /* ===== Licences (datées) ===== */
  /* La licence du mois est DÉRIVÉE de site.ts : elle s'affiche déjà sur
     l'accueil et sur la carte. La recopier ici, c'est trois endroits à changer
     tous les mois — et deux qui se contrediront. Le visuel est le logo de la
     maison et non celui d'Halloween 2025, qui porte encore « Nakama's Coffee ». */
  {
    titre: LICENCE_DU_MOIS.nom,
    debut: '2026-10-21',
    fin: '2026-10-31',
    quand: LICENCE_DU_MOIS.dates,
    desc: 'Carte éphémère, déco et soirées à thème pendant toute la période. Le programme détaillé se dévoile sur Instagram.',
    visuel: { id: 'logo:2026-05-daily-pop-society', alt: 'Logo de Daily Pop Society' },
  },
  {
    titre: 'Tim Burton',
    fin: '2026-11-30',
    quand: 'Novembre',
    desc: "Un mois entier dans l'univers de Tim Burton.",
    visuel: { id: 'comptoir' },
    aPlanifier: true,
  },
  {
    titre: 'Daily Pop Christmas',
    fin: '2026-12-31',
    quand: 'Décembre',
    desc: 'Les plus gros succès des fêtes de fin d\'année réunis, et le closing annuel du shop.',
    visuel: { id: 'logo:2024-12-noel' },
    aPlanifier: true,
  },
  {
    titre: 'Séries cultes',
    debut: '2026-09-02',
    fin: '2026-09-05',
    quand: 'Du 2 au 5 septembre 2026',
    desc: 'Quatre jours axés sur les séries et sitcoms cultes des années 2000.',
    visuel: { id: 'starters' },
  },
  {
    titre: 'Disney Nostalgie 90-2000',
    debut: '2026-08-12',
    fin: '2026-08-15',
    quand: 'Du 12 au 15 août 2026',
    desc: 'Viens (re)découvrir les classiques de ton enfance.',
    visuel: { id: 'patisserie' },
  },
  {
    titre: 'Jurassic Pop',
    debut: '2026-07-01',
    fin: '2026-07-31',
    quand: 'Juillet 2026',
    desc: 'Les dinosaures ont pris le bar.',
    visuel: { id: 'cafe-latte' },
  },
  {
    titre: 'Spider Day',
    debut: '2026-07-01',
    fin: '2026-07-31',
    quand: 'Juillet 2026',
    desc: 'Une journée dans la toile, cosplay bienvenu.',
    visuel: { id: 'mocktail-fraise' },
  },

  /* ===== Soirées récurrentes (sans date : elles reviennent) ===== */
  {
    titre: 'Blind test pop culture',
    quand: 'Deux fois par mois, le vendredi à 19h',
    desc: 'Films, séries, animés, jeux vidéo : tu reconnais, tu buzzes, tu gagnes.',
    visuel: { id: 'blind-test' },
  },
  {
    titre: 'Soirée JDR',
    quand: 'À 18h, sur réservation',
    desc: "Blood on the Clocktower et d'autres jeux de rôle. Places limitées, réservation par téléphone ou Messenger.",
    visuel: { id: 'jdr' },
    reservation: true,
  },
  {
    titre: 'Animations du week-end',
    quand: 'Chaque week-end',
    desc: 'Quiz, rassemblements cosplay, tournois sur Switch et PS4 : le programme se dévoile sur Instagram.',
    visuel: { id: 'coin-gaming' },
  },
];
