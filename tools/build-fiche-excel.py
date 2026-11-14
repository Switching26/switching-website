#!/usr/bin/env python3
"""Page « Fiche offerte : 20 raccourcis Excel » (cadeau du test Instagram « Commente EXCEL »).

Reprend l'habillage de tests-positionnement.html (en-tête, menu, pied de page communs),
remplace les métadonnées, le fil d'Ariane et le contenu. Relançable : réécrit la page.
Raccourcis relevés sur la page Microsoft « Raccourcis clavier dans Excel » (fr-fr), 14/11/2026.
Fichiers servis : /documents/fiche-20-raccourcis-excel.pdf, /images/fiche-raccourcis-excel.webp.
"""
from pathlib import Path
import html
import json
import re

ROOT = Path(__file__).resolve().parents[1]
SITE = 'https://www.switching-formation.fr'
PAGE = 'fiche-raccourcis-excel.html'
PDF = '/documents/fiche-20-raccourcis-excel.pdf'
IMG = '/images/fiche-raccourcis-excel.webp'
TITLE = '20 raccourcis Excel : la fiche PDF offerte'
DESC = ("Une fiche d'une page à garder près du clavier : 20 raccourcis Excel pour se déplacer, "
        "saisir, calculer et mettre en forme plus vite. Excel en français sur PC Windows, téléchargement direct.")
ARROW = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>'
DL = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 4v11M7 10l5 5 5-5M5 20h14"/></svg>'
esc = html.escape

GROUPS = [
    ('Se déplacer et sélectionner', [
        ('Ctrl+Maj+↓', "Sélectionner jusqu'à la dernière cellule remplie", 'Marche aussi avec → ← ↑'),
        ('Ctrl+Espace', 'Sélectionner toute la colonne', ''),
        ('Maj+Espace', 'Sélectionner toute la ligne', ''),
        ('Ctrl+Origine', 'Revenir tout en haut de la feuille', ''),
        ('Ctrl+Fin', 'Aller à la dernière cellule utilisée', ''),
        ('Ctrl+Pg.Suiv', 'Passer à la feuille suivante', 'Pg.Préc pour la précédente'),
    ]),
    ('Saisir plus vite', [
        ('Ctrl+Entrée', 'Écrire la même valeur dans toutes les cellules sélectionnées', ''),
        ('Alt+Entrée', 'Aller à la ligne dans une même cellule', ''),
        ('Ctrl+;', 'Insérer la date du jour', ''),
        ('Ctrl+E', 'Remplissage instantané', 'Un exemple suffit, Excel complète le reste'),
        ('F2', 'Modifier la cellule sans double-clic', ''),
    ]),
    ('Calculer', [
        ('Alt+=', 'Somme automatique', 'Validez avec Entrée'),
        ('F4', 'Figer une référence dans une formule', 'A1 devient $A$1'),
        ('Ctrl+Alt+V', 'Collage spécial', 'Pour coller seulement les valeurs'),
    ]),
    ('Mettre en forme', [
        ('Ctrl+1', 'Ouvrir le format de cellule', ''),
        ('Ctrl+L', 'Mettre les données sous forme de tableau', 'Ctrl+T sur un Excel en anglais'),
        ('Ctrl+Maj+L', 'Activer ou retirer les filtres', ''),
    ]),
    ('Gagner du temps', [
        ('Alt+F1', 'Créer un graphique en une seconde', 'À partir des données sélectionnées'),
        ('Maj+F11', 'Ajouter une nouvelle feuille', ''),
        ('Ctrl+F', 'Rechercher dans la feuille', ''),
    ]),
]
assert sum(len(g[1]) for g in GROUPS) == 20

CSS = '''<style>
.fx-hero .hub-vis{height:auto;display:flex;justify-content:center}
.fx-hero .hub-vis::before{inset:2% 0 0}
.fx-sheet{position:relative;display:block;width:min(100%,360px);transform:rotate(2deg);border-radius:10px;overflow:hidden;box-shadow:0 2px 4px rgba(15,23,42,.06),0 30px 60px -28px rgba(15,23,42,.45);transition:transform .4s var(--e)}
.fx-sheet:hover{transform:rotate(0) translateY(-3px)}
.fx-sheet img{display:block;width:100%;height:auto}
.fx-cta{display:flex;flex-wrap:wrap;gap:10px;margin-top:24px}
.fx-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:16px}
.fx-card{background:#fff;border:1px solid var(--bd);border-radius:22px;padding:20px 22px 12px}
.fx-card.fx-wide{grid-column:1/-1}
.fx-card h3{font-family:var(--h);font-size:18px;font-weight:600;letter-spacing:-.02em;color:var(--ink);margin-bottom:6px}
.fx-card ol{list-style:none;margin:0;padding:0}
.fx-wide ol{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));column-gap:22px}
.fx-wide .fx-row{grid-template-columns:auto 1fr}
.fx-row{display:grid;grid-template-columns:154px 1fr;gap:14px;align-items:center;padding:11px 0;border-top:1px solid var(--bd)}
.fx-card li:first-child,.fx-wide li{border-top:0}
.fx-wide li+li{border-left:0}
.fx-keys{display:flex;flex-wrap:nowrap;align-items:center;gap:4px}
.fx-keys kbd{font-family:var(--f);font-size:13px;font-weight:700;line-height:1;padding:6px 8px 5px;border-radius:7px;background:linear-gradient(#fff,#F2F4F7);color:var(--ink);box-shadow:0 2px 0 #C9CED6,inset 0 0 0 1px rgba(15,23,42,.07);white-space:nowrap}
.fx-keys i{font-style:normal;font-size:12px;color:var(--faint)}
.fx-d{font-size:15px;color:var(--text);line-height:1.45}
.fx-d small{display:block;font-size:13px;color:var(--sub);margin-top:2px}
.fx-note{font-size:13.5px;color:var(--sub);margin-top:14px}
@media(max-width:1024px){
.fx-hero .hub-vis{display:flex;margin-top:26px}
.fx-sheet{transform:none;width:min(100%,420px)}
.fx-wide ol{grid-template-columns:1fr}
.fx-wide li+li{border-top:1px solid var(--bd)}
}
@media(max-width:600px){
.fx-cta .btn{width:100%}
.fx-grid{grid-template-columns:1fr;gap:10px}
.fx-card{padding:16px 16px 8px;border-radius:18px}
.fx-row{grid-template-columns:128px 1fr;gap:10px;padding:10px 0}
.fx-keys{gap:3px}
.fx-keys i{font-size:11px}
.fx-keys kbd{font-size:11.5px;padding:5px 6px 4px}
.fx-d{font-size:14.5px}
}
</style>'''


def keys(combo):
    parts = combo.split('+') if combo != 'Alt+=' else ['Alt', '=']
    if combo == 'Ctrl+;':
        parts = ['Ctrl', ';']
    return '<i>+</i>'.join(f'<kbd>{esc(p)}</kbd>' for p in parts)


def card(title, rows, wide=False):
    lis = ''.join(
        f'<li class="fx-row"><span class="fx-keys">{keys(k)}</span>'
        f'<span class="fx-d">{esc(d)}{f"<small>{esc(s)}</small>" if s else ""}</span></li>'
        for k, d, s in rows)
    return f'<div class="fx-card{" fx-wide" if wide else ""}"><h3>{esc(title)}</h3><ol>{lis}</ol></div>'


MAIN = (
    '<main id="top">'
    '<section class="hub-hero fx-hero w"><div class="hub-copy">'
    '<span class="eyebrow">Fiche offerte · PDF</span>'
    '<h1>20 raccourcis Excel <br>qui font gagner des heures.</h1>'
    '<p class="lead">Une page à garder à côté de votre clavier : les raccourcis les plus utiles pour se déplacer, '
    'saisir, calculer et mettre en forme plus vite, classés en cinq thèmes.</p>'
    f'<div class="fx-cta"><a class="btn btn-primary" href="{PDF}" download>Télécharger la fiche (PDF){DL}</a>'
    f'<a class="btn btn-ghost" href="/test-excel.html">Faire le test Excel gratuit{ARROW}</a></div>'
    '<ul class="hub-facts"><li><b>1 page</b><span>format A4 à imprimer</span></li>'
    '<li><b>20 raccourcis</b><span>en 5 thèmes</span></li>'
    '<li><b>Sans email</b><span>téléchargement direct</span></li></ul>'
    '<p class="hub-note">Pour Excel en français sur un PC Windows. Sur un portable, certaines touches (Origine, Fin, F1…) '
    "demandent d'appuyer aussi sur Fn.</p></div>"
    f'<div class="hub-vis"><a class="fx-sheet" href="{PDF}" download aria-label="Télécharger la fiche PDF">'
    f'<img src="{IMG}" alt="Aperçu de la fiche : 20 raccourcis Excel classés en cinq thèmes" width="900" height="1273" loading="eager"></a></div>'
    '</section>'
    '<section class="w hub-sec" aria-labelledby="sec-liste"><div class="hub-sec-h"><h2 id="sec-liste">Les 20 raccourcis</h2>'
    '<p>Testez-en un nouveau chaque jour.</p></div>'
    '<div class="fx-grid">'
    + ''.join(card(t, r, wide=(i == len(GROUPS) - 1)) for i, (t, r) in enumerate(GROUPS))
    + '</div><p class="fx-note">Les indispensables restent valables : Ctrl+C copier, Ctrl+V coller, Ctrl+Z annuler, Ctrl+S enregistrer.</p></section>'
    '<section class="hub-help w"><div><h2>Aller plus loin avec Excel</h2>'
    "<p>Notre formation Excel va du niveau débutant à l'avancé : 30 h à distance en e-learning, à votre rythme, "
    'avec la certification ENI RS7536 incluse. Finançable par le CPF, votre Opco ou France Travail.</p></div>'
    f'<a class="btn btn-primary" href="/formation-excel-cpf.html">Découvrir la formation Excel{ARROW}</a></section>'
    '</main>'
)

src = (ROOT / 'tests-positionnement.html').read_text()


def sub1(pattern, value, text):
    out, n = re.subn(pattern, lambda m: value, text, count=1, flags=re.S)
    assert n == 1, pattern
    return out


url = f'{SITE}/{PAGE}'
ld = {'@context': 'https://schema.org', '@type': 'WebPage', 'name': TITLE, 'description': DESC,
      'url': url, 'inLanguage': 'fr',
      'publisher': {'@type': 'Organization', 'name': 'Switching Formation', 'url': SITE}}
page = src
page = sub1(r'<title>.*?</title>', f'<title>{esc(TITLE)} | Switching Formation</title>', page)
page = sub1(r'<meta name="description" content="[^"]*">', f'<meta name="description" content="{esc(DESC, quote=True)}">', page)
page = sub1(r'<link rel="canonical" href="[^"]*">', f'<link rel="canonical" href="{url}">', page)
page = sub1(r'<meta property="og:title" content="[^"]*">', f'<meta property="og:title" content="{esc(TITLE, quote=True)}">', page)
page = sub1(r'<meta property="og:description" content="[^"]*">', f'<meta property="og:description" content="{esc(DESC, quote=True)}">', page)
page = sub1(r'<meta property="og:url" content="[^"]*">', f'<meta property="og:url" content="{url}"><meta property="og:image" content="{SITE}{IMG}">', page)
page = sub1(r'<script type="application/ld\+json">.*?</script>', f'<script type="application/ld+json">{json.dumps(ld, ensure_ascii=False)}</script>', page)
HUB = '<link rel="stylesheet" href="/assets/positioning/hub.css">'
assert page.count(HUB) == 1
page = page.replace(HUB, HUB + CSS)
page = sub1(r'<nav class="bc" aria-label="Fil d\'Ariane">.*?</nav>',
            '<nav class="bc" aria-label="Fil d\'Ariane"><a href="/index.html">Accueil</a><span class="bc-sep" aria-hidden="true">/</span>'
            '<a href="/formation-excel-cpf.html">Formation Excel</a><span class="bc-sep" aria-hidden="true">/</span>'
            '<span class="bc-current" aria-current="page">Fiche raccourcis</span></nav>', page)
page = sub1(r'<main id="top">.*?</main>', MAIN, page)
(ROOT / PAGE).write_text(page)
print('écrit', PAGE, len(page), 'octets')
