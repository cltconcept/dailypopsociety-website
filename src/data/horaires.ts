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

/* Pour le JSON-LD schema.org (openingHoursSpecification).
   « 9h » → « 09:00 », « 9h30 » → « 09:30 », « 16h » → « 16:00 ».
   Le séparateur accepte le tiret cadratin (–) comme le tiret ordinaire (-),
   avec ou sans espaces : une graphie saisie à la main ne doit pas produire
   un horaire faux et silencieux dans le JSON-LD. */
const heure = (h: string) => {
  const [hh, mm] = h.trim().replace(/\s/g, '').split('h');
  return `${hh.padStart(2, '0')}:${(mm || '').padEnd(2, '0')}`;
};

export const HORAIRES_SCHEMA = JOURS.filter((j) => j.creneaux).flatMap((j) =>
  j.creneaux!.map((c) => {
    const [ouvre, ferme] = c.split(/\s*[–-]\s*/).map(heure);
    return {
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][j.index],
      opens: ouvre,
      closes: ferme,
    };
  })
);
