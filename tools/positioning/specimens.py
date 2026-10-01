"""Small decorative specimens (HTML + CSS only) shared by entry blocks, hub and tests.

Each specimen is aria-hidden: it illustrates the trade (a sheet, a page, a slide…),
never a real question, score or software screen. Styles live in assets/positioning/entry.css.
"""

SPECIMENS = {
    'excel': (
        '<div class="sf-spec sf-spec--excel" aria-hidden="true">'
        '<div class="sx-bar"><i>fx</i><span>=SOMME(B2:B4)</span></div>'
        '<div class="sx-grid">'
        '<b></b><b>A</b><b>B</b>'
        '<b>2</b><span>Jan.</span><span>8 240</span>'
        '<b>3</b><span>Fév.</span><span>7 980</span>'
        '<b>4</b><span>Mars</span><span>8 510</span>'
        '<b>5</b><span class="sx-l">Total</span><span class="sx-on">24 730</span>'
        '</div></div>'
    ),
    'word': (
        '<div class="sf-spec sf-spec--word" aria-hidden="true"><div class="sw-page">'
        '<span class="sw-style">Titre 1</span><b class="sw-h"></b>'
        '<i></i><i></i><i class="s"></i>'
        '<span class="sw-break">Saut de page</span>'
        '<b class="sw-h sw-h2"></b><i></i><i class="s"></i>'
        '</div></div>'
    ),
    'powerpoint': (
        '<div class="sf-spec sf-spec--ppt" aria-hidden="true">'
        '<div class="sp-thumbs"><i class="on"></i><i></i><i></i></div>'
        '<div class="sp-slide"><b></b><i></i><i class="s"></i>'
        '<span class="sp-bars"><u style="height:42%"></u><u style="height:66%"></u><u style="height:88%"></u></span>'
        '</div></div>'
    ),
    'outlook': (
        '<div class="sf-spec sf-spec--outlook" aria-hidden="true">'
        '<div class="so-row so-on"><i></i><span><b>Réunion projet</b><em>Jeudi · 10:00</em></span></div>'
        '<div class="so-row"><i></i><span><b>Planning</b><em>À classer</em></span></div>'
        '<div class="so-row"><i></i><span><b>Devis client</b><em>Suivi</em></span></div>'
        '</div>'
    ),
    'excel-vba': (
        '<div class="sf-spec sf-spec--vba" aria-hidden="true">'
        '<span><em>Sub</em> Totaux()</span>'
        '<span class="in"><em>For</em> i = 2 <em>To</em> 10</span>'
        '<span class="in2">Cells(i, 3) = …</span>'
        '<span class="in"><em>Next</em> i</span>'
        '<span><em>End Sub</em></span>'
        '</div>'
    ),
    'anglais': (
        '<div class="sf-spec sf-spec--en" aria-hidden="true">'
        '<span class="se-tag">EN</span>'
        '<span class="se-l">Dear Ms Martin,</span>'
        '<span class="se-l">Thank you for <u>your</u> reply.</span>'
        '<i></i><i class="s"></i>'
        '<span class="se-l se-sign">Kind regards</span>'
        '</div>'
    ),
    'silae': (
        '<div class="sf-spec sf-spec--paie" aria-hidden="true">'
        '<div class="sy-h"><b>Bulletin</b><span>Sept. 2026</span></div>'
        '<div class="sy-r"><span>Absence 17/09</span><em class="q">à qualifier</em></div>'
        '<div class="sy-r"><span>Pièces</span><em class="p">FS · RA · RH</em></div>'
        '<div class="sy-r"><span>Doublon</span><em class="ok">aucun</em></div>'
        '<div class="sy-f">Contrôle avant validation</div>'
        '</div>'
    ),
    'repere': (
        '<div class="sf-spec sf-spec--repere" aria-hidden="true">'
        '<span class="sr-k">Votre repère</span>'
        '<span class="sr-n">6<small>/10</small></span>'
        '<span class="sr-d"><span>Bases</span><i class="ok"></i><i class="ok"></i><i class="ok"></i></span>'
        '<span class="sr-d"><span>Formules</span><i class="ok"></i><i class="ok"></i><i class="ko"></i><i></i></span>'
        '<span class="sr-d"><span>Analyse</span><i class="ok"></i><i class="ko"></i><i></i></span>'
        '</div>'
    ),
}


def spec(kind):
    return SPECIMENS[kind]
