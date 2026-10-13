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
    return ''.join(f'<a class="{cls} sfs-{k}" href="{u}" target="_blank" rel="noopener" aria-label="{n}">{ic}</a>'
                   for k, u, ic, n in NETWORKS)


# menu téléphone, sous « téléphone / Documentation »
MENU = ('<!--sfs--><div class="mc-social"><div class="mcs-t"><b>Rejoignez-nous</b><small>Nos shorts chaque semaine'
        f'</small></div><div class="mcs-i">{icons("sfs-b")}</div></div><!--/sfs-->')

# pied de page, colonne Contact
FOOT = f'<div class="eb-soc"><span>Rejoignez-nous</span><div class="ebs-i">{icons("sfs-f")}</div></div>'
