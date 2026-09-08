/* Carte reprise de l'ancien site (daily-pop-society.netlify.app) le 2026-09-08
   — à faire relire par Rachel ; ce fichier est la seule source, les pages
   suivent. Chaque catégorie porte un `visuel` : ce qui le garantit, c'est le
   TYPE `Categorie` (`pnpm check`), pas une garde de frontmatter —
   la-carte.astro n'en contient aucune pour le visuel, et sans lui le build
   casse en TypeError au moment de construire l'URL de l'image. Un id
   d'illustration inconnu, lui, est refusé par `illu()` (lib/illu.ts).

   Deux conventions de prix, toutes deux reprises telles quelles de l'ancien
   site — jamais une moyenne, jamais un arrondi :
   · tailles ou formats d'un même produit → « 6 / 9 / 15,50 € » ;
   · éventail de parfums trop long pour la ligne → « 8,90 → 12,90 € », le détail
     parfum par parfum vivant alors dans la description.
   Les « ,00 » de l'ancien site sont tombés (« 17,00€ » → « 17 € ») : c'est de
   la typographie, pas un changement de prix. */
import { LICENCE_DU_MOIS } from './site';
import type { RefVisuel } from '../lib/illu';

/* Mention « carte de démonstration » affichée tant que ceci vaut true : passé
   à false le 2026-09-08 avec l'arrivée de la vraie carte — cela retire la
   mention ET débloque la mise en production (scripts/verifier.mjs, garde
   PROD=1). */
export const DEMO = false;

/* `desc` est FACULTATIF : l'ancien site ne décrit ni le Seven Up ni le thé, et
   un `<p>` vide dans la liste creuse un blanc que personne ne sait expliquer.
   La page ne pose la ligne de description que s'il y en a une. */
export type Item = { nom: string; desc?: string; prix: string; tags?: ('végé' | 'sans alcool' | 'signature')[] };
/* `visuel` : l'id d'une illustration de public/media/illu/, résolu par
   `visuel()` de lib/illu.ts — l'alternative textuelle par défaut y vit déjà
   (ALT) ; `alt` ici ne sert qu'à la remplacer quand le contexte le demande. */
export type Categorie = { slug: string; nom: string; intro: string; visuel: RefVisuel; items: Item[] };
export type Ephemere = { licence: string; intro: string; items: Item[] };

/* À CONFIRMER CLIENTE : créations de la carte éphémère d'octobre. L'ancien site
   ne porte AUCUNE carte du mois — ces trois lignes restent donc les nôtres,
   inventées, en attendant celles de Rachel. Elles sont le seul contenu de cette
   page qui ne vienne pas de l'ancien site. */
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
    slug: 'cocktails', nom: 'Cocktails signature', intro: 'Les créations maison, à composition affichée : tu sais ce que tu bois.',
    visuel: { id: 'cocktail-zoro' },
    items: [
      { nom: 'Anti Takumi', desc: 'liqueur fraise, rhum blanc, topping fraise, sirop fraise, jus de mangue, eau pétillante', prix: '14 €', tags: ['signature'] },
      { nom: 'Queen Rachel', desc: 'tequila, whisky, sirop cerise, citron, sucre de canne, cola', prix: '14 €', tags: ['signature'] },
      { nom: 'Mao Mao', desc: 'gin, vodka, sirop cerise, soda, citron, butterfly pea tea', prix: '14 €', tags: ['signature'] },
      { nom: 'Stranger Spice', desc: 'Jack Red, rhum brun, vodka vanille, jus de pomme, soda', prix: '14 €', tags: ['signature'] },
      { nom: 'Guts', desc: 'whisky, vanille, rhum brun, triple sec, jus de raisin, soda', prix: '14 €', tags: ['signature'] },
      { nom: 'Summer Loving', desc: 'vodka pastèque, gin, citron, tonic pastèque framboise, basilic, sorbet framboise', prix: '14 €', tags: ['signature'] },
      { nom: 'Bridgerton Blush', desc: 'gin, vodka framboise, sirop de rose, jus fruits de la passion', prix: '14 €', tags: ['signature'] },
      { nom: 'Tony Tony', desc: 'gin, amaretto, vodka, limonade, citron, barbe à papa, sirop de fraise', prix: '14 €', tags: ['signature'] },
      { nom: 'Maleficent Mist', desc: 'rhum brun, vodka, gin, sirop de violette, citron vert, soda', prix: '12 €', tags: ['signature'] },
      { nom: 'Miami Vice', desc: 'tequila, liqueur orange, cava brut, purée de fraise, citron, jus de mangue', prix: '14 €', tags: ['signature'] },
      { nom: 'Affogato Spécial', desc: 'espresso versé sur glace vanille, crème fraîche, cacao, avec un supplément alcool au choix : amaretto ou whisky', prix: '7,50 €', tags: ['signature'] },
    ],
  },
  {
    slug: 'cocktails-sans-alcool', nom: 'Cocktails sans alcool', intro: "Les mêmes créations maison, sans une goutte d'alcool.",
    visuel: { id: 'mocktail-fraise' },
    items: [
      { nom: 'Kirby Love', desc: 'sirop de fraise, citron, soda, sorbet fraise', prix: '8,50 €', tags: ['sans alcool'] },
      { nom: 'Jinxs Juice', desc: 'topping bubble gum, sirop pêche framboise, citron, soda, eau pétillante, mix de barbe à papa', prix: '8,50 €', tags: ['sans alcool'] },
      { nom: 'Pickles Rick', desc: 'sirop de kiwi, sirop de vanille, jus de pomme, soda', prix: '8 €', tags: ['sans alcool'] },
      { nom: 'Nuage magique', desc: 'sirop pêche blanche, sirop de vanille, sirop de fraise, soda, eau pétillante, barbe à papa jaune', prix: '8,50 €', tags: ['sans alcool'] },
      { nom: 'Barbie Dream Pop', desc: 'topping framboise, sirop de rose, sirop de fraise, soda, eau pétillante', prix: '8 €', tags: ['sans alcool'] },
      { nom: 'Wanda Frost', desc: 'purée de fraise, citron, menthe, soda, sirop de cerise', prix: '8,50 €', tags: ['sans alcool'] },
    ],
  },
  {
    slug: 'bubble-tea-softs', nom: 'Bubble tea & softs', intro: 'Ton bubble tea se compose en trois choix ; les classiques sont là aussi.',
    visuel: { id: 'bubble-tea' },
    items: [
      { nom: 'Bubble Tea', desc: 'thé glacé au choix (vert, noir, fraise), sirop au choix (fraise, violette, pêche, cerise, vanille), billes au choix (fraise, cerise, litchi, myrtilles) — lait +1 €', prix: '6 €' },
      { nom: 'Thé glacé maison', prix: '4 €' },
      { nom: 'Pepsi / Pepsi Max', prix: '3 €' },
      { nom: 'Looza', desc: 'Fraise · Pomme cerise · Melon Delight · Ace', prix: '3,20 €' },
      { nom: 'Spa plate / pétillante', prix: '3 €' },
      { nom: 'Seven Up', prix: '3 €' },
    ],
  },
  {
    slug: 'bieres', nom: 'Bières', intro: 'Trois pressions, dix bouteilles, dont une sans alcool.',
    visuel: { id: 'comptoir' },
    items: [
      { nom: 'Blanche rosée', desc: 'au fût', prix: '4 €' },
      { nom: 'Stella Artois', desc: 'au fût', prix: '3,50 €' },
      { nom: 'Triple Karmeliet', desc: 'au fût', prix: '5,50 €' },
      { nom: 'Frambush', desc: 'bouteille 33 cl', prix: '4,70 €' },
      { nom: 'Pêche Mel Bush', desc: 'bouteille 33 cl', prix: '4,70 €' },
      { nom: 'Cuvée des Trolls', desc: 'bouteille 33 cl', prix: '4,80 €' },
      { nom: 'Lowa Troll', desc: 'bouteille 33 cl', prix: '4,50 €', tags: ['sans alcool'] },
      { nom: 'Duvel', desc: 'bouteille 33 cl', prix: '4,80 €' },
      { nom: 'Desperados', desc: 'bouteille', prix: '4,50 €' },
      { nom: 'Chimay Blanche', desc: 'bouteille 33 cl', prix: '4,70 €' },
      { nom: 'Chimay Bleue', desc: 'bouteille 33 cl', prix: '5,20 €' },
      { nom: 'Chimay Dorée', desc: 'bouteille 33 cl', prix: '4,50 €' },
      { nom: 'Orval', desc: 'bouteille 33 cl', prix: '4,50 €' },
    ],
  },
  {
    slug: 'boissons-chaudes', nom: 'Boissons chaudes', intro: "Du café à l'ube latte, et l'irish coffee en trois tailles.",
    visuel: { id: 'cafe-latte' },
    items: [
      { nom: 'Affogato', desc: 'un espresso directement versé sur de la glace vanille, nappé de crème fraîche et de cacao', prix: '5,50 €' },
      { nom: 'Café', desc: 'lait +0,50 €', prix: '3 €' },
      { nom: 'Cappuccino', desc: 'crème fraîche ou mousse de lait', prix: '4 €' },
      { nom: 'Ube Latte', desc: 'au choix chaud ou froid — sirop +0,50 €', prix: '6 €' },
      { nom: 'Latte Macchiato', desc: 'au choix chaud ou froid — topping vanille, caramel, noisette, cookie ou pop corn +0,50 €, lait végétal +0,50 €', prix: '5 €' },
      { nom: 'Matcha Latte', desc: 'au choix chaud ou froid — topping vanille, caramel ou noisette +0,50 €', prix: '6 €' },
      { nom: 'Irish Coffee', desc: 'Le Grain 25 cl, Le Chann 50 cl, Le Joann 75 cl', prix: '9,50 / 18 / 27 €' },
      { nom: 'Italian Coffee', prix: '9,50 €' },
      { nom: 'Thé', prix: '3,30 €' },
    ],
  },
  {
    slug: 'starters', nom: 'Starters', intro: 'À partager, ou pas — les portions solo existent.',
    visuel: { id: 'starters' },
    items: [
      { nom: "Joey doesn't share food !", desc: 'nuggets, onion rings, karaage, portion nachos et cheddar — pour 2 personnes, +2,50 € par personne supplémentaire', prix: '17,50 €' },
      { nom: 'La planche de Remi', desc: 'planche apéro à partager avec mix de charcuterie, mix de fromage, olives, tapenade, pesto, grisini', prix: '15,50 €' },
      { nom: 'Nachos', desc: 'cheddar, guacamole, jalapeños, sauce salsa — Padawan (1 pers.), Chevalier Jedi (2-3 pers.), Maître Jedi (3-4 pers.)', prix: '6 / 9 / 15,50 €' },
      { nom: 'Portion onion rings', desc: 'sauce au choix', prix: '5,50 €' },
      { nom: 'Portion karaage', desc: 'sauce au choix', prix: '6 €' },
      { nom: 'Portion de nuggets', desc: 'sauce au choix', prix: '4 €' },
    ],
  },
  {
    slug: 'burgers', nom: 'Burgers', intro: 'Bun brioché, viande au choix, et une sauce qui a un nom.',
    visuel: { id: 'burger-hokage' },
    items: [
      { nom: 'Chôji', desc: 'pain burger brioché, 2 tranches de cheddar, oignons frits, bacon grillé, salade, tomate, sauce papillon (moutarde, ketchup et miel)', prix: '17 €' },
      { nom: 'TNT Burger', desc: 'pain burger brioché, 2 tranches de cheddar, onion rings croustillants, mayonnaise sriracha, paprika fumé, pickles de jalapeños, laitue croquante, tomate fraîche', prix: '19 €' },
      { nom: 'Le Stark', desc: 'pain burger brioché, bacon grillé, cheddar fondu, oignons rouges, laitue, tomate, cornichon, sauce BBQ', prix: '15 €' },
      { nom: 'Le Colossal', desc: 'bun brioché, viande au choix, double rösti de pomme de terre, tranches de cheddar, salade, oignons rouges et oignons frits', prix: '18 €' },
      { nom: 'Fat Nuggets', desc: 'bun, nuggets, cheddar, cheddar fondu, oignons frits, salade, sauce smokey bacon', prix: '16 €' },
      { nom: 'Morrow Burger', desc: "bun brioché, viande au choix, cheddar affiné, bacon grillé au sirop d'érable et paprika, pommes vertes et sauce framboise vinaigre balsamique", prix: '17 €' },
      { nom: 'Jungle Boost', desc: 'bun, viande au choix, poivron grillé, ananas grillé, cheddar, sauce poivre et filet de miel', prix: '15 €' },
      { nom: 'Gomu Gomu', desc: 'bun, 4 beef smash, 4 tranches cheddar, 3 tranches de lard grillé, sauce curry mangue, salade croquante, oignons frits', prix: '25 €' },
      { nom: 'Baby Boss Burger', desc: 'menu des petits héros : mini bun, smash burger simple, cheddar, sauce ketchup', prix: '9,50 €' },
      { nom: "Maggie's Burger", desc: 'menu des petits héros : mini bun, tenders de poulet, cheddar, sauce mayo', prix: '9,50 €' },
      /* Le seul prix que l'ancien site ne publie PAS : le burger sur mesure n'y
         porte aucun montant de base, seulement des suppléments. On ne l'invente
         pas — on écrit ce qu'on sait, le comptoir dit le reste. */
      { nom: 'Custom ton burger', desc: 'bun brioché, viande au choix (smash burger 150 g, Black Angus 200 g +2 €, poulet pané, steak végétarien), accompagnement en option (potatoes +3 €, onion rings +4 €, rösti +4 €). Suppléments : sauce +1 €, viande +2 €, cheese +1,50 € — hors Black Angus 200 g, supplément +3 €', prix: 'à composer' },
    ],
  },
  {
    slug: 'desserts', nom: 'Desserts', intro: 'Crêpes, gaufres, milkshakes : la partie sucrée de la carte.',
    visuel: { id: 'patisserie' },
    items: [
      { nom: 'Crêpes (2 pièces)', desc: "sucre 8,90 €, cassonade 8,90 €, caramel au beurre salé 9,90 €, Nutella 10,90 €, sirop d'érable 11,90 €, Snickers 12,90 €", prix: '8,90 → 12,90 €' },
      { nom: 'Milkshake', desc: 'vanille et fraise 6 €, pistache, caramel, Nutella et speculoos 6,50 €', prix: '6 / 6,50 €' },
      { nom: 'Le soutif de Nicky', desc: '2 crêpes avec boules de glace vanille et topping chocolat', prix: '12,90 €' },
      { nom: 'Freakshow', desc: 'milkshake vanille avec topping au choix (chocolat ou fraise), une montagne de chantilly et un assortiment de gourmandises sucrées', prix: '12,90 €' },
      { nom: 'Bubble Waffle', desc: 'une gaufrette moelleuse et croustillante, une boule de glace et un topping généreux : chocolat, Nutella ou 3 chocolats 11,90 € ; speculoos, caramel beurre salé, chocolat blanc pistache ou fraise (en saison) 12,90 €', prix: '11,90 / 12,90 €' },
      { nom: 'Corn waffle (trio)', desc: 'speculoos, pistache, nutella', prix: '13,90 €' },
      { nom: 'Affogato Cookie Dough', desc: 'pâte à cookie crue, boule de glace vanille, topping au choix, chantilly, espresso à verser', prix: '8,90 €' },
      { nom: "« D'oh ! »", desc: 'donuts avec boule de glace vanille et topping au choix', prix: '8,90 €' },
    ],
  },
];
