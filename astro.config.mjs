// Site 100 % statique : Astro génère du HTML pur, GSAP s'hydrate en <script> natif.
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  integrations: [sitemap()],
  // Domaine à réserver par la cliente (brief) — la maquette chris-ia.com ne doit
  // pas se faire indexer à sa place : canonical et sitemap pointent ici.
  site: 'https://dailypopsociety.be',
  // Port dédié : 4330 dentalexpert, 4331 xenia (cf. mémoire sites-vitrines)
  server: { port: 4332 },
  devToolbar: { enabled: false },
});
