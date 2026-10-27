#!/usr/bin/env python3
"""IndexNow pour switching-formation.fr (27/10/2026).

Prévient Bing (et les autres moteurs IndexNow : Yandex, Naver, Seznam, Yep) des pages
publiques modifiées à chaque mise en ligne. Google ne participe pas à IndexNow.

  python3 .github/indexnow/indexnow.py pages <avant> <apres> [--tout] > urls.txt
  python3 .github/indexnow/indexnow.py attendre urls.txt      # attend que le site serve la nouvelle version
  python3 .github/indexnow/indexnow.py envoyer urls.txt

Seules les adresses présentes dans sitemap.xml (avant ou après) sont envoyées.
La clé est le fichier <clé>.txt à la racine du dépôt (publique par principe).
"""
import glob, html, json, os, re, subprocess, sys, time, urllib.request, urllib.error

BASE = 'https://www.switching-formation.fr/'
HOST = 'www.switching-formation.fr'
RACINE = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))


def cle():
    for f in glob.glob(os.path.join(RACINE, '*.txt')):
        n = os.path.basename(f)[:-4]
        if re.fullmatch(r'[0-9a-f]{32}', n) and open(f).read().strip() == n:
            return n
    sys.exit('clé IndexNow introuvable à la racine')


def locs(xml):
    return set(re.findall(r'<loc>([^<]+)</loc>', xml or ''))


def git(*a):
    return subprocess.run(['git', *a], cwd=RACINE, capture_output=True, text=True).stdout


def url_de(fichier):
    if not fichier.endswith('.html'):
        return None
    return BASE if fichier == 'index.html' else BASE + fichier


def pages(avant, apres, tout):
    plan = locs(open(os.path.join(RACINE, 'sitemap.xml'), encoding='utf-8').read())
    if tout:
        return sorted(plan)
    if not avant or set(avant) == {'0'}:
        avant = apres + '~1'
    plan |= locs(git('show', f'{avant}:sitemap.xml'))
    noms = git('diff', '--name-only', avant, apres).split()
    urls = {u for u in (url_de(n) for n in noms) if u in plan}
    if 'sitemap.xml' in noms:  # pages ajoutées au plan du site
        urls |= locs(open(os.path.join(RACINE, 'sitemap.xml'), encoding='utf-8').read()) - locs(git('show', f'{avant}:sitemap.xml'))
    return sorted(urls)


def norm(h):
    """Texte visible + données structurées, sans le masquage d'adresses mail de Cloudflare."""
    ld = ' '.join(re.findall(r'<script type="application/ld\+json">(.*?)</script>', h, re.S))
    h = re.sub(r'<(script|style)[^>]*>.*?</\1>', ' ', h, flags=re.S)
    t = html.unescape(re.sub(r'<[^>]+>', ' ', h))
    t = re.sub(r'\[email[\s ]*protected\]|[\w.+-]+@[\w-]+\.[\w.]+', ' ', t)
    return re.sub(r'\s+', ' ', t + ' ' + ld).strip()


def lire(url):
    req = urllib.request.Request(url + ('&' if '?' in url else '?') + 'indexnow=%d' % time.time(), headers={'User-Agent': 'IndexNow-Switching/1.0'})
    with urllib.request.urlopen(req, timeout=30) as r:
        return r.read().decode('utf-8', 'replace')


def attendre(fichier_urls, delai=600):
    urls = [u for u in open(fichier_urls).read().split() if u]
    cibles = []
    for u in urls:
        f = 'index.html' if u == BASE else u[len(BASE):]
        p = os.path.join(RACINE, f)
        if os.path.exists(p):
            cibles.append((u, norm(open(p, encoding='utf-8').read())))
    if not cibles:
        return
    fin = time.time() + delai
    while time.time() < fin:
        restants = []
        for u, attendu in cibles:
            try:
                if norm(lire(u)) != attendu:
                    restants.append((u, attendu))
            except Exception:
                restants.append((u, attendu))
        if not restants:
            print('site à jour pour', len(cibles), 'page(s)')
            return
        cibles = restants
        time.sleep(20)
    print('délai dépassé, envoi quand même ;', len(cibles), 'page(s) encore différentes :', ' '.join(u for u, _ in cibles))


def envoyer(fichier_urls):
    urls = [u for u in open(fichier_urls).read().split() if u]
    if not urls:
        print('aucune page à signaler')
        return
    k = cle()
    corps = json.dumps({'host': HOST, 'key': k, 'keyLocation': BASE + k + '.txt', 'urlList': urls}).encode()
    req = urllib.request.Request('https://api.indexnow.org/indexnow', data=corps, method='POST', headers={'Content-Type': 'application/json; charset=utf-8'})
    try:
        with urllib.request.urlopen(req, timeout=30) as r:
            print('IndexNow', r.status, '—', len(urls), 'page(s) signalée(s)')
    except urllib.error.HTTPError as e:
        print('IndexNow refus', e.code, e.read()[:300])
        if e.code in (400, 403, 422):
            sys.exit(1)


if __name__ == '__main__':
    a = sys.argv[1:]
    if a and a[0] == 'pages':
        print('\n'.join(pages(a[1] if len(a) > 1 else '', a[2] if len(a) > 2 else 'HEAD', '--tout' in a)))
    elif a and a[0] == 'attendre':
        attendre(a[1])
    elif a and a[0] == 'envoyer':
        envoyer(a[1])
    else:
        sys.exit(__doc__)
