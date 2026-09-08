/* Socle animation partagé des sites vitrines (dentalexpert → xenia → ici) :
   - gate prefers-reduced-motion
   - seuil desktop JS (1024, cf. breakpoints canoniques de global.css)
   - boot différé (idle / load / premier scroll) : GSAP hors chemin critique
   - sort()+refresh() obligatoire après chaque création de pin */

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
  if ('requestIdleCallback' in window) requestIdleCallback(run, { timeout });
  else window.addEventListener('load', run, { once: true });
  window.addEventListener('scroll', run, { once: true, passive: true });
}

/* Reveals génériques : tout [data-reveal] monte en fondu à l'entrée.
   Pas de scrub — de simples entrées « once » (piège dentalexpert :
   un pin avale les scrubs des sections suivantes). */
export function bootReveals({ gsap, ScrollTrigger }: GsapModules) {
  document.querySelectorAll<HTMLElement>('[data-reveal]').forEach((el) => {
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
