/* Schémas schema.org du site — construits ICI, jamais dans un layout :
   un layout assemble une page, il ne porte pas de contenu (spec §8).
   Toute la matière vient de src/data/. */
import { IDENTITE, DESCRIPTION } from '../data/site';
import { HORAIRES_SCHEMA } from '../data/horaires';

/** L'établissement lui-même. `image` attend une URL absolue (og par défaut). */
export function schemaBar(image: string = `${IDENTITE.domaine}/media/og.png`) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BarOrPub',
    '@id': `${IDENTITE.domaine}/#bar`,
    name: IDENTITE.nom,
    slogan: IDENTITE.slogan,
    description: DESCRIPTION,
    url: IDENTITE.domaine,
    image,
    telephone: IDENTITE.telephoneIntl,
    email: IDENTITE.email,
    servesCuisine: ['Burgers', 'Cocktails', 'Bubble tea'],
    priceRange: '€€',
    address: {
      '@type': 'PostalAddress',
      streetAddress: IDENTITE.rue,
      postalCode: IDENTITE.codePostal,
      addressLocality: IDENTITE.ville,
      addressCountry: 'BE',
    },
    openingHoursSpecification: HORAIRES_SCHEMA,
    sameAs: [IDENTITE.facebook, IDENTITE.instagram],
  };
}
