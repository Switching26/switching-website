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
from datetime import datetime, timezone
from pathlib import Path
from zoneinfo import ZoneInfo

ROOT = Path(__file__).resolve().parents[1]
SITE = 'https://www.switching-formation.fr'
MEDIA = 'https://media.switching-formation.fr'
PLAYLIST = 'https://www.youtube.com/playlist?list=PLa1CGCVHY97o'

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
    ('formation-anglais-cpf.html', 'anglais B1/B2', 'anglais-b1-b2', 'K1iseA1yNz8', 49, 1793117776,
     'Anglais de B1 à B2 — formation 110 h avec visio individuelle',
     'Découvrez en une minute la formation « Anglais Niveau 2 (B1/B2) » (110 heures) de Switching Formation. Accessible dès le niveau A2.'),
    ('formation-silae-20h-cpf.html', 'SILAE 20 h', 'silae-20h', 'x4IUZcJS0bA', 57, 1793117561,
     'Gestion de la paie avec SILAE — formation 20 h en one-to-one',
     'Découvrez en une minute la formation « Gestion de la paie avec le logiciel SILAE » (20 heures) de Switching Formation.'),
    ('formation-anglais-niveau-2-b1-b2-rs6905.html', 'anglais B1/B2', 'anglais-b1-b2', 'K1iseA1yNz8', 49, 1793117776,
     'Anglais de B1 à B2 — formation 110 h avec visio individuelle',
     'Découvrez en une minute la formation « Anglais Niveau 2 (B1/B2) » (110 heures) de Switching Formation. Accessible dès le niveau A2.'),
]

STUDIO_MARK = '</div></section><section class="st-sec"><div class="w">\n <div class="st-headrow"><div class="st-head"><p class="st-k">En bref</p>'
ARROW = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5"/></svg>'
MUTE = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M11 5 6 9H3v6h3l5 4z"/><path d="M22 9l-6 6M16 9l6 6"/></svg>'
CSS = '<link rel="stylesheet" href="/video-formation.css?v=1">'
JS = '<script src="/video-formation.js?v=1" defer></script>'


def player(nom, cle):
    return (f'<div class="vf-vid"><video data-src="{MEDIA}/formations/{cle}.mp4?v=1" poster="/images/video-{cle}-poster.webp?v=1" '
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


def donnees(cle, yt, duree, ts, titre, desc):
    d = {
        '@context': 'https://schema.org', '@type': 'VideoObject', 'name': titre, 'description': desc,
        'thumbnailUrl': f'{SITE}/images/video-{cle}-poster.webp',
        'uploadDate': datetime.fromtimestamp(ts, timezone.utc).astimezone(ZoneInfo('Europe/Paris')).isoformat(),
        'duration': f'PT{duree}S', 'contentUrl': f'{MEDIA}/formations/{cle}.mp4',
        'embedUrl': f'https://www.youtube.com/embed/{yt}', 'inLanguage': 'fr',
        'publisher': {'@type': 'Organization', 'name': 'Switching Formation', 'url': SITE + '/'},
    }
    return '<script type="application/ld+json">' + json.dumps(d, ensure_ascii=False) + '</script>'


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


if __name__ == '__main__':
    main()
