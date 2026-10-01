# Tests publics de positionnement

Sources des six questionnaires : `tests.json`. Pages générées avec `python3 tools/build-positioning.py`, sans dépendance externe. Le moteur partagé est `assets/positioning/quiz.js` ; les gabarits sont dans ce dossier. Le cas SILAE réutilise le prototype pédagogique relu le 30 septembre 2026, avec son moteur `assets/positioning/silae.js`.

## Périmètre

- Excel : 10 questions. Word, PowerPoint, Outlook et Excel VBA : 6 chacun. Anglais : 8.
- Scores de connaissances indicatifs, sans certification ni validation d'admission. Anglais écrit uniquement, sans attribution automatique d'un niveau CECRL.
- Résultats calculés dans la page, sans stockage ni transmission des réponses. Un résumé peut être copié volontairement avant de rejoindre le formulaire de conseil existant.
- Cas SILAE : dossier fictif, quatre décisions de contrôle, aucune simulation de calcul légal ou d'accès au logiciel.
- Découverte : accueil, catalogue (dont entrées par domaine), pages de formation, articles associés et sitemap. La page `tests-positionnement.html` réunit les sept ressources.

## Vérification pédagogique

Questions originales, repères vérifiés dans la documentation de l'éditeur :

- [Styles Word](https://support.microsoft.com/en-us/word/customize-or-create-new-styles) ; [sauts de section](https://support.microsoft.com/en-us/word/use-section-breaks-to-change-the-layout-or-formatting-in-one-section-of-your-word-document).
- [Masque PowerPoint](https://support.microsoft.com/en-us/powerpoint/training/what-is-a-slide-master-in-powerpoint) ; [mode Présentateur](https://support.microsoft.com/en-gb/office/what-is-presenter-view-98f31265-9630-41a7-a3f1-9b4736928ee3).
- VBA : [For…Next](https://learn.microsoft.com/en-us/office/vba/language/reference/user-interface-help/fornext-statement), [Option Explicit](https://learn.microsoft.com/en-us/office/vba/language/reference/user-interface-help/option-explicit-statement), [ThisWorkbook](https://learn.microsoft.com/en-us/office/vba/api/excel.application.thisworkbook).

## Recette

Servir le site en HTTP local. Vérifier les six questionnaires : réponses vides, bonne réponse, mauvaise réponse, passage, retour, score par domaine, correction, résumé et remise à zéro. Tester le cas SILAE juste/faux et la révélation des pièces. Contrôler 320/390/768/1440 px, navigation clavier, liens d'entrée, boutons de sortie et fonctionnement sans JavaScript. Ne jamais soumettre une demande commerciale réelle depuis une recette.

Les pages générées doivent rester reproductibles, indexables et présentes dans le sitemap. Le backend n'a pas besoin d'être modifié pour ajouter un questionnaire.
