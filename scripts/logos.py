"""Découpe les logos mensuels des planches « Logo timeline » (brief/site-actuel)
en vignettes WebP + un montage pour le remplissage des lettres du générique,
et génère src/data/logos.ts. Relancer après tout ajout de logo."""
import json

from PIL import Image, ImageDraw
from pathlib import Path

RACINE = Path(__file__).resolve().parent.parent
SRC = RACINE / 'brief' / 'site-actuel'
OUT = RACINE / 'public' / 'media' / 'logos'
OUT.mkdir(parents=True, exist_ok=True)

# (id, planche, cx, cy, rayon, mois AAAA-MM, licence)
LOGOS = [
    ('2024-04-nakamas', 'timeline-2024', 300, 800, 75, '2024-04', "Nakama's Coffee — naissance"),
    ('2024-06-demon-slayer', 'timeline-2024', 505, 305, 80, '2024-06', 'Demon Slayer'),
    ('2024-07-one-piece', 'timeline-2024', 640, 800, 75, '2024-07', 'One Piece'),
    ('2024-08-jujutsu-kaisen', 'timeline-2024', 825, 305, 80, '2024-08', 'Jujutsu Kaisen'),
    ('2024-09-fairy-tail', 'timeline-2024', 985, 800, 75, '2024-09', 'Fairy Tail'),
    ('2024-10-halloween', 'timeline-2024', 1140, 305, 80, '2024-10', 'Halloween'),
    ('2024-11-naruto', 'timeline-2024', 1325, 800, 75, '2024-11', 'Naruto'),
    ('2024-12-dragon-ball', 'timeline-2024', 1460, 305, 80, '2024-12', 'Dragon Ball Z'),
    ('2024-12-noel', 'timeline-2024', 1455, 118, 70, '2024-12', 'Noël'),
    ('2025-01-tattoo', 'timeline-2025', 160, 370, 65, '2025-01', 'Tattoo'),
    ('2025-02-bleach', 'timeline-2025', 215, 750, 65, '2025-02', 'Bleach'),
    ('2025-03-club-dorothee', 'timeline-2025', 425, 370, 65, '2025-03', 'Club Dorothée'),
    ('2025-04-nana', 'timeline-2025', 475, 750, 65, '2025-04', 'Nana'),
    ('2025-05-pokemon', 'timeline-2025', 685, 370, 65, '2025-05', 'Pokémon'),
    ('2025-06-one-piece', 'timeline-2025', 735, 750, 65, '2025-06', 'One Piece'),
    ('2025-07-magical-girls', 'timeline-2025', 950, 370, 65, '2025-07', 'Magical Girls'),
    ('2025-08-badass', 'timeline-2025', 990, 750, 65, '2025-08', 'Badass'),
    ('2025-09-demon-hunters', 'timeline-2025', 1215, 370, 65, '2025-09', 'Kpop Demon Hunters'),
    ('2025-10-scientifique', 'timeline-2025', 1245, 750, 65, '2025-10', 'Scientifique'),
    ('2025-10-halloween', 'timeline-2025', 1245, 905, 50, '2025-10', 'Halloween'),
    ('2025-11-my-hero-academia', 'timeline-2025', 1470, 370, 65, '2025-11', 'My Hero Academia'),
    ('2025-12-closing', 'timeline-2025', 1500, 750, 65, '2025-12', 'Closing de Noël'),
    ('2026-01-hazbin-hotel', 'timeline-2026', 165, 215, 60, '2026-01', 'Hazbin Hotel'),
    ('2026-01-one-piece', 'timeline-2026', 165, 365, 60, '2026-01', 'One Piece'),
    ('2026-02-saint-valentin', 'timeline-2026', 215, 770, 60, '2026-02', 'Saint-Valentin'),
    ('2026-03-hunter-x-hunter', 'timeline-2026', 425, 365, 60, '2026-03', 'Hunter × Hunter'),
    ('2026-04-deux-ans', 'timeline-2026', 480, 770, 60, '2026-04', 'Les 2 ans'),
    ('2026-05-daily-pop-society', 'timeline-2026', 712, 303, 82, '2026-05', 'Daily Pop Society — nouveau logo'),
]
# L'ordre chronologique du fichier généré est un INVARIANT, pas une convention
# de saisie : la frise et le générique le lisent tel quel.
LOGOS = sorted(LOGOS, key=lambda l: (l[5], l[0]))
assert len({l[0] for l in LOGOS}) == len(LOGOS), 'id en double'

TAILLE = 160

# Masque circulaire : les planches sources sont des timelines, chaque logo y est
# posé sur un trait noir qui traversait les coins des vignettes carrées. On
# découpe donc un disque. Le masque est dessiné en 4× puis réduit : le bord du
# cercle est lissé, sinon il ressort en escalier à 160 px.
ECH = 4
_m = Image.new('L', (TAILLE * ECH, TAILLE * ECH), 0)
ImageDraw.Draw(_m).ellipse((0, 0, TAILLE * ECH - 1, TAILLE * ECH - 1), fill=255)
MASQUE = _m.resize((TAILLE, TAILLE), Image.LANCZOS)

# Vignettes orphelines : un logo retiré de la table laissait son WebP sur le
# disque, référencé par plus personne mais embarqué dans l'image de prod.
attendus = {f'{l[0]}.webp' for l in LOGOS} | {'montage.webp'}
for f in OUT.glob('*.webp'):
    if f.name not in attendus:
        f.unlink()
        print(f'orphelin supprimé : {f.name}')

planches = {}
def planche(nom):
    if nom not in planches:
        planches[nom] = Image.open(SRC / f'{nom}.jpg').convert('RGB')
    return planches[nom]

lignes = []
vignettes = []
for id_, pl, cx, cy, r, mois, licence in LOGOS:
    marge = 6
    pl_im = planche(pl)
    # PIL.crop remplit de NOIR, en silence, tout ce qui dépasse la planche.
    assert (
        0 <= cx - r - marge and cx + r + marge <= pl_im.width
        and 0 <= cy - r - marge and cy + r + marge <= pl_im.height
    ), f'{id_} : hors planche'
    im = pl_im.crop((cx - r - marge, cy - r - marge, cx + r + marge, cy + r + marge)).resize((TAILLE, TAILLE), Image.LANCZOS).convert('RGBA')
    im.putalpha(MASQUE)
    im.save(OUT / f'{id_}.webp', 'WEBP', quality=84, method=6)
    vignettes.append(im)
    # json.dumps, pas d'interpolation brute : une apostrophe ou un guillemet
    # dans une licence (« Nakama's Coffee ») casserait le fichier généré.
    champs = ', '.join(
        f'{cle}: {json.dumps(val, ensure_ascii=False)}'
        for cle, val in (('id', id_), ('mois', mois), ('licence', licence), ('src', f'/media/logos/{id_}.webp'))
    )
    lignes.append(f'  {{ {champs} }},')

# Montage 10 colonnes : remplissage des lettres « DAILY POP » (background-clip: text)
cols = 10
rows = (len(vignettes) + cols - 1) // cols
# Le montage reste en RGB sur fond blanc (il sert de background-image derrière
# du texte détouré : pas d'alpha à y traîner). Les disques y sont collés avec
# leur propre alpha, le hors-cercle redevient donc blanc.
mont = Image.new('RGB', (TAILLE * cols, TAILLE * rows), 'white')
for i, v in enumerate(vignettes):
    mont.paste(v, ((i % cols) * TAILLE, (i // cols) * TAILLE), v)
mont.save(OUT / 'montage.webp', 'WEBP', quality=80, method=6)

ts = (RACINE / 'src' / 'data' / 'logos.ts')
ts.parent.mkdir(parents=True, exist_ok=True)
ts.write_text(
    "/* GÉNÉRÉ par scripts/logos.py — ne pas éditer à la main. */\n"
    "export type LogoMensuel = { id: string; mois: string; licence: string; src: string };\n\n"
    "export const LOGOS: LogoMensuel[] = [\n" + "\n".join(lignes) + "\n];\n\n"
    f"export const MONTAGE = {{ src: '/media/logos/montage.webp', largeur: {TAILLE * cols}, hauteur: {TAILLE * rows} }};\n",
    encoding='utf-8',
    newline='\n',  # le dépôt est en LF ; write_text traduisait en CRLF sous Windows
)
print(f'{len(LOGOS)} logos → {OUT}, montage {mont.size}, logos.ts écrit')
