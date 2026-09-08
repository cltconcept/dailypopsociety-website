/* Données partagées — une seule source pour les pages, le footer et le JSON-LD.
   Tout vient du brief (moodboard du 06/08/2026) et d'info.txt. */

export const IDENTITE = {
  nom: 'Daily Pop Society',
  slogan: 'Food · Drinks · Fandom',
  accroche: 'Le bar pop culture de Charleroi',
  rue: 'Quai Arthur Rimbaud 9',
  codePostal: '6000',
  ville: 'Charleroi',
  telephone: '0479 79 72 86',
  telephoneIntl: '+32479797286',
  // À CONFIRMER CLIENTE : le site actuel affiche contact@dailypopsociety.be,
  // le brief donne une adresse Hotmail. On affiche l'adresse du domaine.
  email: 'contact@dailypopsociety.be',
  tva: 'BE 1006.306.605',
  domaine: 'https://dailypopsociety.be',
  facebook: 'https://www.facebook.com/p/Daily-Pop-Society-By-Nakamas-Coffee-61554198456761/',
  instagram: 'https://www.instagram.com/dailypopsociety',
  // À CONFIRMER CLIENTE : coordonnées GPS (geo) et lien Messenger
  // (m.me/<id-page>) — ne jamais les deviner. L'itinéraire part donc de
  // l'ADRESSE, que Google résout lui-même, et le JSON-LD ne publie pas de
  // bloc `geo` : un point faux vaut moins que pas de point du tout.
  itineraire: 'https://www.google.com/maps/dir/?api=1&destination=Quai+Arthur+Rimbaud+9%2C+6000+Charleroi',
  gerante: 'Rachel',
  surnom: "l'Hokage",
};

/* Description de référence de l'établissement — sert au JSON-LD (schema.org).
   Elle vit ici et pas dans le layout : un layout ne porte pas de contenu (§8). */
export const DESCRIPTION =
  'Bar food & drinks dédié à la pop culture à Charleroi : cocktails à personnages, burgers, bubble teas, events mensuels, blind tests, JDR, coin gaming. Cosplay friendly.';

/* La licence du mois — mise à jour mensuelle, lue par le générique et les events */
export const LICENCE_DU_MOIS = {
  nom: 'Daily Pop Coven',
  dates: '21/10 puis 28 → 31 octobre',
  accroche: 'Viens célébrer le sabbat que toutes les sorcières attendent.',
};

export const NAV = [
  { href: '/la-carte/', label: 'La carte' },
  { href: '/events/', label: 'Events' },
  { href: '/galerie/', label: 'Galerie' },
  { href: '/a-propos/', label: 'À propos' },
  { href: '/contact/', label: 'Contact' },
];
