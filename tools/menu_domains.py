#!/usr/bin/env python3
"""Menu Formations, idempotent (02/10/2026, refait le 28/10/2026).

Ordinateur (.nav-dd) : panneau clair en 2 colonnes, une pastille de couleur,
le nom, une ligne d'explication et le nombre de formations par domaine, puis
« Toutes nos formations » en dernière case (plus de bloc noir ni de carrés).
Téléphone (.mc-formations) : « Toutes nos formations » en ligne claire, puis
les sept domaines avec une petite pastille.
Compteurs à garder alignés sur les filtres de formations.html.
Styles : /menu-domains.css (version VERSION ci-dessous, reportée sur les pages).
Lancer : python3 tools/menu_domains.py
"""
from pathlib import Path
import re

ROOT = Path(__file__).resolve().parents[1]
ICO = {
 'lang': '<path d="M4 5h9M8.5 3v2M6 5c.6 3.3 2.6 6 6 7.5M11 5c-.8 3.6-3 6.4-7 8"/><path d="M13.5 21l3.5-9 3.5 9M14.8 18h4.4"/>',
 'bur': '<rect x="3.5" y="4.5" width="17" height="15" rx="2"/><path d="M3.5 9.5h17M9 9.5v10"/>',
 'gra': '<path d="M12 19l7-7 3 3-7 7-3-3z"/><path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"/><path d="M2 2l7.6 7.6"/><circle cx="11" cy="11" r="2"/>',
 'web': '<path d="M8.5 8L4.5 12l4 4M15.5 8l4 4-4 4M13.5 5.5l-3 13"/>',
 'cpt': '<path d="M17 6.5A7 7 0 1 0 17 17.5"/><path d="M4 10.5h9M4 13.5h9"/>',
 'ia': '<path d="M12 3.5l1.8 4.9 4.9 1.8-4.9 1.8L12 16.9l-1.8-4.9-4.9-1.8 4.9-1.8z"/><path d="M18.5 15.5l.8 2.2 2.2.8-2.2.8-.8 2.2-.8-2.2-2.2-.8 2.2-.8z"/>',
 'bdc': '<circle cx="12" cy="12" r="8.5"/><path d="M15.5 8.5l-2 5-5 2 2-5z"/>',
}
DOMS = [('langues', 'Langues', 'lang', '#3B82F6', 8), ('bureautique', 'Bureautique', 'bur', '#10B981', 10),
        ('graphisme', 'Graphisme', 'gra', '#F59E0B', 13), ('web', 'Web &amp; Digital', 'web', '#A855F7', 9),
        ('compta', 'Compta &amp; Paie', 'cpt', '#FB923C', 7), ('ia', 'Intelligence Artificielle', 'ia', '#6366F1', 9),
        ('bdc', 'Bilan de compétences', 'bdc', '#F43F5E', 2)]
TOTAL = 58
ARR = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>'

VERSION = 2
DESC = {'langues': 'Anglais, français · A1 → C2', 'bureautique': 'Excel, Word, PowerPoint…',
        'graphisme': 'Photoshop, Illustrator, Canva…', 'web': 'Développement, CMS, marketing…',
        'compta': 'SILAE, Ciel Paie, Segid…', 'ia': 'Rédiger, analyser, créer', 'bdc': 'Accompagnement carrière'}
DOTS = ''.join(f'<i style="background:{c}"></i>' for _, _, _, c, _ in DOMS)


def items(p):
    if p == 'mdx':  # ordinateur
        doms = ''.join(f'<a href="formations.html?cat={slug}" class="mdx-d" style="--c:{c}"><i></i>'
                       f'<span class="mdx-t"><b>{name}</b><small>{DESC[slug]}</small></span><em>{n}</em></a>'
                       for slug, name, k, c, n in DOMS)
        all_ = (f'<a href="formations.html" class="mdx-all"><span class="mdx-t"><b>Toutes nos formations</b>'
                f'<small>{TOTAL} formations · 7 domaines</small><span class="mdx-dots">{DOTS}</span></span>{ARR}</a>')
        return f'<div class="mdx-top">Nos domaines</div><div class="mdx-g">{doms}{all_}</div>'
    all_ = (f'<a href="formations.html" class="{p}-all"><span><b>Toutes nos formations</b><small>{TOTAL} formations · 7 domaines</small></span>{ARR}</a>')
    doms = ''.join(f'<a href="formations.html?cat={slug}" class="{p}-d"><i class="mcx-dot" style="background:{c}"></i>{name}<em>{n}</em></a>'
                   for slug, name, k, c, n in DOMS)
    return all_ + doms

def block(s, start):
    depth = 0
    for m in re.finditer(r'<(/?)div\b[^>]*>', s[start:]):
        depth += 1 if m.group(1) == '' else -1
        if depth == 0:
            return start, start + m.end()
    raise ValueError('bloc non fermé')

def swap(text, opener, prefix):
    i = text.find(opener)
    if i < 0:
        return text, 0
    a, b = block(text, i)
    return text[:a] + opener + items(prefix) + '</div>' + text[b:], 1

pages = sorted(p for p in ROOT.glob('*.html') if 'class="nav-dd"' in p.read_text(encoding='utf-8'))
done = 0
for p in pages:
    t = p.read_text(encoding='utf-8')
    t, d = swap(t, '<div class="nav-dd">', 'mdx')
    t, m = swap(t, '<div class="mc-formations">', 'mcx')
    t = re.sub(r'/menu-domains\.css(\?v=\d+)?"', f'/menu-domains.css?v={VERSION}"', t)
    if '/menu-domains.css' not in t:
        t = t.replace('</head>', f'<link rel="stylesheet" href="/menu-domains.css?v={VERSION}">\n</head>', 1)
    p.write_text(t, encoding='utf-8')
    done += 1
    print(f'{p.name}: ordinateur {d} · téléphone {m}')
print(done, 'pages')
