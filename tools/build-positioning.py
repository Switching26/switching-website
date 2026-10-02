#!/usr/bin/env python3
"""Build the public self-assessments. Sources are local; no API or dependency."""
from pathlib import Path
import html
import json
import re
from collections import Counter
import sys

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / 'tools/positioning'
SITE = 'https://www.switching-formation.fr'
TESTS = json.loads((SRC / 'tests.json').read_text())
sys.path.insert(0, str(SRC))
from specimens import spec  # noqa: E402
ARROW = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>'
esc = html.escape

def head(title, description, filename, extra=''):
    canonical = SITE + '/' + filename
    data = {'@context':'https://schema.org', '@type':'WebPage', 'name':title,
            'description':description, 'url':canonical, 'inLanguage':'fr',
            'publisher':{'@type':'Organization','name':'Switching Formation','url':SITE}}
    return f'''<!doctype html>
<html lang="fr"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>{esc(title)} | Switching Formation</title>
<meta name="description" content="{esc(description, quote=True)}">
<link rel="canonical" href="{canonical}">
<meta property="og:type" content="website"><meta property="og:title" content="{esc(title, quote=True)}">
<meta property="og:description" content="{esc(description, quote=True)}"><meta property="og:url" content="{canonical}">
<meta name="theme-color" content="#FAFBFC"><link rel="icon" href="/images/fav-sf-web.PNG">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Almarai:wght@300;400;700;800&amp;family=Poppins:wght@500;600;700&amp;display=swap" rel="stylesheet">
<link rel="stylesheet" href="/assets/positioning/base.css"><link rel="stylesheet" href="/assets/positioning/entry.css"><link rel="stylesheet" href="/end-block.css"><link rel="stylesheet" href="/nav-glass.css?v=1">{extra}
<script type="application/ld+json">{json.dumps(data, ensure_ascii=False)}</script>
</head><body>'''

def header(crumb):
    return (SRC / 'header.tpl').read_text().replace('{{CRUMB}}', esc(crumb))

def footer():
    return (SRC / 'footer.tpl').read_text() + '<script src="/assets/positioning/shell.js" defer></script>'

def replace_once(pattern, value, text):
    result, n = re.subn(pattern, lambda m: value, text, count=1, flags=re.S)
    assert n == 1, pattern
    return result

for config in TESTS:
    name, slug = config['name'], config['slug']
    questions = config['questions']
    count = len(questions)
    assert 6 <= count <= 10
    assert len({q['id'] for q in questions}) == count
    for q in questions:
        assert q['domain'] in config['domains'] and q['explanation']
        if q['type'] == 'choice':
            assert len(set(q['options'])) == len(q['options'])
            assert 0 <= q['answer'] < len(q['options'])
    body = (SRC / 'quiz-body.tpl').read_text()
    body = body.replace('__SITE__/', '/').replace(' data-preview="1"', '')
    body = body.replace('Test Excel', 'Test ' + esc(name)).replace('Votre repère Excel', 'Votre repère ' + esc(name))
    body = replace_once(r'<p class="lead">.*?</p>', '<p class="lead">'+esc(config['intro'])+'</p>', body)
    body = body.replace('10 questions', str(count)+' questions').replace('5 à 8 min', config['minutes']+' min')
    body = body.replace('Un score sur 10', 'Un score sur '+str(count)).replace('Question 1 sur 10', 'Question 1 sur '+str(count)).replace('/10</small>', '/'+str(count)+'</small>')
    body = body.replace('Trois domaines, dix situations', 'Trois domaines, '+str(count)+' situations')
    counters = Counter(q['domain'] for q in questions)
    rows = ''.join(f'<li><span class="map-n">{counters[d]}<small>questions</small></span><div><b>{esc(d)}</b><span>{esc(text)}</span></div></li>' for d,text in config['domains'].items())
    body = replace_once(r'<ol>.*?</ol>', '<ol>'+rows+'</ol>', body)
    body = replace_once(r'<p class="map-foot">.*?</p>', '<p class="map-foot">'+esc(config['scope'])+'</p>', body)
    body = body.replace('<h3>Rien n\'est enregistré</h3>', '<h3>Vos réponses restent ici</h3>')
    body = body.replace('Ni compte ni formulaire. Vos réponses restent dans cette page et disparaissent quand vous la fermez.', "Aucun compte ni email requis. Vos réponses restent dans cette page ; elles sont effacées si vous l'actualisez ou la fermez.")
    goals = ''.join(f'<label class="goal"><input type="radio" name="goal" value="{esc(g, quote=True)}"><span class="dot"></span>{esc(g)}</label>' for g in config['goals'])
    body = replace_once(r'<div class="goals" id="goals">.*?</div>', '<div class="goals" id="goals">'+goals+'</div>', body)
    body = re.sub(r'<p class="preview-flag".*?</p>', '', body, flags=re.S)
    body = body.replace('/formation-excel-cpf.html', '/'+config['offer'])
    body = body.replace('notre formation Excel', 'nos formations associées')
    body = body.replace('Découvrir la formation Excel', esc(config.get('offerLabel', 'Découvrir la formation '+name)))
    # Show the start control only after the interactive engine has initialised.
    body = body.replace('class="q-dom" id="q-domain">Bases', 'class="q-dom" id="q-domain">'+esc(next(iter(config['domains']))))
    fallback = '<p class="note" id="engine-fallback">Le test nécessite JavaScript. S’il ne se charge pas, <a href="/'+config['offer']+'">consultez les formations associées</a> ou <a href="/inscription.html">contactez un conseiller</a>.</p>'
    body = body.replace('<noscript>', fallback+'<noscript>')
    body = body.replace('__SPEC__', spec(slug))
    filename = 'test-'+slug+'.html'
    title = 'Test '+name+' gratuit — '+str(count)+' questions avec corrigé'
    desc = f'Test de positionnement {name} gratuit et sans inscription : {count} questions, {config["minutes"]} minutes, résultat immédiat et corrigé expliqué. Repère indicatif.'
    payload = {k:v for k,v in config.items() if k != 'questions'}
    safe_json = lambda x: json.dumps(x, ensure_ascii=False).replace('<', '\\u003c')
    doc = head(title, desc, filename, '<link rel="stylesheet" href="/assets/positioning/quiz.css">') + header('Test '+name) + body + footer()
    doc += '<script type="application/json" id="test-config">'+safe_json(payload)+'</script>'
    doc += '<script type="application/json" id="questions-data">'+safe_json(questions)+'</script>'
    doc += '<script src="/assets/positioning/quiz.js" defer></script></body></html>\n'
    (ROOT / filename).write_text(doc)

title = 'Cas pratique SILAE — les contrôles avant de valider une paie'
desc = 'Un cas pédagogique fictif en quatre décisions : absence à qualifier, pièces à vérifier, doublon à éviter et contrôle avant validation. Gratuit et sans inscription.'
silae = head(title, desc, 'demonstration-silae.html', '<link rel="stylesheet" href="/assets/positioning/silae.css">')
silae += header('Cas pratique SILAE') + (SRC / 'silae-body.tpl').read_text() + footer()
silae += '<script src="/assets/positioning/silae.js" defer></script></body></html>\n'
(ROOT / 'demonstration-silae.html').write_text(silae)

def card(href, kind, meta, title, domains, link, extra='', intro=''):
    intro = f'<span class="rc-intro">{intro}</span>' if intro else ''
    return (f'<a class="resource-card rc--{kind}" href="{href}"><span class="rc-vis" aria-hidden="true">{spec(kind)}</span>'
            f'<span class="rc-body"><span class="rc-meta">{meta}</span><h3>{title}</h3>'
            f'<span class="rc-dom">{domains}</span>{intro}{extra}<span class="resource-link">{link}{ARROW}</span></span></a>')

BY = {t['slug']: t for t in TESTS}
def test_card(slug):
    t = BY[slug]
    n = len(t['questions'])
    meta = f"{n} questions{' écrites' if slug == 'anglais' else ''} · {esc(t['minutes'])} min"
    title = 'Test d’anglais' if slug == 'anglais' else 'Test ' + esc(t['name'])
    return card(f'/test-{slug}.html', slug, meta, title, ' · '.join(esc(d) for d in t['domains']), 'Faire le test',
                intro=esc(t['intro']) if slug == 'excel' else '')

office = ''.join(test_card(s) for s in ('excel', 'word', 'powerpoint', 'outlook', 'excel-vba'))
more = test_card('anglais') + card('/demonstration-silae.html', 'silae', 'Cas pratique · 4 décisions · 5 min environ',
    'Cas pratique SILAE', 'Avant de valider une paie, quels contrôles effectuer&nbsp;?', 'Essayer le cas',
    '<span class="rc-note">Dossier fictif, sans accès au logiciel SILAE.</span>')
hub = ('<main id="top"><section class="hub-hero w"><div class="hub-copy"><span class="eyebrow">Gratuit · Sans inscription</span>'
       '<h1>Quelques minutes pour <br>situer vos repères.</h1>'
       '<p class="lead">Excel, Word, PowerPoint, Outlook, Excel VBA ou anglais : choisissez votre test de positionnement, obtenez votre résultat et découvrez les notions à travailler.</p>'
       '<ul class="hub-facts"><li><b>3 à 8 min</b><span>par test</span></li><li><b>Immédiat</b><span>résultat et corrigé</span></li><li><b>Sans email</b><span>rien à remplir</span></li></ul>'
       '<p class="hub-note">Des questionnaires courts et indicatifs, avec un corrigé expliqué. Aucun email demandé pour consulter votre résultat.</p></div>'
       '<div class="hub-vis" aria-hidden="true"><div class="hv hv1">' + spec('word') + '</div><div class="hv hv2">' + spec('excel') + '</div><div class="hv hv3">' + spec('repere') + '</div></div></section>'
       '<section class="w hub-sec" aria-labelledby="sec-office"><div class="hub-sec-h"><h2 id="sec-office">Bureautique</h2><p>Cinq tests, un logiciel à la fois.</p></div>'
       '<div class="resource-grid">' + office + '</div></section>'
       '<section class="w hub-sec" aria-labelledby="sec-more"><div class="hub-sec-h"><h2 id="sec-more">Anglais et paie</h2><p>Un test écrit et un cas guidé sur dossier fictif.</p></div>'
       '<div class="resource-grid resource-grid--duo">' + more + '</div></section>'
       '<section class="w hub-help"><div><h2>Et après votre résultat ?</h2><p>Repérez vos points d\'appui et les notions à revoir. Vous pouvez consulter la formation correspondante ou préparer un échange avec un conseiller. Vous choisissez vous-même les informations que vous souhaitez lui transmettre.</p>'
       '<p class="note">Ces tests ne sont ni une certification ni une validation d\'admission. Le test d\'anglais porte sur l\'écrit ; un positionnement complet doit aussi tenir compte de l\'oral et de la compréhension audio.</p></div>'
       '<a class="btn btn-ghost" href="/formations.html">Explorer les formations' + ARROW + '</a></section></main>')
doc = head('Tests de positionnement gratuits et cas pratique SILAE', 'Six tests courts en bureautique et anglais, avec résultat et corrigé immédiats, et un cas pratique SILAE. Sans inscription.', 'tests-positionnement.html', '<link rel="stylesheet" href="/assets/positioning/hub.css">')
(ROOT / 'tests-positionnement.html').write_text(doc + header('Choisir un test') + hub + footer() + '</body></html>\n')
print('Built six tests, SILAE case and resource hub')
