/// <reference types="astro/client" />

/* Garde-fou du générique : `index.astro` pose la classe `js-intro` avant le
   premier rendu et garde le handle de son minuteur de secours sur `window`,
   pour que le script du composant puisse l'annuler quand GSAP a pris la main.
   Déclaré ici plutôt qu'à coups de cast dans le composant. */
declare global {
  interface Window {
    __introSecours?: number;
  }
}

export {};
