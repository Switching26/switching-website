#!/usr/bin/env python3
"""Menu Formations à pastilles couleur (02/10/2026), idempotent.

Remplace le contenu du menu déroulant ordinateur (.nav-dd) et du sous-menu
téléphone (.mc-formations) : « Toutes nos formations » en premier, puis les
sept domaines avec pastille de couleur et nombre de formations.
Compteurs à garder alignés sur les filtres de formations.html.
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

def items(p):
    all_ = (f'<a href="formations.html" class="{p}-all"><span><b>Toutes nos formations</b><small>{TOTAL} formations · 7 domaines</small></span>{ARR}</a>')
    doms = ''.join(f'<a href="formations.html?cat={slug}" class="{p}-d"><span class="mdx-sq" style="background:{c}"><svg viewBox="0 0 24 24" aria-hidden="true">{ICO[k]}</svg></span>{name}<em>{n}</em></a>'
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
    if '/menu-domains.css' not in t:
        t = t.replace('</head>', '<link rel="stylesheet" href="/menu-domains.css">\n</head>', 1)
    p.write_text(t, encoding='utf-8')
    done += 1
    print(f'{p.name}: ordinateur {d} · téléphone {m}')
print(done, 'pages')
