#!/usr/bin/env python3
"""Vidéo de présentation « La formation X en une minute » sur les pages formation (27/10/2026).

Idempotent : une page qui a déjà son bloc (repère `vf-sec`) est laissée telle quelle ;
pour changer un bloc, le retirer de la page puis relancer.
Vidéos sur Cloudflare R2 (`formations/<clé>.mp4`, envoi : skill switching-website-knowledge,
`scripts/r2-site-video.py put`) ; affiches dans `images/video-<clé>-poster.webp`.
Styles `/video-formation.css`, comportement `/video-formation.js` (même logique que la vidéo d'accueil).
Lancer : python3 tools/video_formation.py
"""
import json
import re
from datetime import datetime, timezone
from pathlib import Path
from zoneinfo import ZoneInfo

ROOT = Path(__file__).resolve().parents[1]
SITE = 'https://www.switching-formation.fr'
MEDIA = 'https://media.switching-formation.fr'
PLAYLIST = 'https://www.youtube.com/playlist?list=PLa1CGCVHY97o'
V = 2  # version des fichiers communs : l'augmenter après toute modification de /video-formation.css ou .js

# page, nom affiché, clé, identifiant YouTube, durée (s), mise en ligne publique (horodatage YouTube), titre, description
VIDEOS = [
    ('formation-excel-cpf.html', 'Excel', 'excel-30h', 'bXAUTpw6w4U', 55, 1793118012,
     'Excel de débutant à avancé — formation 30 h en e-learning',
     'Découvrez en une minute la formation « Excel – Niveau débutant à avancé » (30 heures) de Switching Formation.'),
    ('formation-excel-vba-cpf.html', 'Excel VBA', 'vba-21h', 'tYEM1_EOiv0', 55, 1793118123,
     'Excel VBA, macros et programmation — formation 21 h en e-learning',
     'Découvrez en une minute la formation « Excel VBA – Macros et programmation » (21 heures) de Switching Formation.'),
    ('formation-word-cpf.html', 'Word', 'word-30h', 'IsU2dyfvvyw', 55, 1793118044,
     'Word de débutant à avancé — formation 30 h en e-learning',
     'Découvrez en une minute la formation « Word – Niveau débutant à avancé » (30 heures) de Switching Formation.'),
    ('formation-powerpoint-cpf.html', 'PowerPoint', 'powerpoint-25h', 'WG4rqb5yhb0', 55, 1793118078,
     'PowerPoint de débutant à avancé — formation 25 h en e-learning',
     'Découvrez en une minute la formation « PowerPoint – Niveau débutant à avancé » (25 heures) de Switching Formation.'),
    ('formation-photoshop-cpf.html', 'Photoshop', 'photoshop-20h', 'GTGw6Shnx7w', 55, 1793118195,
     "Photoshop, de l'initiation à l'IA — formation 20 h en e-learning",
     "Découvrez en une minute la formation « Photoshop – De l'initiation au perfectionnement avec l'IA » (20 heures) de Switching Formation."),
    ('formation-anglais-cpf.html', 'anglais B1/B2', 'anglais-b1-b2', '7IHlux6fIOU', 61, 1793299334,
     'Anglais de B1 à B2 — formation 110 h avec visio individuelle',
     'Découvrez en une minute la formation « Anglais Niveau 2 (B1/B2) » (110 heures) de Switching Formation. Accessible dès le niveau A2.'),
    ('formation-silae-20h-cpf.html', 'SILAE 20 h', 'silae-20h', 'x4IUZcJS0bA', 57, 1793117561,
     'Gestion de la paie avec SILAE — formation 20 h en one-to-one',
     'Découvrez en une minute la formation « Gestion de la paie avec le logiciel SILAE » (20 heures) de Switching Formation.'),
    ('formation-anglais-niveau-2-b1-b2-rs6905.html', 'anglais B1/B2', 'anglais-b1-b2', '7IHlux6fIOU', 61, 1793299334,
     'Anglais de B1 à B2 — formation 110 h avec visio individuelle',
     'Découvrez en une minute la formation « Anglais Niveau 2 (B1/B2) » (110 heures) de Switching Formation. Accessible dès le niveau A2.'),
]

# Page à formules : un seul lecteur, un bouton par durée (heures, identifiant YouTube, horodatage) ; `defaut` = vidéo affichée d'abord.
FORMULES = {
    'page': 'formation-silae-paie-cpf.html', 'nom': 'SILAE', 'prefixe': 'silae', 'defaut': 20, 'duree': 57,
    'titre': 'Gestion de la paie avec SILAE — formation {h} h en one-to-one',
    'description': 'Découvrez en une minute la formation « Gestion de la paie avec le logiciel SILAE » ({h} heures) de Switching Formation.',
    'liste': [(11, 'jv-iSHJ3VgI', 1793117471), (15, 'sU5moYzPJgc', 1793117525), (20, 'x4IUZcJS0bA', 1793117561),
              (25, '55ide23yGFw', 1793117595), (30, 'XGFrKurddlo', 1793117630), (50, 'APS6kSEJQlY', 1793117671),
              (55, 'x7m-8n9D-98', 1793117703)],
}

STUDIO_MARK = '</div></section><section class="st-sec"><div class="w">\n <div class="st-headrow"><div class="st-head"><p class="st-k">En bref</p>'
ARROW = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5"/></svg>'
MUTE = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M11 5 6 9H3v6h3l5 4z"/><path d="M22 9l-6 6M16 9l6 6"/></svg>'
CSS = f'<link rel="stylesheet" href="/video-formation.css?v={V}">'
JS = f'<script src="/video-formation.js?v={V}" defer></script>'


VERSIONS = {'anglais-b1-b2': 2}  # version du fichier R2 (vidéo remplacée le 29/10/2026 : séquence coach IA)


def player(nom, cle):
    return (f'<div class="vf-vid"><video data-src="{MEDIA}/formations/{cle}.mp4?v={VERSIONS.get(cle, 1)}" poster="/images/video-{cle}-poster.webp?v=1" '
            f'preload="none" muted loop playsinline aria-label="Présentation de la formation {nom} en une minute"></video>'
            f'<button class="vf-snd" type="button" aria-label="Activer le son de la vidéo">{MUTE}<span>Son</span></button></div>')


def texte():
    return ('<p class="vf-p">L’essentiel de la formation, résumé en une minute.</p>'
            f'<p class="vf-l"><a class="vf-link" href="{PLAYLIST}" target="_blank" rel="noopener">Toutes nos formations en vidéo sur '
            f'<span class="vf-nw">YouTube&nbsp;{ARROW}</span></a></p>')


def bloc_studio(nom, cle):
    return ('<section class="st-sec st-tint vf-sec"><div class="w"><div class="vf-grid">'
            f'<div class="st-head"><p class="st-k">En vidéo</p><h2>La formation {nom} en une minute</h2>{texte()}</div>'
            f'{player(nom, cle)}</div></div></section>')


def bloc_ancien(nom, cle):
    return ('<section class="who vf-sec"><div class="w"><div class="vf-grid">'
            f'<div class="sec-head"><div class="sec-tag">En vidéo</div><div class="sec-h2">La formation {nom} <span class="glow">en une minute</span></div>{texte()}</div>'
            f'{player(nom, cle)}</div></div></section>')


def bloc_formules(f):
    nom, pre, defaut = f['nom'], f['prefixe'], f['defaut']
    tabs = ''.join(
        '<button class="vf-tab" type="button" aria-pressed="' + ('true' if h == defaut else 'false') + '" '
        f'data-src="{MEDIA}/formations/{pre}-{h}h.mp4?v=1" data-poster="/images/video-{pre}-{h}h-poster.webp?v=1" '
        f'data-label="Présentation de la formule {nom} {h} h en une minute">{h} h</button>' for h, _, _ in f['liste'])
    return ('<section class="st-sec st-tint vf-sec"><div class="w"><div class="vf-grid">'
            f'<div class="st-head"><p class="st-k">En vidéo</p><h2>La formation {nom} en une minute</h2>'
            '<p class="vf-p">Une vidéo par formule : choisissez la durée qui vous intéresse.</p>'
            f'<p class="vf-l"><a class="vf-link" href="{PLAYLIST}" target="_blank" rel="noopener">Toutes nos formations en vidéo sur '
            f'<span class="vf-nw">YouTube&nbsp;{ARROW}</span></a></p></div>'
            f'<div class="vf-media"><div class="vf-tabs" role="group" aria-label="Durée de la formule">{tabs}</div>'
            f'<div class="vf-vid"><video data-src="{MEDIA}/formations/{pre}-{defaut}h.mp4?v=1" poster="/images/video-{pre}-{defaut}h-poster.webp?v=1" '
            f'preload="none" muted loop playsinline aria-label="Présentation de la formule {nom} {defaut} h en une minute"></video>'
            f'<button class="vf-snd" type="button" aria-label="Activer le son de la vidéo">{MUTE}<span>Son</span></button></div></div>'
            '</div></div></section>')


def objet(cle, yt, duree, ts, titre, desc):
    return {
        '@context': 'https://schema.org', '@type': 'VideoObject', 'name': titre, 'description': desc,
        'thumbnailUrl': f'{SITE}/images/video-{cle}-poster.webp',
        'uploadDate': datetime.fromtimestamp(ts, timezone.utc).astimezone(ZoneInfo('Europe/Paris')).isoformat(),
        'duration': f'PT{duree}S', 'contentUrl': f'{MEDIA}/formations/{cle}.mp4',
        'embedUrl': f'https://www.youtube.com/embed/{yt}', 'inLanguage': 'fr',
        'publisher': {'@type': 'Organization', 'name': 'Switching Formation', 'url': SITE + '/'},
    }


def script(d):
    return '<script type="application/ld+json">' + json.dumps(d, ensure_ascii=False) + '</script>'


def donnees(cle, yt, duree, ts, titre, desc):
    return script(objet(cle, yt, duree, ts, titre, desc))


def main():
    for page, nom, cle, yt, duree, ts, titre, desc in VIDEOS:
        p = ROOT / page
        s = p.read_text()
        if 'vf-sec' in s:
            print('déjà fait', page)
            continue
        if s.count(STUDIO_MARK) == 1:
            s = s.replace(STUDIO_MARK, '</div></section>' + bloc_studio(nom, cle) + STUDIO_MARK[len('</div></section>'):])
        else:
            i = s.index('<section class="page-hero">')
            j = s.index('</section>', i) + len('</section>')
            assert s[j:j + 60].lstrip().startswith('<section'), page
            s = s[:j] + '\n' + bloc_ancien(nom, cle) + s[j:]
        assert s.count('</head>') == 1 and s.count('</body>') == 1, page
        s = s.replace('</head>', CSS + '\n' + donnees(cle, yt, duree, ts, titre, desc) + '\n</head>')
        s = s.replace('</body>', JS + '\n</body>')
        p.write_text(s)
        print('ok', page)
    f = FORMULES
    p = ROOT / f['page']
    s = p.read_text()
    if 'vf-sec' in s:
        print('déjà fait', f['page'])
    else:
        assert s.count(STUDIO_MARK) == 1 and s.count('</head>') == 1 and s.count('</body>') == 1, f['page']
        s = s.replace(STUDIO_MARK, '</div></section>' + bloc_formules(f) + STUDIO_MARK[len('</div></section>'):])
        objs = [objet(f"{f['prefixe']}-{h}h", yt, f['duree'], ts, f['titre'].format(h=h), f['description'].format(h=h))
                for h, yt, ts in f['liste']]
        s = s.replace('</head>', CSS + '\n' + script(objs) + '\n</head>')
        s = s.replace('</body>', JS + '\n</body>')
        p.write_text(s)
        print('ok', f['page'])
    # Version des fichiers communs sur toutes les pages qui ont le bloc
    for p in sorted(ROOT.glob('*.html')):
        s = p.read_text()
        if 'vf-sec' not in s:
            continue
        n = re.sub(r'/video-formation\.(css|js)\?v=\d+', lambda m: f'/video-formation.{m.group(1)}?v={V}', s)
        if n != s:
            p.write_text(n)
            print('version', V, p.name)


if __name__ == '__main__':
    main()
