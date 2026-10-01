#!/usr/bin/env python3
"""Restyle the free-resource blocks (.sf-resource) of the entry pages.

Idempotent: reads each block's heading, text and links (old or new markup) and
rewrites only that block. Texts and hrefs are kept; a short kicker and a
decorative trade specimen are added. Run: python3 tools/positioning/entries.py
"""
from pathlib import Path
import html
import re
import sys

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(Path(__file__).resolve().parent))
from specimens import spec  # noqa: E402

PAGES = [
    'formation-excel-cpf.html', 'formation-excel-vba-cpf.html', 'formation-word-cpf.html',
    'formation-powerpoint-cpf.html', 'formation-anglais-cpf.html', 'formation-anglais-niveau-2-b1-b2-rs6905.html',
    'formation-silae-paie-cpf.html', 'formation-silae-20h-cpf.html', 'formation-gestionnaire-de-paie-titre-pro.html',
    'blog/apprendre-excel-guide-debutant.html', 'blog/tableau-croise-dynamique-excel.html',
    'blog/formation-excel-en-ligne-guide.html', 'blog/formation-word-fonctions-avancees.html',
    'blog/astuces-powerpoint-presentations.html', 'blog/formation-anglais-professionnel.html',
    'blog/formation-silae-logiciel-paie.html', 'formations.html', 'index.html',
]
KIND = {'/test-excel.html': 'excel', '/test-word.html': 'word', '/test-powerpoint.html': 'powerpoint',
        '/test-outlook.html': 'outlook', '/test-excel-vba.html': 'excel-vba', '/test-anglais.html': 'anglais',
        '/demonstration-silae.html': 'silae', '/tests-positionnement.html': 'repere'}
ARROW = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>'
BLOCK = re.compile(r'<section class="sf-resource[^"]*" aria-label="Ressource gratuite">.*?</section>', re.S)


def rebuild(block):
    classes = re.match(r'<section class="([^"]*)"', block).group(1).split()
    head = re.search(r'<(h[23])>(.*?)</\1>', block, re.S)
    texts = [t for t in re.findall(r'<p(?: class="([^"]*)")?>(.*?)</p>', block, re.S) if t[0] != 'sf-resource-kicker']
    links = re.findall(r'<a class="sf-resource-button" href="([^"]+)">(.*?)</a>', block, re.S)
    assert head and len(texts) == 1 and links, block[:200]
    labels = [(href, re.sub(r'<svg.*?</svg>', '', label, flags=re.S).strip()) for href, label in links]
    multi = len(labels) > 1
    kind = 'repere' if multi else KIND[labels[0][0]]
    kicker = ('Tests gratuits · sans inscription' if kind == 'repere'
              else 'Cas pratique · dossier fictif' if kind == 'silae'
              else 'Test gratuit · corrigé immédiat')
    keep = [c for c in classes if c in ('sf-resource', 'sf-resource-catalog')]
    cls = ' '.join(keep + (['sf-resource-multi'] if multi else []) + ['sf-resource--' + kind])
    buttons = ''.join(f'<a class="sf-resource-button" href="{h}">{l}{ARROW}</a>' for h, l in labels)
    return (f'<section class="{cls}" aria-label="Ressource gratuite"><div class="sf-resource-in">'
            f'<div class="sf-resource-spec" aria-hidden="true">{spec(kind)}</div>'
            f'<div class="sf-resource-copy"><p class="sf-resource-kicker">{kicker}</p>'
            f'<{head.group(1)}>{head.group(2)}</{head.group(1)}><p>{texts[0][1]}</p></div>'
            f'<div class="sf-resource-links">{buttons}</div></div></section>')


total = 0
for name in PAGES:
    path = ROOT / name
    text = path.read_text()
    new, n = BLOCK.subn(lambda m: rebuild(m.group(0)), text)
    assert n >= 1, name
    total += n
    if new != text:
        path.write_text(new)
print(f'{total} resource blocks in {len(PAGES)} pages')
