# Compteurs de consultation Switching

Mesure complémentaire à Search Console, autorisée le 30 septembre 2026.
Search Console reste la source des requêtes, impressions, clics et indexation Google.
Ce module maison compte uniquement les réponses HTTP aux pages publiques du sitemap.
Il ne remplace pas Search Console et ne mesure ni visiteurs uniques, sessions,
conversions, campagnes publicitaires, ni parcours individuels.

## Données et accès

- Un compteur par jour UTC et chemin public autorisé ; aucune ligne par visite.
- Aucun cookie, stockage navigateur, script client, pixel ou identifiant.
- Aucune IP, origine de visite, query string, UTM, donnée de formulaire ou CRM conservée.
- Le User-Agent n'est utilisé qu'en mémoire pour écarter des robots connus puis oublié.
- DNT: 1 et Sec-GPC: 1, préchargements, HEAD/POST, erreurs, admin, API et assets exclus.
- Les alias sans extension et index.html rejoignent leur page canonique.
- 365 jours glissants, purge au démarrage, en lecture et chaque cycle de sauvegarde.
- Fichier distinct du CRM et des demandes : DB_DIR/audience-counts.json, mode 0600.
- Sauvegarde atomique toutes les 15 s et à SIGTERM ; crash brutal : jusqu'à 15 s perdues.
- Une lecture corrompue désactive le compteur sans écraser le fichier ni arrêter le site.
- AUDIENCE_READ_TOKEN, au moins 32 caractères, active la mesure. Sans clé, elle reste arrêtée.
- GET /api/audience?days=28 avec X-Audience-Token ; clé indépendante, strictement en lecture.
- Réponses privées non cachées, jamais de jeton dans une URL. Aucun panneau public ajouté.

Les chiffres sont des requêtes de documents servies, pas des personnes. Rechargements
comptés ; cache navigateur sans requête non compté ; robots non identifiés possibles.
La journée courante et celle du déploiement sont partielles. Aucun historique reconstitué.

## Choix sans bandeau

Cette implémentation n'ajoute aucune lecture/écriture dans le terminal : les seules
entrées sont les requêtes ordinaires nécessaires au service des pages. Elle produit
directement des agrégats page/jour, sans identifiant ni journal brut à anonymiser.
Pas de fournisseur analytics, enrichissement ou rapprochement entre bases.
La page donnees.html informe de cette mesure. DNT/GPC sont aussi honorés.

Références examinées :
- https://www.cnil.fr/fr/cookies-solutions-pour-les-outils-de-mesure-daudience
- https://www.cnil.fr/sites/default/files/2025-07/outil_d_auto-evaluation_mesure_d_audience.pdf

Analyse de configuration, et non certification CNIL : le cadre CNIL distingue la
mesure des contenus consultés du suivi marketing. Ce module n'a ni suivi des canaux,
ni identifiant, ni combinaison de dimensions permettant de retrouver un parcours.
Ses agrégats ne contiennent que des entiers et des chemins publics, sans historique
individuel, même pour les petites valeurs. Les traitements des formulaires, du
chatbot et les journaux techniques de l'hébergeur sont distincts ; ce document
n'affirme pas que l'ensemble du site ou de l'hébergement ne traite aucune IP.
Toute extension au suivi individuel, aux campagnes ou aux conversions exige de
réexaminer le dispositif avant activation. Ne pas simplement activer GA4 sans consentement.

## Validation

node test-audience.cjs : comptage, exclusions, secret, absence de données brutes,
persistance/reprise, rétention et panne isolée.
node test-static-delivery.cjs : serveur réel avec DB temporaire, sans identifiant mail/IA,
régression gzip/Brotli/cache/admin, API privée, collecte et sauvegarde à l'arrêt.

Rollback : retirer AUDIENCE_READ_TOKEN désactive le module au prochain redémarrage.
Conserver le fichier de compteurs ; aucune migration de submissions.db.
