"""Liens réseaux sociaux du site (13/10/2026) : source unique pour le menu, le pied de page et la section Shorts.

Utilisé par tools/end_block.py (pied de page) et tools/social.py (menu téléphone + section Shorts de l'accueil).
"""

IG_URL = 'https://www.instagram.com/switching_formation/'
LI_URL = 'https://www.linkedin.com/company/68219852/'
YT_URL = 'https://www.youtube.com/@SwitchingFormation'

IG = ('<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="5.2" fill="none" '
      'stroke="currentColor" stroke-width="1.9"/><circle cx="12" cy="12" r="4.1" fill="none" stroke="currentColor" '
      'stroke-width="1.9"/><circle cx="17.4" cy="6.6" r="1.25" fill="currentColor"/></svg>')
LI = ('<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M5.2 8.6h3v10.2h-3zM6.7 4a1.75 1.75 0 1 1 '
      '0 3.5 1.75 1.75 0 0 1 0-3.5zM10.4 8.6h2.9v1.4h.04c.4-.76 1.38-1.56 2.85-1.56 3.05 0 3.6 2 3.6 4.6v5.76h-3v-5.1c0-1.22'
      '-.02-2.78-1.7-2.78-1.7 0-1.95 1.32-1.95 2.7v5.18h-3z"/></svg>')
YT = ('<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M21.6 7.2a2.5 2.5 0 0 0-1.76-1.77C18.29 5 '
      '12 5 12 5s-6.29 0-7.84.43A2.5 2.5 0 0 0 2.4 7.2 26 26 0 0 0 2 12a26 26 0 0 0 .4 4.8 2.5 2.5 0 0 0 1.76 1.77C5.71 19 '
      '12 19 12 19s6.29 0 7.84-.43a2.5 2.5 0 0 0 1.76-1.77A26 26 0 0 0 22 12a26 26 0 0 0-.4-4.8zM10 15V9l5.2 3z"/></svg>')

NETWORKS = [('ig', IG_URL, IG, 'Instagram'), ('li', LI_URL, LI, 'LinkedIn'), ('yt', YT_URL, YT, 'YouTube')]


def icons(cls):
    """Glyphes pleins (visionneuse des Shorts)."""
    return ''.join(f'<a class="{cls} sfs-{k}" href="{u}" target="_blank" rel="noopener" aria-label="{n}">{ic}</a>'
                   for k, u, ic, n in NETWORKS)


# Logos « trait dessiné » (choix Samuel 14/10/2026) : contour seul, trait en dégradé de la marque,
# qui se dessine à l'ouverture du menu et à l'arrivée sur le pied de page. Dégradés propres à chaque
# instance (suffixe = classe) : chaque logo garde ses couleurs même si un autre bloc est masqué.
def drawn(net, sfx):
    g = {'ig': f'<linearGradient id="sflIg{sfx}" x1="0" y1="1" x2="1" y2="0"><stop offset="0" stop-color="#FFB13D"/>'
               f'<stop offset=".45" stop-color="#F0306E"/><stop offset="1" stop-color="#7A3FE0"/></linearGradient>',
         'li': f'<linearGradient id="sflLi{sfx}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3D9BF0"/>'
               f'<stop offset="1" stop-color="#0A5CB0"/></linearGradient>',
         'yt': f'<linearGradient id="sflYt{sfx}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FF5A72"/>'
               f'<stop offset="1" stop-color="#E0002B"/></linearGradient>'}[net]
    s = 'url(#sfl%s%s)' % ({'ig': 'Ig', 'li': 'Li', 'yt': 'Yt'}[net], sfx)
    if net == 'ig':
        body = (f'<rect class="dr" pathLength="1" x="7" y="7" width="34" height="34" rx="10.5" fill="none" stroke="{s}" stroke-width="2.4"/>'
                f'<circle class="dr" pathLength="1" cx="24" cy="24" r="7.6" fill="none" stroke="{s}" stroke-width="2.4"/>'
                f'<circle class="pop" cx="33.4" cy="14.6" r="1.9" fill="{s}"/>')
    elif net == 'li':
        body = (f'<rect class="dr" pathLength="1" x="7" y="7" width="34" height="34" rx="8.5" fill="none" stroke="{s}" stroke-width="2.4"/>'
                f'<circle class="pop" cx="16.6" cy="15.4" r="2.2" fill="{s}"/>'
                f'<path class="dr" pathLength="1" d="M16.6 20.6v12.2" fill="none" stroke="{s}" stroke-width="2.8" stroke-linecap="round"/>'
                f'<path class="dr" pathLength="1" d="M23.4 32.8V21.6m0 4.6c0-2.9 2-4.9 4.7-4.9s4.4 1.8 4.4 5.1v6.4" fill="none" '
                f'stroke="{s}" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"/>')
    else:
        body = (f'<rect class="dr" pathLength="1" x="5" y="11.5" width="38" height="25" rx="8.5" fill="none" stroke="{s}" stroke-width="2.4"/>'
                f'<path class="dr" pathLength="1" d="M21 19.2v9.6l8.4-4.8z" fill="none" stroke="{s}" stroke-width="2.4" stroke-linejoin="round"/>')
    return f'<svg viewBox="0 0 48 48" class="sfl" aria-hidden="true"><defs>{g}</defs>{body}</svg>'


def drawn_icons(cls, sfx):
    return ''.join(f'<a class="{cls} sfs-{k}" href="{u}" target="_blank" rel="noopener" aria-label="{n}" style="--i:{i}">{drawn(k, sfx)}</a>'
                   for i, (k, u, ic, n) in enumerate(NETWORKS))


# menu téléphone, sous « téléphone / Documentation »
MENU = ('<!--sfs--><div class="mc-social"><div class="mcs-t"><b>Rejoignez-nous</b><small>Nos shorts chaque semaine'
        f'</small></div><div class="mcs-i">{drawn_icons("sfs-b", "M")}</div></div><!--/sfs-->')

# pied de page, colonne Contact
FOOT = f'<div class="eb-soc"><span>Rejoignez-nous</span><div class="ebs-i">{drawn_icons("sfs-f", "F")}</div></div>'
