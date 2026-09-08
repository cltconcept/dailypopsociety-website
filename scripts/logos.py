"""Découpe les logos mensuels des planches « Logo timeline » (brief/site-actuel)
en vignettes WebP + un montage pour le remplissage des lettres du générique,
et génère src/data/logos.ts. Relancer après tout ajout de logo."""
from PIL import Image
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
TAILLE = 160

planches = {}
def planche(nom):
    if nom not in planches:
        planches[nom] = Image.open(SRC / f'{nom}.jpg').convert('RGB')
    return planches[nom]

lignes = []
vignettes = []
for id_, pl, cx, cy, r, mois, licence in LOGOS:
    marge = 6
    im = planche(pl).crop((cx - r - marge, cy - r - marge, cx + r + marge, cy + r + marge)).resize((TAILLE, TAILLE), Image.LANCZOS)
    im.save(OUT / f'{id_}.webp', 'WEBP', quality=84, method=6)
    vignettes.append(im)
    lignes.append(f"  {{ id: '{id_}', mois: '{mois}', licence: \"{licence}\", src: '/media/logos/{id_}.webp' }},")

# Montage 10 colonnes : remplissage des lettres « DAILY POP » (background-clip: text)
cols = 10
rows = (len(vignettes) + cols - 1) // cols
mont = Image.new('RGB', (TAILLE * cols, TAILLE * rows), 'white')
for i, v in enumerate(vignettes):
    mont.paste(v, ((i % cols) * TAILLE, (i // cols) * TAILLE))
mont.save(OUT / 'montage.webp', 'WEBP', quality=80, method=6)

ts = (RACINE / 'src' / 'data' / 'logos.ts')
ts.write_text(
    "/* GÉNÉRÉ par scripts/logos.py — ne pas éditer à la main. */\n"
    "export type LogoMensuel = { id: string; mois: string; licence: string; src: string };\n\n"
    "export const LOGOS: LogoMensuel[] = [\n" + "\n".join(lignes) + "\n];\n\n"
    f"export const MONTAGE = {{ src: '/media/logos/montage.webp', largeur: {TAILLE * cols}, hauteur: {TAILLE * rows} }};\n",
    encoding='utf-8',
)
print(f'{len(LOGOS)} logos → {OUT}, montage {mont.size}, logos.ts écrit')
