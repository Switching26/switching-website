#!/usr/bin/env python3
"""Build the public self-assessments. Sources are local; no API or dependency."""
from pathlib import Path
import html
import json
import re
from collections import Counter

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / 'tools/positioning'
SITE = 'https://www.switching-formation.fr'
TESTS = json.loads((SRC / 'tests.json').read_text())
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
<link rel="stylesheet" href="/assets/positioning/base.css">{extra}
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

cards = ''
for t in TESTS:
    cards += f'''<a class="resource-card" href="/test-{t['slug']}.html"><span class="eyebrow">{len(t['questions'])} questions · {t['minutes']} min</span><h2>Test {esc(t['name'])}</h2><p>{esc(t['intro'])}</p><span class="resource-link">Faire le test <span aria-hidden="true">→</span></span></a>'''
hub = '''<main id="top"><section class="hub-hero w"><span class="eyebrow">Gratuit · Sans inscription</span><h1>Quelques minutes pour<br>situer vos repères.</h1><p class="lead">Excel, Word, PowerPoint, Outlook, Excel VBA ou anglais : choisissez votre test de positionnement, obtenez votre résultat et découvrez les notions à travailler.</p><p class="hub-note">Des questionnaires courts et indicatifs, avec un corrigé expliqué. Aucun email demandé pour consulter votre résultat.</p></section><section class="w" aria-label="Choisir un test"><div class="resource-grid">'''
hub += cards + '''</div></section><section class="w hub-silae" aria-labelledby="silae-title"><div><span class="eyebrow">Paie · Cas pratique guidé</span><h2 id="silae-title">Avant de valider une paie,<br>quels contrôles effectuer ?</h2><p>Une absence à préciser, des pièces à croiser et un doublon à éviter. Travaillez quatre décisions sur un dossier fictif, avec un corrigé à chaque étape.</p><p class="note">Une illustration pédagogique des réflexes de paie, sans accès au logiciel SILAE.</p></div><a class="btn btn-primary" href="/demonstration-silae.html">Essayer le cas SILAE <span aria-hidden="true">→</span></a></section><section class="w hub-help"><h2>Et après votre résultat ?</h2><p>Repérez vos points d'appui et les notions à revoir. Vous pouvez consulter la formation correspondante ou préparer un échange avec un conseiller. Vous choisissez vous-même les informations que vous souhaitez lui transmettre.</p><p>Ces tests ne sont ni une certification ni une validation d'admission. Le test d'anglais porte sur l'écrit ; un positionnement complet doit aussi tenir compte de l'oral et de la compréhension audio.</p><a class="btn btn-ghost" href="/formations.html">Explorer les formations</a></section></main>'''
doc = head('Tests de positionnement gratuits et cas pratique SILAE', 'Six tests courts en bureautique et anglais, avec résultat et corrigé immédiats, et un cas pratique SILAE. Sans inscription.', 'tests-positionnement.html', '<link rel="stylesheet" href="/assets/positioning/hub.css">')
(ROOT / 'tests-positionnement.html').write_text(doc + header('Choisir un test') + hub + footer() + '</body></html>\n')
print('Built six tests, SILAE case and resource hub')
