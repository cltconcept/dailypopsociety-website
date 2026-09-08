// brief/illu-src/<id>.png → public/media/illu/<id>-{480,960,1440}.webp (4:3 recadré)
import sharp from 'sharp';
import { readdirSync, mkdirSync } from 'node:fs';
mkdirSync('public/media/illu', { recursive: true });
const LARGEURS = [480, 960, 1440];
for (const f of readdirSync('brief/illu-src').filter((n) => n.endsWith('.png'))) {
  const id = f.replace(/\.png$/, '');
  for (const w of LARGEURS) {
    await sharp(`brief/illu-src/${f}`).resize(w, Math.round((w * 3) / 4), { fit: 'cover' }).webp({ quality: 82 }).toFile(`public/media/illu/${id}-${w}.webp`);
  }
  console.log('✓', id);
}
