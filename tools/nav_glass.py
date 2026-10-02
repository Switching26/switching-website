#!/usr/bin/env python3
"""Barre du haut en verre liquide (02/10/2026), idempotent.
Ajoute /nav-glass.css et /nav-glass.js à toutes les pages qui ont <header id="hd">.
Les pages de tests sont générées par tools/build-positioning.py (feuille ajoutée dans
son en-tête, script dans tools/positioning/header.tpl) : elles ne sont pas touchées ici.
Lancer : python3 tools/nav_glass.py
"""
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
GENERATED = {'tests-positionnement.html', 'demonstration-silae.html', 'test-anglais.html', 'test-excel.html',
             'test-excel-vba.html', 'test-outlook.html', 'test-powerpoint.html', 'test-word.html'}
LINK = '<link rel="stylesheet" href="/nav-glass.css?v=1">'
SCRIPT = '<script src="/nav-glass.js?v=1" defer></script>'

n = 0
for p in sorted(ROOT.glob('*.html')) + sorted((ROOT / 'blog').glob('*.html')):
    if p.name in GENERATED:
        continue
    h = p.read_text(encoding='utf-8')
    if '<header id="hd"' not in h:
        continue
    before = h
    if LINK not in h:
        assert h.count('</head>') == 1, p
        h = h.replace('</head>', LINK + '\n</head>', 1)
    if SCRIPT not in h:
        assert h.count('</body>') == 1, p
        h = h.replace('</body>', SCRIPT + '\n</body>', 1)
    if h != before:
        p.write_text(h, encoding='utf-8')
        n += 1
print('pages modifiées :', n)
