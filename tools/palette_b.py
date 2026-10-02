#!/usr/bin/env python3
"""Palette « turquoise rare » (validée par Samuel le 02/10/2026), idempotent.

Le turquoise ne reste que sur les boutons d'action. Partout ailleurs, chaque couleur
turquoise (teinte 172–192°, saturation > 25 %) est remplacée par l'encre ou un gris ardoise
de même clarté et de même transparence ; dans un texte en dégradé, par l'encre/ardoise.
⚠️ Ne pas élargir la plage de teinte : le vert Bureautique #10B981 (160°) y tomberait.

Fichiers traités : feuilles CSS du site et blocs <style>, attributs style/fill/stroke des pages.
Les scripts (.js) ne sont pas touchés.
Lancer : python3 tools/palette_b.py        (ajouter --dry pour seulement compter)
"""
import math
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SKIP = {'admin.html', 'google3a68c31226138741.html', 'email-templates-formulaire.html', 'chatbot-button-futuristic.html'}

# Sélecteurs des boutons d'action : le turquoise y est conservé.
CTA = re.compile(r'btn-glow|btn-p\b|\.btn\.p\b|\ba\.p\b|nav-cta|cta-btn\.primary|qb-cta|btn-next|btn-send|login-btn|\.eb-p\b|mc-doc|hx-btn-p|ct-btn-p|st-btn-p')
VARS = {'--accent2': '#0E9599', '--accent-gl2': 'rgba(16,171,175,.06)', '--accent-gl': 'rgba(16,171,175,.12)',
        '--accent-ink': '#0E7C7E', '--accent': '#10ABAF'}


def _hsl(r, g, b):
    r, g, b = r / 255, g / 255, b / 255
    M, m = max(r, g, b), min(r, g, b)
    l = (M + m) / 2
    h = s = 0.0
    d = M - m
    if d:
        s = d / (2 - M - m) if l > .5 else d / (M + m)
        if M == r:
            h = (g - b) / d + (6 if g < b else 0)
        elif M == g:
            h = (b - r) / d + 2
        else:
            h = (r - g) / d + 4
        h *= 60
    return h, s, l


def _rgb(h, s, l):
    def f(n):
        k = (n + h / 30) % 12
        a = s * min(l, 1 - l)
        return math.floor(255 * (l - a * max(-1, min(k - 3, min(9 - k, 1)))) + .5)
    return [f(0), f(8), f(4)]


def _teal(r, g, b):
    h, s, l = _hsl(r, g, b)
    return 172 <= h <= 192 and s > .25 and .08 < l < .97


def _map(r, g, b, clip):
    h, s, l = _hsl(r, g, b)
    if clip:
        return [15, 23, 42] if l < .45 else ([71, 85, 105] if l < .6 else [203, 213, 225])
    if l < .45:
        return _rgb(217, .33, max(.11, l * .5))
    if l < .75:
        return _rgb(215, .2, min(.85, l + .05))
    return _rgb(214, .3, l)


HEX = re.compile(r'#([0-9a-fA-F]{6}|[0-9a-fA-F]{3})\b')
RGB = re.compile(r'rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(,\s*[\d.]+\s*)?\)')


def recolor_value(v, clip=False):
    def hx(m):
        x = m.group(1)
        if len(x) == 3:
            x = ''.join(c * 2 for c in x)
        r, g, b = int(x[:2], 16), int(x[2:4], 16), int(x[4:], 16)
        return '#' + ''.join('%02X' % c for c in _map(r, g, b, clip)) if _teal(r, g, b) else m.group(0)

    def rg(m):
        r, g, b = int(m.group(1)), int(m.group(2)), int(m.group(3))
        if not _teal(r, g, b):
            return m.group(0)
        o = ','.join(str(c) for c in _map(r, g, b, clip))
        return f'rgba({o}{m.group(4)})' if m.group(4) else f'rgb({o})'
    return RGB.sub(rg, HEX.sub(hx, v))


def recolor_css(t):
    def rule(m):
        sel, decl = m.group(1), m.group(2)
        if CTA.search(sel):
            return sel + '{' + re.sub(r'var\((--accent[\w-]*)\)', lambda a: VARS.get(a.group(1), a.group(0)), decl) + '}'
        clip = bool(re.search(r'background-clip\s*:\s*text|-webkit-text-fill-color\s*:\s*transparent', decl))
        return sel + '{' + recolor_value(decl, clip) + '}'
    return re.sub(r'([^{}]+)\{([^{}]*)\}', rule, t)


def recolor_html(h):
    h = re.sub(r'(<style[^>]*>)([\s\S]*?)(</style>)', lambda m: m.group(1) + recolor_css(m.group(2)) + m.group(3), h)
    return re.sub(r'\s(style|fill|stroke|stop-color|color)="([^"]*)"', lambda m: f' {m.group(1)}="{recolor_value(m.group(2))}"', h)


def files():
    for p in sorted(ROOT.glob('*.css')) + sorted((ROOT / 'assets' / 'positioning').glob('*.css')):
        yield p, recolor_css
    for p in sorted(ROOT.glob('*.html')) + sorted((ROOT / 'blog').glob('*.html')):
        if p.name not in SKIP:
            yield p, recolor_html


if __name__ == '__main__':
    dry = '--dry' in sys.argv
    changed = 0
    for p, fn in files():
        old = p.read_text(encoding='utf-8')
        new = fn(old)
        if new != old:
            changed += 1
            if not dry:
                p.write_text(new, encoding='utf-8')
    print(('à modifier' if dry else 'fichiers modifiés') + ' :', changed)
