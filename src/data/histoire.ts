/* Les trois temps de l'histoire du bar, pour la page « À propos ». */
import { IDENTITE } from './site';

export type Etape = { date: string; titre: string; texte: string };

export const ETAPES: Etape[] = [
  {
    date: 'Avril 2024',
    titre: "Nakama's Coffee",
    texte: `Un café manga imaginé par ${IDENTITE.gerante}, passionnée de pop culture depuis toujours. L'idée : un lieu où chacun se sent à sa place, une vraie safe place, que tu sois geek convaincu, amateur de ciné, de jeux vidéo, de séries, ou simplement curieux.`,
  },
  {
    date: 'Décembre 2025',
    titre: 'Le concept fait peau neuve',
    texte: "Face à l'engouement de la communauté, l'univers s'ouvre à toute la pop culture : films, séries, animés, jeux. Le nom « Nakama's Coffee » disait « manga » ; il fallait un nom qui dise tout le reste.",
  },
  {
    date: 'Juin 2026',
    titre: 'Daily Pop Society, au cœur de Charleroi',
    texte: "Le shop s'installe Quai Arthur Rimbaud pour donner vie à cette nouvelle identité. Cocktails, mocktails, bubble teas, cafés, starters, burgers et pâtisseries, dans une ambiance immersive et pleine de références à tes univers préférés.",
  },
];

/* À CONFIRMER CLIENTE : le sens du nom n'est pas dans le brief, formulation à valider par Rachel. */
export const POURQUOI_LE_NOM =
  "Un nom qui dit ce qu'on fait ici. « Pop », pour toute la pop culture, pas seulement les mangas. "
  + "« Society », parce que c'est une communauté avant d'être un bar : un lieu de partage où la pop "
  + "culture rassemble toutes les générations. « Daily », parce qu'un repaire, on y revient — pas "
  + "comme dans un bar qu'on visite une fois.";
