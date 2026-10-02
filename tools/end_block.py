#!/usr/bin/env python3
"""Fin de page unique (02/10/2026), idempotent.

Chaque page se termine par le même pied de page sombre, précédé d'un bandeau
d'action dont le texte vient de la page elle-même :
- pages formation (Studio) : la question de la carte de fin (« Quel parcours… ? ») ;
- pages à cadran clair : son titre, son texte et son bouton ;
- articles de blog : la carte « formation liée » (bouton formation + devis) ;
- autres pages : bandeau générique « Parlons de votre formation ».
Pas de bandeau sur Devis et Documentation. Les anciens blocs sont retirés.
Relancer après une modification du pied de page : les bandeaux existants sont gardés.
Lancer : python3 tools/end_block.py
"""
from pathlib import Path
import html as H
import re

ROOT = Path(__file__).resolve().parents[1]
SKIP = {'404.html', 'admin.html', 'google3a68c31226138741.html', 'chatbot-button-futuristic.html',
        'email-templates-formulaire.html'}
NO_BAND = {'inscription.html', 'documentation.html'}
# pages générées par tools/build-positioning.py (pied de page dans tools/positioning/footer.tpl)
GENERATED = {'tests-positionnement.html', 'demonstration-silae.html', 'test-anglais.html', 'test-excel.html',
             'test-excel-vba.html', 'test-outlook.html', 'test-powerpoint.html', 'test-word.html'}

PHONE = ('<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7.2 10.6a14.5 14.5 0 0 0 6.2 6.2l2.1-2.1c.3-.3.7-.4 1-.3 1.1.4 2.3.6 3.5.6.6 0 1 .4 1 1V19c0 .6-.4 1-1 1A16 16 0 0 1 4 4c0-.6.4-1 1-1h3c.6 0 1 .4 1 1 0 1.2.2 2.4.6 3.5.1.4 0 .7-.3 1z"/></svg>')
ARROW = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>'
MAIL = '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="3"/><path d="M4 7.5l8 5.5 8-5.5"/></svg>'
STAR = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3.6l2.5 5.1 5.6.8-4 3.9.9 5.6-5-2.6-5 2.6.9-5.6-4-3.9 5.6-.8z"/></svg>'

FOOT = f'''<div class="eb-foot"><div class="eb-w">
 <div class="eb-brand"><img src="/images/logo-switching-blanc.webp" alt="Switching Formation" width="132" height="34"><p>Organisme de formation certifié Qualiopi · 18 rue Coriolis, 75012 Paris</p></div>
 <div class="eb-cols">
  <div><h4>Formations</h4><a href="/formations.html?cat=langues">Langues</a><a href="/formations.html?cat=bureautique">Bureautique</a><a href="/formations.html?cat=graphisme">Graphisme</a><a href="/formations.html?cat=compta">Compta &amp; Paie</a><a href="/formations.html?cat=ia">Intelligence Artificielle</a><a href="/formations.html">Toutes les formations</a></div>
  <div><h4>Le site</h4><a href="/le-centre.html">Le centre</a><a href="/financement.html">Financement</a><a href="/tests-positionnement.html">Tests gratuits</a><a href="/blog.html">Blog</a><a href="/documentation.html">Documentation</a></div>
  <div><h4>Contact</h4><a class="eb-chip" href="mailto:contact&#64;switchingformation.com">{MAIL}contact&#64;switchingformation.com</a><a class="eb-chip" href="https://g.page/r/CdvHtOBE4CjYEBM/review" target="_blank" rel="noopener">{STAR}Avis Google ★★★★★</a><p class="eb-hours">Du lundi au vendredi, 9 h – 18 h</p></div>
 </div>
 <nav class="eb-mlinks" aria-label="Liens utiles"><a href="/formations.html">Formations</a><a href="/le-centre.html">Le centre</a><a href="/financement.html">Financement</a><a href="/tests-positionnement.html">Tests gratuits</a><a href="/blog.html">Blog</a></nav>
 <div class="eb-legal"><span>© 2026 Switching Formation</span><a href="/cgv.html">CGV</a><a href="/mentions-legales.html">Mentions légales</a><a href="/donnees.html">Données personnelles</a></div>
</div></div>'''


def text(s):
    return ' '.join(H.unescape(re.sub(r'<[^>]+>', ' ', s or '')).split())


def keep_inline(s):
    """Garde b/strong/em, retire le reste (svg, spans décoratifs)."""
    s = re.sub(r'<svg.*?</svg>', '', s or '', flags=re.S)
    s = re.sub(r'<(?!/?(b|strong|em)\b)[^>]+>', '', s)
    return ' '.join(s.split())


def band(kicker, title, sub, primary, secondary=None):
    p = f'<a class="eb-btn eb-p" href="{primary[1]}">{primary[0]} {ARROW}</a>'
    if secondary:
        s = f'<a class="eb-btn eb-g" href="{secondary[1]}">{secondary[0]}</a>'
    else:
        s = (f'<a class="eb-btn eb-call" href="tel:+33695185057"><span class="eb-ph">{PHONE}</span>'
             f'<span><small>Appeler un conseiller</small>06 95 18 50 57</span></a>')
    sub_html = f'<p class="eb-sub">{sub}</p>' if sub else ''
    return (f'<section class="eb-band"><div class="eb-w"><div class="eb-txt"><p class="eb-k"><i></i>{kicker}</p>'
            f'<h2>{title}</h2>{sub_html}</div><div class="eb-act">{p}{s}</div></div></section>')


def block(s, start, tag):
    depth = 0
    for m in re.finditer(r'<(/?)%s\b[^>]*>' % tag, s[start:]):
        depth += 1 if m.group(1) == '' else -1
        if depth == 0:
            return start, start + m.end()
    raise ValueError(tag)


def take(h, opener, tag):
    i = h.find(opener)
    if i < 0:
        return h, None
    a, b = block(h, i, tag)
    return h[:a] + h[b:], h[a:b]


def link(seg, cls):
    m = re.search(r'<a\s[^>]*class="[^"]*\b%s\b[^"]*"[^>]*>(.*?)</a>' % cls, seg, re.S) or \
        re.search(r'<a\s[^>]*>(.*?)</a>', seg, re.S)
    href = re.search(r'href="([^"]+)"', m.group(0)).group(1)
    return (text(m.group(1)), href)


def generic(prefix):
    return band('Un projet de formation ?', 'Parlons de votre formation.',
                'Un conseiller pédagogique vous rappelle sous 24 h pour vérifier le parcours et son financement.',
                ('Demander un devis', prefix + 'inscription.html'))


def build_band(name, h, prefix):
    if name in NO_BAND:
        return h, ''
    h, st = take(h, '<section class="st-cta"', 'section')
    if st:
        h1 = text(re.search(r'<h1[^>]*>(.*?)</h1>', h, re.S).group(1).split('<span')[0]) if '<h1' in h else ''
        kicker = h1 if 0 < len(h1) <= 28 else 'Votre projet de formation'
        p = re.search(r'<p>(.*?)</p>', st, re.S)
        return h, band(kicker, keep_inline(re.search(r'<h2>(.*?)</h2>', st, re.S).group(1)),
                       keep_inline(p.group(1)) if p else '', link(st, 'st-btn-p'))
    h, cad = take(h, '<section class="cta-section', 'section')
    if cad:
        kicker = 'Financement' if name == 'financement.html' else 'Un projet de formation ?'
        if 'projet de' in text(cad).lower()[:80]:
            kicker = 'Parlons-en'
        p = re.search(r'<p[^>]*>(.*?)</p>', cad, re.S)
        return h, band(kicker, keep_inline(re.search(r'<h2[^>]*>(.*?)</h2>', cad, re.S).group(1)),
                       keep_inline(p.group(1)) if p else '', link(cad, 'btn-glow'))
    h, art = take(h, '<div class="article-cta', 'div')
    if art:
        tag = text(re.search(r'class="ac-tag">(.*?)</div>', art, re.S).group(1))
        return h, band(tag, keep_inline(re.search(r'class="ac-t">(.*?)</p>', art, re.S).group(1)),
                       keep_inline(re.search(r'class="ac-s">(.*?)</p>', art, re.S).group(1)),
                       link(art, 'btn-glow'), link(art, 'ac-ghost'))
    return h, generic(prefix)


def install(path):
    name = path.name
    h = path.read_text(encoding='utf-8')
    prefix = '../' if path.parent.name == 'blog' else ''
    if '<footer class="eb">' in h:
        a, b = block(h, h.find('<footer class="eb">'), 'footer')
        old = h[a:b]
        m = re.search(r'<section class="eb-band">.*?</section>', old, re.S)
        bnd = m.group(0) if m else ''
    else:
        h, bnd = build_band(name, h, prefix)
        a, b = block(h, h.find('<footer'), 'footer')
    h = h[:a] + '<footer class="eb">' + bnd + FOOT + '</footer>' + h[b:]
    if '/end-block.css' not in h:
        h = h.replace('</head>', '<link rel="stylesheet" href="/end-block.css">\n</head>', 1)
    path.write_text(h, encoding='utf-8')
    return 'bandeau' if bnd else 'sans bandeau'


if __name__ == '__main__':
    pages = sorted(ROOT.glob('*.html')) + sorted((ROOT / 'blog').glob('*.html'))
    stats = {}
    for p in pages:
        if p.name in SKIP or p.name in GENERATED:
            continue
        if '<footer' not in p.read_text(encoding='utf-8'):
            continue
        r = install(p)
        stats[r] = stats.get(r, 0) + 1
    print(stats)
