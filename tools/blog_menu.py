#!/usr/bin/env python3
"""Menu téléphone des pages du blog (09/11/2026), idempotent.
Les 48 pages du blog avaient le bouton menu (trois traits) sans menu derrière : il ne faisait rien.
Ce script reprend le menu de financement.html (la référence) et l'ajoute aux pages qui n'en ont pas :
- /menu-mobile.css : les styles du menu, extraits de financement.html (avec leurs @media) ;
- /menu-mobile.js  : ouverture, fermeture et position du menu ;
- le bloc HTML du menu juste après </header>, liens rendus absolus (pages à la racine et dans blog/).
Relancer après un changement du menu de financement.html : python3 tools/blog_menu.py
"""
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
VERSION = '1'  # à augmenter à chaque changement de menu-mobile.css ou menu-mobile.js
REF = ROOT / 'financement.html'
MARK = '<!-- menu-mobile -->'
CSS_LINK = '<link rel="stylesheet" href="/menu-mobile.css?v=%s">' % VERSION
DOM_LINK = '<link rel="stylesheet" href="/menu-domains.css?v=2">'
SCRIPT = '<script src="/menu-mobile.js?v=%s" defer></script>' % VERSION
MENU_SEL = re.compile(r'menu-drop|menu-backdrop|menu-card|\.mc-|\.mcx-|f-open|menu-open')


def bloc_menu(t):
    i = t.index('<div class="menu-backdrop"')
    j = t.index('<div class="menu-drop"', i)
    d = 0
    for m in re.finditer(r'<div\b|</div>', t[j:]):
        d += 1 if m.group(0).startswith('<div') else -1
        if d == 0:
            return t[i:j + m.end()]
    raise SystemExit('menu de référence introuvable')


def absolu(html):
    def f(m):
        attr, url = m.group(1), m.group(2)
        if re.match(r'(https?:|mailto:|tel:|#|/|data:|javascript:)', url):
            return m.group(0)
        return '%s="/%s"' % (attr, url)
    return re.sub(r'\b(href|src)="([^"]*)"', f, html)


def regles(css):
    """Règles du menu, @media compris ; jamais les règles d'affichage du bouton lui-même."""
    out, i, n = [], 0, len(css)
    while i < n:
        a = css.find('{', i)
        if a < 0:
            break
        sel = css[i:a].strip()
        if sel.startswith('@media') or sel.startswith('@supports'):
            d, k = 1, a + 1
            while d and k < n:
                d += {'{': 1, '}': -1}.get(css[k], 0)
                k += 1
            inner = regles(css[a + 1:k - 1])
            if inner:
                out.append('%s{%s}' % (sel, ''.join(inner)))
            i = k
            continue
        b = css.find('}', a)
        body = css[a + 1:b]
        sel = re.sub(r'/\*.*?\*/', '', sel, flags=re.S).strip()
        garde = [s for s in sel.split(',') if MENU_SEL.search(s)]
        if garde and not sel.startswith('@'):
            out.append('%s{%s}' % (','.join(s.strip() for s in garde), body.strip()))
        i = b + 1
    return out


ref = REF.read_text(encoding='utf-8')
bloc = absolu(bloc_menu(ref)).replace('class="mc-link active"', 'class="mc-link"')  # aucune page du blog n'est « Financement »
css = ''.join(re.findall(r'<style[^>]*>(.*?)</style>', ref, re.S))
(ROOT / 'menu-mobile.css').write_text('/* Menu téléphone des pages du blog : repris de financement.html (tools/blog_menu.py). */\n'
                                      + '\n'.join(regles(css)) + '\n', encoding='utf-8')
(ROOT / 'menu-mobile.js').write_text('''/* Menu téléphone des pages du blog : même comportement que financement.html (tools/blog_menu.py). */
function positionMenu(){var nav=document.querySelector('header');var drop=document.getElementById('menuDrop');if(nav&&drop){var r=nav.getBoundingClientRect();drop.style.top=(r.bottom+8)+'px'}}
function toggleMenu(){document.body.classList.toggle('menu-open');if(document.body.classList.contains('menu-open'))positionMenu()}
function closeMenu(){document.body.classList.remove('menu-open');document.body.classList.remove('f-open')}
(function(){
var b=document.querySelector('.menu-toggle'),drop=document.getElementById('menuDrop');if(!b||!drop)return;
b.addEventListener('click',toggleMenu);
var bd=document.querySelector('.menu-backdrop');if(bd)bd.addEventListener('click',closeMenu);
document.querySelectorAll('.mc-nav a[href], .mc-bottom a[href]').forEach(function(a){a.addEventListener('click',closeMenu)});
window.addEventListener('scroll',function(){if(document.body.classList.contains('menu-open'))positionMenu()},{passive:true});
document.addEventListener('keydown',function(e){if(e.key==='Escape')closeMenu()});
})();
''', encoding='utf-8')

pages = sorted(ROOT.glob('blog*.html')) + sorted((ROOT / 'blog').glob('*.html'))
n = 0
for p in pages:
    h = p.read_text(encoding='utf-8')
    if 'class="menu-toggle"' not in h or ('id="menuDrop"' in h and MARK not in h):
        continue
    avant = h
    if MARK in h:
        h = re.sub(re.escape(MARK) + r'.*?' + re.escape(MARK + '/'), '', h, flags=re.S)
    assert h.count('</header>') == 1, p
    h = h.replace('</header>', '</header>' + MARK + bloc + MARK + '/', 1)
    h = re.sub(r'/menu-mobile\.(css|js)\?v=\d+', lambda m: '/menu-mobile.%s?v=%s' % (m.group(1), VERSION), h)
    if '/menu-domains.css' not in h:
        h = h.replace('</head>', DOM_LINK + '\n</head>', 1)
    if CSS_LINK not in h:
        h = h.replace('</head>', CSS_LINK + '\n</head>', 1)
    if SCRIPT not in h:
        assert h.count('</body>') == 1, p
        h = h.replace('</body>', SCRIPT + '\n</body>', 1)
    if h != avant:
        p.write_text(h, encoding='utf-8')
        n += 1
print('pages du blog complétées :', n, 'sur', len(pages))
