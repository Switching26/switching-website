#!/usr/bin/env python3
"""Read Switching's aggregate counters. Never print the private read key."""
import argparse
import json
from pathlib import Path
import urllib.error
import urllib.request

parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('--days', type=int, default=28, choices=range(1, 366), metavar='1..365')
parser.add_argument('--json', action='store_true')
args = parser.parse_args()
key_file = Path.home() / '.local/share/checkos-seo/audience-read-token'
if not key_file.is_file():
    parser.exit(1, 'Clé de lecture locale absente.\n')
request = urllib.request.Request(
    'https://www.switching-formation.fr/api/audience?days=' + str(args.days),
    headers={'X-Audience-Token': key_file.read_text().strip(), 'User-Agent': 'CheckOS-Audience-Reader'},
)
try:
    with urllib.request.urlopen(request, timeout=20) as response:
        result = json.load(response)
except urllib.error.HTTPError as error:
    parser.exit(1, f'Lecture indisponible (HTTP {error.code}).\n')
except (urllib.error.URLError, TimeoutError, json.JSONDecodeError):
    parser.exit(1, 'Lecture indisponible (réseau ou réponse invalide).\n')
if args.json:
    print(json.dumps(result, ensure_ascii=False, indent=2))
else:
    print(f"Consultations servies : {result['total']} — du {result['from']} au {result['through']} (UTC)")
    print(f"Mesure démarrée le {result['started_on']} ; journée en cours partielle. Ce ne sont pas des visiteurs uniques.")
    for row in result['pages']:
        print(f"{row['document_requests']:>6}  {row['page']}")
    if not result['persistence']['healthy']:
        print('Attention : la dernière sauvegarde des compteurs a échoué.')
