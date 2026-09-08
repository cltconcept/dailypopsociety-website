export type Jour = { jour: string; court: string; creneaux: string[] | null; index: number };

/* index = getDay() JS (0 = dimanche) pour surligner le jour courant */
export const JOURS: Jour[] = [
  { jour: 'Lundi', court: 'Lun', creneaux: null, index: 1 },
  { jour: 'Mardi', court: 'Mar', creneaux: ['16h – 20h'], index: 2 },
  { jour: 'Mercredi', court: 'Mer', creneaux: ['13h – 20h'], index: 3 },
  { jour: 'Jeudi', court: 'Jeu', creneaux: ['16h – 20h'], index: 4 },
  { jour: 'Vendredi', court: 'Ven', creneaux: ['12h – 15h', '18h – 22h'], index: 5 },
  { jour: 'Samedi', court: 'Sam', creneaux: ['12h – 15h', '18h – 22h'], index: 6 },
  { jour: 'Dimanche', court: 'Dim', creneaux: null, index: 0 },
];

export const MENTION_HORAIRES =
  'Horaires susceptibles de changer avec la rentrée et la saison : vérifie sur Instagram avant de venir.';

/* Pour le JSON-LD schema.org (openingHoursSpecification) */
export const HORAIRES_SCHEMA = JOURS.filter((j) => j.creneaux).flatMap((j) =>
  j.creneaux!.map((c) => {
    const [ouvre, ferme] = c.split(' – ').map((h) => h.replace('h', ':').padEnd(5, '0').replace(/^(\d):/, '0$1:'));
    return {
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][j.index],
      opens: ouvre,
      closes: ferme,
    };
  })
);
