/* Socle animation partagé des sites vitrines (dentalexpert → xenia → ici) :
   - gate prefers-reduced-motion
   - seuil desktop JS (1024, cf. breakpoints canoniques de global.css)
   - boot différé (idle / load / premier scroll) : GSAP hors chemin critique
   - sort()+refresh() obligatoire après chaque création de pin

   ⚠️ Module CLIENT uniquement : il touche `window` dès l'import (REDUCED est
   évalué à l'import, une seule fois — un changement de réglage système en cours
   de session n'est pas suivi). Ne l'importer que depuis un <script> de page,
   jamais depuis le frontmatter d'un composant Astro (il s'exécuterait au build,
   où `window` n'existe pas). */

export const REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export const DESKTOP_MQ = '(min-width: 1024px)';
export const isDesktop = () => window.matchMedia(DESKTOP_MQ).matches;

type GsapModules = {
  gsap: typeof import('gsap').default;
  ScrollTrigger: typeof import('gsap/ScrollTrigger').ScrollTrigger;
};

let loaded: Promise<GsapModules> | null = null;
export function loadGsap(): Promise<GsapModules> {
  loaded ??= Promise.all([import('gsap'), import('gsap/ScrollTrigger')]).then(
    ([{ default: gsap }, { ScrollTrigger }]) => {
      gsap.registerPlugin(ScrollTrigger);
      return { gsap, ScrollTrigger };
    }
  );
  return loaded;
}

/* Lance `fn` une seule fois : à l'idle (ou au load), ou dès le premier scroll. */
export function onFirstIdle(fn: () => void, timeout = 3000) {
  let done = false;
  const run = () => {
    if (done) return;
    done = true;
    fn();
  };
  /* `'requestIdleCallback' in window` narrowait `window` à `never` dans le else
     (lib.dom déclare la méthode comme toujours présente) : astro check refusait.
     On teste le type de la méthode, et on l'appelle SUR window (détachée, Chrome
     lève « Illegal invocation »). */
  if (typeof window.requestIdleCallback === 'function') window.requestIdleCallback(run, { timeout });
  else window.addEventListener('load', run, { once: true });
  window.addEventListener('scroll', run, { once: true, passive: true });
}

/* Reveals génériques : tout [data-reveal] monte en fondu à l'entrée.
   Pas de scrub — de simples entrées « once » (piège dentalexpert :
   un pin avale les scrubs des sections suivantes).

   GSAP boote à l'idle, donc APRÈS le premier paint : animer un élément déjà
   visible le ferait disparaître puis revenir. On ne crée un tween que pour ce
   qui est encore sous la ligne de flottaison. */
export function bootReveals({ gsap, ScrollTrigger }: GsapModules) {
  document.querySelectorAll<HTMLElement>('[data-reveal]').forEach((el) => {
    if (el.getBoundingClientRect().top < window.innerHeight * 0.9) return;
    const children = el.hasAttribute('data-reveal-stagger') ? Array.from(el.children) : [el];
    gsap.from(children, {
      y: 26,
      opacity: 0,
      duration: 0.8,
      ease: 'power3.out',
      stagger: 0.09,
      clearProps: 'transform,opacity',
      scrollTrigger: { trigger: el, start: 'top 84%', once: true },
    });
  });
  ScrollTrigger.sort();
  ScrollTrigger.refresh();
}
