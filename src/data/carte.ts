/* CARTE DE DÉMONSTRATION. Le dossier « Menu » du brief n'a pas été fourni :
   noms, descriptions et prix sont fictifs mais plausibles. Remplacer ici, les
   pages se mettent à jour seules TANT QUE chaque catégorie porte un `visuel`.
   Ce qui le garantit, c'est le TYPE `Categorie` (`pnpm check`), pas une garde
   de frontmatter : la-carte.astro n'en contient aucune pour le visuel — sans
   lui, le build casse en TypeError au moment de construire l'URL de l'image.
   Un id d'illustration inconnu, lui, est refusé par `illu()` (lib/illu.ts). */
import { LICENCE_DU_MOIS } from './site';
import type { RefVisuel } from '../lib/illu';

/* Mention « carte de démonstration » affichée tant que ceci vaut true : passer
   à false quand la vraie carte est en place — cela retire la mention ET
   débloque la mise en production (scripts/verifier.mjs, garde PROD=1). */
export const DEMO = true;

export type Item = { nom: string; desc: string; prix: string; tags?: ('végé' | 'sans alcool' | 'signature')[] };
/* `visuel` : l'id d'une illustration de public/media/illu/, résolu par
   `visuel()` de lib/illu.ts — l'alternative textuelle par défaut y vit déjà
   (ALT) ; `alt` ici ne sert qu'à la remplacer quand le contexte le demande. */
export type Categorie = { slug: string; nom: string; intro: string; visuel: RefVisuel; items: Item[] };
export type Ephemere = { licence: string; intro: string; items: Item[] };

export const EPHEMERE: Ephemere = {
  licence: LICENCE_DU_MOIS.nom,
  intro: 'La carte éphémère du mois : des créations inspirées des sorcières que tout le monde attend.',
  items: [
    { nom: 'Le Sabbat', desc: 'gin, mûre, romarin fumé, tonic noir', prix: '10 €', tags: ['signature'] },
    { nom: "Potion d'Agatha", desc: 'mocktail cassis, citron vert, basilic, perles de fruit', prix: '7 €', tags: ['sans alcool'] },
    { nom: 'Burger Hocus Pocus', desc: 'bœuf, cheddar fumé, oignons caramélisés, sauce chipotle', prix: '15 €' },
  ],
};

export const CATEGORIES: Categorie[] = [
  {
    slug: 'cocktails', nom: 'Cocktails', intro: 'Des cocktails créés d\'après les personnages : leur caractère dans le verre.',
    visuel: { id: 'cocktail-zoro' },
    items: [
      { nom: 'Le Zoro', desc: 'gin, yuzu, basilic, trois lames de citron vert', prix: '9 €', tags: ['signature'] },
      { nom: 'Le Stark', desc: 'whisky, miel, gingembre, twist d\'orange', prix: '10 €' },
      { nom: 'La Poudlard', desc: 'rhum épicé, pomme, cannelle, mousse de caramel', prix: '9,50 €' },
      { nom: 'Le Multivers', desc: 'vodka, litchi, fruit du dragon, crème de violette', prix: '10 €' },
    ],
  },
  {
    slug: 'mocktails', nom: 'Mocktails', intro: 'Les mêmes univers, sans alcool.',
    visuel: { id: 'mocktail-fraise' },
    items: [
      { nom: 'Le Totoro', desc: 'concombre, menthe, citron vert, eau pétillante', prix: '6,50 €', tags: ['sans alcool'] },
      { nom: 'Le Pikachu', desc: 'mangue, passion, gingembre, jus de citron', prix: '6,50 €', tags: ['sans alcool'] },
      { nom: 'La Fraise Sailor', desc: 'fraise, basilic, sirop de rose, tonic', prix: '6,50 €', tags: ['sans alcool'] },
    ],
  },
  {
    slug: 'bubble-teas', nom: 'Bubble teas', intro: 'Perles de tapioca ou perles de fruit, chaud ou glacé.',
    visuel: { id: 'bubble-tea' },
    items: [
      { nom: 'Mangue passion', desc: 'thé vert, perles passion', prix: '6 €', tags: ['sans alcool'] },
      { nom: 'Taro', desc: 'lait, taro, perles de tapioca', prix: '6 €', tags: ['sans alcool'] },
      { nom: 'Matcha', desc: 'thé matcha, lait d\'avoine, perles brown sugar', prix: '6,50 €', tags: ['sans alcool'] },
    ],
  },
  {
    slug: 'cafes', nom: 'Cafés & boissons chaudes', intro: 'Depuis l\'époque Nakama\'s Coffee, on prend le café au sérieux.',
    visuel: { id: 'cafe-latte' },
    items: [
      { nom: 'Espresso', desc: 'arabica torréfié en Belgique', prix: '2,50 €', tags: ['sans alcool'] },
      { nom: 'Latte de l\'Hokage', desc: 'latte, sirop de sésame noir, latte art étoile', prix: '4,50 €', tags: ['sans alcool'] },
      { nom: 'Chocolat chaud Butterbeer', desc: 'chocolat, caramel beurre salé, chantilly', prix: '5 €', tags: ['sans alcool'] },
    ],
  },
  {
    slug: 'starters', nom: 'Starters', intro: 'À partager, ou pas.',
    visuel: { id: 'starters' },
    items: [
      { nom: 'Nachos Nakama', desc: 'cheddar fondu, guacamole, pico de gallo, jalapeños', prix: '9 €', tags: ['végé'] },
      { nom: 'Chicken pop', desc: 'bouchées de poulet croustillant, sauce sriracha-miel', prix: '8,50 €' },
      { nom: 'Rouleaux du dragon', desc: 'mini rouleaux de printemps, sauce sweet chili', prix: '7,50 €', tags: ['végé'] },
    ],
  },
  {
    slug: 'burgers', nom: 'Burgers', intro: 'Pain brioché, frites maison, et une sauce qui a un nom.',
    visuel: { id: 'burger-hokage' },
    items: [
      { nom: 'Burger Hokage', desc: 'bœuf, cheddar, sauce ramen, oignons crispy', prix: '15 €', tags: ['signature'] },
      { nom: 'Burger Vador', desc: 'pain noir, bœuf, bacon, cheddar fumé, sauce BBQ', prix: '15,50 €' },
      { nom: 'Burger Kirby', desc: 'galette de pois chiches, chèvre, miel, roquette', prix: '14 €', tags: ['végé'] },
      { nom: 'Burger Goku', desc: 'double bœuf, double cheddar, sauce spicy Super Saiyan', prix: '17 €' },
    ],
  },
  {
    slug: 'patisseries', nom: 'Pâtisseries', intro: 'Faites maison, elles changent avec la licence du mois.',
    visuel: { id: 'patisserie' },
    items: [
      { nom: 'Cheesecake Spider', desc: 'coulis de fruits rouges en toile', prix: '6 €', tags: ['végé'] },
      { nom: 'Cookie Cookie Monster', desc: 'triple chocolat, cœur fondant', prix: '3,50 €', tags: ['végé'] },
      { nom: 'Mochi du mois', desc: 'trois mochis glacés, parfums selon la licence', prix: '6,50 €', tags: ['végé'] },
    ],
  },
];
