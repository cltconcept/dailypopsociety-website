/* « 2024-10 » → « Octobre 2024 » (ou « Octobre » sans l'année).

   Une SEULE implémentation : la frise des logos et la galerie en portaient
   chacune la leur, à un `year: 'numeric'` près.

   ⚠️ Date construite en heure LOCALE (`new Date(an, m - 1, 1)`) et non
   `new Date('2024-10-01')`, qui se lit en UTC : un build à l'ouest de
   Greenwich afficherait le mois précédent. */
export const moisLisible = (mois: string, opts: { annee?: boolean } = {}) => {
  const [an, m] = mois.split('-').map(Number);
  const texte = new Date(an, m - 1, 1).toLocaleDateString('fr-BE', {
    month: 'long',
    ...(opts.annee ? { year: 'numeric' } : {}),
  });
  return texte.charAt(0).toUpperCase() + texte.slice(1);
};
