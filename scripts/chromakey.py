"""Détoure les sprites générés sur fond magenta (#FF00FF) : brief/sprites-src/<id>.png
→ public/media/jeu/<id>.webp (RGBA, recadré au contenu, 256 px de côté max).
Chroma-key en distance HSV : le magenta pur devient transparent, la frange
proche du magenta est atténuée (alpha proportionnel), et le rose résiduel sur
les bords est désaturé. Relancer après toute régénération d'un sprite."""
from pathlib import Path
from PIL import Image
import colorsys

RACINE = Path(__file__).resolve().parent.parent
SRC = RACINE / 'brief' / 'sprites-src'
OUT = RACINE / 'public' / 'media' / 'jeu'
OUT.mkdir(parents=True, exist_ok=True)
TAILLE = 256

def alpha_pixel(r, g, b):
    h, s, v = colorsys.rgb_to_hsv(r / 255, g / 255, b / 255)
    # magenta : teinte ≈ 300° (0,833), saturation et valeur élevées
    dh = min(abs(h - 0.833), 1 - abs(h - 0.833))
    if s > 0.45 and v > 0.45 and dh < 0.06:
        return 0
    if s > 0.3 and v > 0.4 and dh < 0.12:
        return int(255 * min(1, (dh - 0.06) / 0.06))
    return 255

def detourer(png: Path) -> Path:
    im = Image.open(png).convert('RGB')
    px = im.load()
    out = Image.new('RGBA', im.size)
    po = out.load()
    for y in range(im.height):
        for x in range(im.width):
            r, g, b = px[x, y]
            a = alpha_pixel(r, g, b)
            if 0 < a < 255:
                # désature la frange rose : moyenne vers le gris de la luminance
                l = int(0.3 * r + 0.59 * g + 0.11 * b)
                r, g, b = (r + l) // 2, (g + l) // 2, (b + l) // 2
            po[x, y] = (r, g, b, a)
    bbox = out.getbbox()
    if bbox:
        out = out.crop(bbox)
    out.thumbnail((TAILLE, TAILLE), Image.LANCZOS)
    cible = OUT / f'{png.stem}.webp'
    out.save(cible, 'WEBP', quality=90, method=6)
    return cible

if __name__ == '__main__':
    pngs = sorted(SRC.glob('*.png'))
    if not pngs:
        raise SystemExit(f'aucun PNG dans {SRC}')
    for p in pngs:
        c = detourer(p)
        print(f'✓ {c.name} {Image.open(c).size}')
