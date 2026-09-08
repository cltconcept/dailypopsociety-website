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
# de saisie : la frise et le générique le lisent tel quel. On trie sur le MOIS
# seul ; `sorted` étant stable, deux logos d'un même mois gardent l'ordre de
# saisie de la table ci-dessus (le principal avant son alternative, jamais
# l'alphabet — « 2024-12-dragon-ball » n'a pas à passer devant « 2024-12-noel »
# pour une raison typographique).
LOGOS = sorted(LOGOS, key=lambda l: l[5])
doublons = sorted({l[0] for l in LOGOS if [x[0] for x in LOGOS].count(l[0]) > 1})
if doublons:
    raise SystemExit(f'id en double dans la table LOGOS : {", ".join(doublons)}')

TAILLE = 160
MARGE = 6  # pixels de planche gardés autour du disque, dans les coordonnées source

# Masque circulaire : les planches sources sont des timelines, chaque logo y est
# posé sur un trait noir qui traversait les coins des vignettes carrées. On
# découpe donc un disque — mais un disque INSCRIT dans la marge, pas dans la
# vignette : la découpe garde MARGE pixels de planche autour du logo, donc le
# trait noir tombe dans cet anneau. Un masque plein-cadre le laissait passer et
# semait des ergots noirs dans les coins. Le rayon du disque source vaut
# r / (r + MARGE) de la demi-vignette : l'inset s'en déduit, et il dépend du
# logo (r va de 50 à 82). Le masque est dessiné en ECH× puis réduit en BOX
# (moyenne de boîte exacte, aucun dépassement) : le bord est lissé, sinon il
# ressort en escalier à 160 px.
ECH = 4
_masques = {}
def masque(r, marge):
    if (r, marge) not in _masques:
        inset = round(ECH * TAILLE / 2 * marge / (r + marge))
        m = Image.new('L', (TAILLE * ECH, TAILLE * ECH), 0)
        ImageDraw.Draw(m).ellipse((inset, inset, TAILLE * ECH - 1 - inset, TAILLE * ECH - 1 - inset), fill=255)
        _masques[(r, marge)] = m.resize((TAILLE, TAILLE), Image.BOX)
    return _masques[(r, marge)]

planches = {}
def planche(nom):
    if nom not in planches:
        planches[nom] = Image.open(SRC / f'{nom}.jpg').convert('RGB')
    return planches[nom]

lignes = []
vignettes = []
for id_, pl, cx, cy, r, mois, licence in LOGOS:
    pl_im = planche(pl)
    # PIL.crop remplit de NOIR, en silence, tout ce qui dépasse la planche : on
    # refuse la vignette plutôt que de la livrer amputée. SystemExit et non
    # assert (que `python -O` désactive), et un message qui nomme le bord fautif
    # et sa borne — « hors planche » tout court n'aide personne à recadrer.
    boite = (cx - r - MARGE, cy - r - MARGE, cx + r + MARGE, cy + r + MARGE)
    debords = []
    if boite[0] < 0: debords.append(f'gauche {boite[0]} < 0')
    if boite[1] < 0: debords.append(f'haut {boite[1]} < 0')
    if boite[2] > pl_im.width: debords.append(f'droite {boite[2]} > {pl_im.width}')
    if boite[3] > pl_im.height: debords.append(f'bas {boite[3]} > {pl_im.height}')
    if debords:
        raise SystemExit(
            f'{id_} : découpe hors planche {pl} ({pl_im.width}×{pl_im.height} px), '
            f'centre ({cx}, {cy}) rayon {r} + marge {MARGE} → ' + ', '.join(debords)
        )
    im = pl_im.crop(boite).resize((TAILLE, TAILLE), Image.LANCZOS).convert('RGBA')
    im.putalpha(masque(r, MARGE))
    im.save(OUT / f'{id_}.webp', 'WEBP', quality=84, method=6)
    vignettes.append(im)
    # json.dumps, pas d'interpolation brute : une apostrophe ou un guillemet
    # dans une licence (« Nakama's Coffee ») casserait le fichier généré.
    champs = ', '.join(
        f'{cle}: {json.dumps(val, ensure_ascii=False)}'
        for cle, val in (('id', id_), ('mois', mois), ('licence', licence), ('src', f'/media/logos/{id_}.webp'))
    )
    lignes.append(f'  {{ {champs} }},')

# Vignettes orphelines : un logo retiré de la table laissait son WebP sur le
# disque, référencé par plus personne mais embarqué dans l'image de prod.
# APRÈS la boucle, jamais avant : une découpe refusée (hors planche) coupait
# le script une fois les fichiers déjà supprimés — le dossier restait amputé et
# la relance suivante ne savait plus quoi regénérer.
attendus = {f'{l[0]}.webp' for l in LOGOS} | {'montage.webp'}
for f in OUT.glob('*.webp'):
    if f.name not in attendus:
        f.unlink()
        print(f'orphelin supprimé : {f.name}')

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
