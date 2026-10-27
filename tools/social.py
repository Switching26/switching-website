#!/usr/bin/env python3
"""Réseaux sociaux + section Shorts (13/10/2026), idempotent.

- Menu téléphone : bloc « Rejoignez-nous » (Instagram, LinkedIn, YouTube) sous téléphone / Documentation,
  sur toutes les pages qui ont le menu (.mc-bottom). Styles dans /nav-glass.css.
- Accueil : section « Nos derniers Shorts » entre Témoignages et la fin de page, styles /shorts.css,
  script /shorts.js, vidéos sur Cloudflare R2 (MEDIA/shorts/, 720x1280, son AAC, faststart) + affiche .webp dans images/shorts/.
Le pied de page (colonne Contact) est géré par tools/end_block.py. Liens : tools/social_links.py.
Pour changer les vidéos : modifier SHORTS, envoyer <slug>.mp4 dans le bucket R2 (clé shorts/<slug>.mp4), déposer images/shorts/<slug>.webp, relancer.
Lancer : python3 tools/social.py
"""
from pathlib import Path
import re
from social_links import MENU, NETWORKS, YT, YT_URL, icons

ROOT = Path(__file__).resolve().parents[1]
# Vidéos hébergées sur Cloudflare R2 (bucket switching-site-videos), plus dans le dépôt (27/10/2026)
MEDIA = 'https://media.switching-formation.fr'

# (fichier, titre, domaine, couleur du domaine, durée en s)
SHORTS = [
    ('anglais-erreurs', '5 erreurs que font tous les Français en anglais', 'Langues', '#3B82F6', 58),
    ('excel-quiz', 'Quiz Excel : à toi de jouer', 'Bureautique', '#10B981', 16),
    ('photoshop-ia', 'Photoshop et l’IA', 'Graphisme', '#F59E0B', 21),
    ('cpf-explique', 'Le CPF en 45 secondes', 'Financement', '#64748B', 48),
    ('paie', 'Te lancer dans la paie ?', 'Compta &amp; Paie', '#FB923C', 20),
    ('ia-prompt', 'L’IA, pas un moteur de recherche', 'Intelligence Artificielle', '#6366F1', 23),
    ('bilan', 'Changer de métier, sans savoir lequel ?', 'Bilan de compétences', '#F43F5E', 29),
]

VOL = ('<button class="sh-vol{x}" type="button" aria-label="Activer le son"><svg class="v-off" viewBox="0 0 24 24">'
       '<path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z"/><path d="M16 9.5l5 5M21 9.5l-5 5"/></svg><svg class="v-on" '
       'viewBox="0 0 24 24"><path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z"/><path d="M15.5 9a4.2 4.2 0 0 1 0 6M18.2 '
       '6.5a7.8 7.8 0 0 1 0 11"/></svg></button>')


def card(i, s):
    slug, title, dom, col, dur = s
    return (f'<article class="sh-card" data-i="{i}" style="--c:{col}">'
            f'<video muted loop playsinline preload="none" poster="images/shorts/{slug}.webp" '
            f'data-src="{MEDIA}/shorts/{slug}.mp4"></video>'
            f'<span class="sh-dom"><i></i>{dom}</span>{VOL.format(x="")}'
            f'<div class="sh-cap"><b>{title}</b><small><svg viewBox="0 0 24 24"><path d="M8 5.5v13l10.5-6.5z"/></svg>'
            f'{dur // 60}:{dur % 60:02d}</small></div><span class="sh-prog"><i></i></span></article>')


PILLS = ''.join(f'<a class="sh-pill sfs-{k}" href="{u}" target="_blank" rel="noopener">{ic}<span>{n}</span></a>'
                for k, u, ic, n in NETWORKS)

SECTION = f'''<!-- shorts-v1 --><section class="shorts" id="shorts"><div class="w">
<div class="sh-head rv"><div class="sec-tag">Sur nos réseaux</div><div class="sec-h2">Nos derniers <span class="glow">Shorts</span></div>
<p class="sh-sub">Une astuce, un quiz, un conseil financement : chaque semaine en moins d’une minute.</p>
<div class="sh-follow">{PILLS}</div></div>
</div>
<div class="sh-rail-w"><button class="sh-nav sh-prev" type="button" aria-label="Précédent"><svg viewBox="0 0 24 24"><path d="M15 6l-6 6 6 6"/></svg></button>
<div class="sh-rail">{"".join(card(i, s) for i, s in enumerate(SHORTS))}<a class="sh-more" href="{YT_URL}" target="_blank" rel="noopener"><span>{YT}</span><b>Toutes nos vidéos</b><small>sur YouTube</small></a></div>
<button class="sh-nav sh-next" type="button" aria-label="Suivant"><svg viewBox="0 0 24 24"><path d="M9 6l6 6-6 6"/></svg></button></div>
</section>
<div class="sh-viewer" aria-hidden="true"><div class="shv-bg"></div>
<div class="shv-stage"><video playsinline loop preload="none"></video><span class="shv-prog"><i></i></span>
<div class="shv-top"><span class="sh-dom"><i></i><em></em></span><button class="shv-x" type="button" aria-label="Fermer"><svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18"/></svg></button></div>
{VOL.format(x=" shv-vol")}
<div class="shv-cap"><b></b><div class="shv-links">{icons("sfs-v")}</div></div>
<button class="shv-nav shv-p" type="button" aria-label="Précédent"><svg viewBox="0 0 24 24"><path d="M6 15l6-6 6 6"/></svg></button><button class="shv-nav shv-n" type="button" aria-label="Suivant"><svg viewBox="0 0 24 24"><path d="M6 9l6 6 6-6"/></svg></button>
</div></div><!-- /shorts-v1 -->
'''


def menu(h):
    h = re.sub(r'<!--sfs-->.*?<!--/sfs-->', '', h, flags=re.S)
    m = re.search(r'<div class="mc-bottom">.*?</div>', h, re.S)
    if not m:
        return h, False
    return h[:m.end()] + MENU + h[m.end():], True


def home(h):
    h = re.sub(r'<!-- shorts-v1 -->.*?<!-- /shorts-v1 -->\n?', '', h, flags=re.S)
    assert h.count('<footer class="eb">') == 1
    h = h.replace('<footer class="eb">', SECTION + '<footer class="eb">', 1)
    if '/shorts.css' not in h:
        h = h.replace('</head>', '<link rel="stylesheet" href="/shorts.css">\n</head>', 1)
    if '/shorts.js' not in h:
        h = h.replace('</body>', '<script src="/shorts.js" defer></script>\n</body>', 1)
    return h


if __name__ == '__main__':
    n = 0
    for p in sorted(ROOT.glob('*.html')) + sorted((ROOT / 'blog').glob('*.html')):
        h = p.read_text(encoding='utf-8')
        h2, ok = menu(h)
        if p.name == 'index.html':
            h2 = home(h2)
        if h2 != h:
            p.write_text(h2, encoding='utf-8')
        n += ok
    print('menus :', n)
