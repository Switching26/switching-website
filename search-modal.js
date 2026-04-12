// ===== RECHERCHE ⌘K — AUTO-INJECTION =====
(function() {
  // --- Inject nav button before .nav-cta ---
  var cta = document.querySelector('.nav-cta');
  if (cta) {
    var btn = document.createElement('div');
    btn.className = 'nav-cmdk';
    btn.id = 'navSearchTrigger';
    var isMac = /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent);
    btn.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>Rechercher<span class="nav-cmdk-kbd">' + (isMac ? '\u2318K' : 'Ctrl K') + '</span>';
    cta.parentNode.insertBefore(btn, cta);
  }

  // --- Inject modal HTML ---
  var modalHTML = '<div class="cmd-overlay" id="cmdModal">' +
    '<div class="cmd-backdrop" id="cmdBackdrop"></div>' +
    '<div class="cmd-container"><div class="cmd-box">' +
    '<div class="cmd-input-area">' +
    '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>' +
    '<input class="cmd-input" id="cmdInput" type="text" placeholder="Rechercher une formation..." autocomplete="off">' +
    '<span class="cmd-esc" id="cmdClose">ESC</span>' +
    '</div>' +
    '<div class="cmd-results" id="cmdResults"></div>' +
    '<div class="cmd-empty" id="cmdEmpty">' +
    '<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" style="opacity:.25;margin-bottom:10px"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>' +
    '<div style="font-size:14px;color:#666">Aucune formation trouv\u00e9e</div>' +
    '</div>' +
    '</div></div></div>';

  document.body.insertAdjacentHTML('beforeend', modalHTML);

  // --- Colors by category ---
  var COLORS = {
    langue: '#2E86C1',
    bureau: '#E67E22',
    graphisme: '#0E9599',
    web: '#4F63D2',
    compta: '#8B6914',
    ia: '#6C4FD2',
    bdc: '#D4A017'
  };

  // --- Category aliases for smart search ---
  var CAT_ALIASES = {
    langue: ['langue', 'langues', 'language', 'anglais', 'francais', 'fran\u00e7ais', 'fle'],
    bureau: ['bureautique', 'bureau', 'office', 'informatique', 'excel', 'word', 'powerpoint'],
    graphisme: ['graphisme', 'design', 'graphique', 'dessin', 'cr\u00e9ation', 'creation', 'pao', 'cao', 'dao', '3d', 'video', 'vid\u00e9o', 'montage'],
    web: ['web', 'digital', 'num\u00e9rique', 'numerique', 'internet', 'site', 'marketing', 'r\u00e9f\u00e9rencement', 'referencement', 'seo', 'sea'],
    compta: ['compta', 'comptabilit\u00e9', 'comptabilite', 'paie', 'gestion', 'salaire', 'bulletin'],
    ia: ['ia', 'intelligence artificielle', 'ai', 'chatgpt', 'gpt', 'artificielle', 'machine learning', 'automatisation'],
    bdc: ['bdc', 'bilan', 'comp\u00e9tences', 'competences', 'orientation', 'reconversion', 'bilan de comp\u00e9tences']
  };

  // --- SVG icon fragments (inline, no fill/stroke attrs — inherited from parent) ---
  var I = {
    globe: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M2 12h20"/><path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z"/></svg>',
    chat: '<svg viewBox="0 0 24 24"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>',
    monitor: '<svg viewBox="0 0 24 24"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8"/><path d="M12 17v4"/></svg>',
    spreadsheet: '<svg viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18"/><path d="M9 21V9"/></svg>',
    doc: '<svg viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><path d="M16 13H8"/><path d="M16 17H8"/><path d="M10 9H8"/></svg>',
    mail: '<svg viewBox="0 0 24 24"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22 6 12 13 2 6"/></svg>',
    grid: '<svg viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>',
    barchart: '<svg viewBox="0 0 24 24"><path d="M18 20V10"/><path d="M12 20V4"/><path d="M6 20v-6"/></svg>',
    cloud: '<svg viewBox="0 0 24 24"><path d="M18 10h-1.26A8 8 0 109 20h9a5 5 0 000-10z"/></svg>',
    window: '<svg viewBox="0 0 24 24"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="M2 8h20"/><path d="M10 4v4"/></svg>',
    image: '<svg viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg>',
    pen: '<svg viewBox="0 0 24 24"><path d="M12 19l7-7 3 3-7 7-3-3z"/><path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"/><circle cx="11" cy="11" r="2"/></svg>',
    book: '<svg viewBox="0 0 24 24"><path d="M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2z"/><path d="M22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z"/></svg>',
    star: '<svg viewBox="0 0 24 24"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>',
    video: '<svg viewBox="0 0 24 24"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2"/></svg>',
    box3d: '<svg viewBox="0 0 24 24"><path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/></svg>',
    code: '<svg viewBox="0 0 24 24"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>',
    cart: '<svg viewBox="0 0 24 24"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 002-1.61L23 6H6"/></svg>',
    megaphone: '<svg viewBox="0 0 24 24"><path d="M3 11l18-5v12L3 13v-2z"/><path d="M11.6 16.8a3 3 0 11-5.8-1.6"/></svg>',
    search: '<svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>',
    target: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>',
    invoice: '<svg viewBox="0 0 24 24"><rect x="4" y="2" width="16" height="20" rx="2"/><path d="M8 6h8"/><path d="M8 10h8"/><path d="M8 14h4"/></svg>',
    clipboard: '<svg viewBox="0 0 24 24"><path d="M16 4h2a2 2 0 012 2v14a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2h2"/><rect x="8" y="2" width="8" height="4" rx="1"/><path d="M12 11h4"/><path d="M12 16h4"/><path d="M8 11h.01"/><path d="M8 16h.01"/></svg>',
    creditcard: '<svg viewBox="0 0 24 24"><rect x="1" y="4" width="22" height="16" rx="2"/><path d="M1 10h22"/></svg>',
    check: '<svg viewBox="0 0 24 24"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>',
    gear: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/></svg>',
    compass: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><polygon points="12 2.5 13.5 10 12 11 10.5 10" fill="currentColor" opacity=".6" stroke="none"/></svg>',
    building: '<svg viewBox="0 0 24 24"><path d="M3 21h18"/><path d="M5 21V7l8-4v18"/><path d="M19 21V11l-6-4"/><path d="M9 9v.01"/><path d="M9 12v.01"/><path d="M9 15v.01"/></svg>',
    layout: '<svg viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18"/><path d="M9 21V9"/></svg>'
  };

  // --- Full catalogue with individual icons ---
  var FORMATIONS = [
    // === LANGUES ===
    { t: "Anglais Niveau 1 (A1-A2)", c: "langue", k: "anglais d\u00e9butant a1 a2 english beginner langue", i: I.globe },
    { t: "Anglais Niveau 2 (B1-B2)", c: "langue", k: "anglais interm\u00e9diaire b1 b2 professionnel english intermediate langue", i: I.globe },
    { t: "Anglais Niveau 3 (C1-C2)", c: "langue", k: "anglais avanc\u00e9 c1 c2 n\u00e9gociation english advanced langue", i: I.globe },
    { t: "Anglais Complet (A1-C2)", c: "langue", k: "anglais complet vtest certification english all levels langue", i: I.globe },
    { t: "Fran\u00e7ais Niveau 1 (A1-A2)", c: "langue", k: "fran\u00e7ais fle d\u00e9butant a1 a2 french langue", i: I.chat },
    { t: "Fran\u00e7ais Niveau 2 (B1-B2)", c: "langue", k: "fran\u00e7ais fle interm\u00e9diaire b1 b2 french langue", i: I.chat },
    { t: "Fran\u00e7ais Niveau 3 (C1-C2)", c: "langue", k: "fran\u00e7ais fle avanc\u00e9 c1 c2 french langue", i: I.chat },
    { t: "Fran\u00e7ais Complet (A1-C2)", c: "langue", k: "fran\u00e7ais fle complet french langue", i: I.chat },

    // === BUREAUTIQUE ===
    { t: "Bases Informatiques", c: "bureau", k: "bases informatique windows fichiers ordinateur d\u00e9butant bureautique", i: I.monitor },
    { t: "Excel Complet CPF", c: "bureau", k: "excel formules tableaux crois\u00e9s vba certification eni bureautique tableur", i: I.spreadsheet },
    { t: "Excel VBA Complet", c: "bureau", k: "excel vba macros automatisation programmation bureautique", i: I.spreadsheet },
    { t: "Word Complet", c: "bureau", k: "word mise en page publipostage traitement texte bureautique", i: I.doc },
    { t: "PowerPoint Complet", c: "bureau", k: "powerpoint pr\u00e9sentations slides diaporama bureautique", i: I.monitor },
    { t: "Outlook Complet", c: "bureau", k: "outlook messagerie calendrier email mail bureautique", i: I.mail },
    { t: "Pack Office Complet", c: "bureau", k: "pack office excel word powerpoint microsoft bureautique", i: I.grid },
    { t: "Power BI", c: "bureau", k: "power bi donn\u00e9es dashboard tableaux de bord analyse data visualisation bureautique", i: I.barchart },
    { t: "Les Outils Collaboratifs Google", c: "bureau", k: "google docs sheets slides drive meet collaboratif bureautique", i: I.cloud },
    { t: "Microsoft 365", c: "bureau", k: "microsoft 365 teams sharepoint onedrive planner collaboratif bureautique", i: I.window },

    // === GRAPHISME ===
    { t: "Photoshop", c: "graphisme", k: "photoshop retouche photo adobe image graphisme design", i: I.image },
    { t: "Illustrator", c: "graphisme", k: "illustrator vectoriel logo adobe graphisme design illustration", i: I.pen },
    { t: "InDesign", c: "graphisme", k: "indesign mise en page brochure adobe pao print graphisme design", i: I.book },
    { t: "Canva", c: "graphisme", k: "canva design visuel r\u00e9seaux sociaux graphisme cr\u00e9ation", i: I.star },
    { t: "Webdesigner", c: "graphisme", k: "webdesigner ui ux interface maquette prototype design web graphisme", i: I.layout },
    { t: "Premi\u00e8re Pro CC", c: "graphisme", k: "premiere pro montage vid\u00e9o adobe graphisme video", i: I.video },
    { t: "After Effects", c: "graphisme", k: "after effects motion design animation adobe graphisme video", i: I.video },
    { t: "Final Cut Pro X", c: "graphisme", k: "final cut pro montage vid\u00e9o mac apple graphisme video", i: I.video },
    { t: "SketchUp Pro", c: "graphisme", k: "sketchup 3d architecture maquette mod\u00e9lisation graphisme", i: I.box3d },
    { t: "Autodesk Revit", c: "graphisme", k: "revit bim architecture structure mep autodesk graphisme 3d", i: I.box3d },
    { t: "SolidWorks", c: "graphisme", k: "solidworks cao m\u00e9canique 3d conception pi\u00e8ces assemblages graphisme", i: I.box3d },
    { t: "AutoCAD", c: "graphisme", k: "autocad dessin technique 2d 3d industriel dao graphisme", i: I.box3d },
    { t: "Permis de construire PCMI", c: "graphisme", k: "permis construire pcmi urbanisme r\u00e9glementation dossier architecture", i: I.building },

    // === WEB & DIGITAL ===
    { t: "Sites web avec WordPress", c: "web", k: "wordpress site vitrine cms seo web digital cr\u00e9ation", i: I.code },
    { t: "Sites e-commerce WordPress (WooCommerce)", c: "web", k: "woocommerce boutique en ligne ecommerce e-commerce web digital vente", i: I.cart },
    { t: "Marketing digital pour entrepreneurs", c: "web", k: "marketing digital strat\u00e9gie r\u00e9seaux sociaux emailing web publicit\u00e9", i: I.megaphone },
    { t: "R\u00e9seaux sociaux & Ads", c: "web", k: "facebook instagram linkedin publicit\u00e9 ads r\u00e9seaux sociaux web digital community", i: I.megaphone },
    { t: "R\u00e9seaux sociaux", c: "web", k: "community management contenu calendrier \u00e9ditorial engagement analytics r\u00e9seaux sociaux web", i: I.megaphone },
    { t: "D\u00e9veloppeur Web", c: "web", k: "html css javascript d\u00e9veloppeur code programmation web digital front", i: I.code },
    { t: "D\u00e9veloppeur informatique", c: "web", k: "programmation algorithmique base donn\u00e9es front back d\u00e9veloppeur web digital", i: I.code },
    { t: "SEO : r\u00e9f\u00e9rencement web", c: "web", k: "seo r\u00e9f\u00e9rencement naturel mots-cl\u00e9s google web digital visibilit\u00e9", i: I.search },
    { t: "SEA : Google Ads", c: "web", k: "sea google ads publicit\u00e9 payante search display shopping web digital", i: I.target },

    // === COMPTA & PAIE ===
    { t: "Gestion de la paie avec Silae CPF", c: "compta", k: "silae paie dsn bulletin charges sociales cpf comptabilit\u00e9 salaire", i: I.invoice },
    { t: "Gestion de la paie avec Ciel Paie", c: "compta", k: "ciel paie cotisations d\u00e9clarations sociales comptabilit\u00e9 salaire", i: I.invoice },
    { t: "Gestion de la paie avec Segid", c: "compta", k: "segid paie param\u00e9trage saisie \u00e9ditions comptabilit\u00e9 salaire", i: I.invoice },
    { t: "Secr\u00e9taire Assistant Comptable", c: "compta", k: "comptabilit\u00e9 rapprochements bancaires tva bilan secr\u00e9taire", i: I.clipboard },
    { t: "Comptabilit\u00e9 G\u00e9n\u00e9rale", c: "compta", k: "comptabilit\u00e9 \u00e9critures bilan compte r\u00e9sultat gestion", i: I.creditcard },

    // === INTELLIGENCE ARTIFICIELLE ===
    { t: "Apprendre \u00e0 utiliser ChatGPT", c: "ia", k: "chatgpt prompt engineering ia intelligence artificielle openai gpt", i: I.chat },
    { t: "Midjourney PRO \u2014 Photos & Vid\u00e9os IA", c: "ia", k: "midjourney images photos vid\u00e9os ia g\u00e9n\u00e9rative intelligence artificielle", i: I.image },
    { t: "IA conversationnelle \u2014 Cycle de vente", c: "ia", k: "ia vente prospection closing certifiante intelligence artificielle commercial", i: I.check },
    { t: "Copilot pour Microsoft 365", c: "ia", k: "copilot microsoft 365 word excel powerpoint ia intelligence artificielle", i: I.monitor },
    { t: "Vid\u00e9os avec l\u2019IA", c: "ia", k: "vid\u00e9o ia acad\u00e9mie cr\u00e9ation professionnelle intelligence artificielle", i: I.video },
    { t: "IA G\u00e9n\u00e9rative \u2014 Contenus (26h)", c: "ia", k: "ia g\u00e9n\u00e9rative contenus r\u00e9dactionnels visuels certifiante inkrea intelligence artificielle 26h", i: I.image },
    { t: "IA G\u00e9n\u00e9rative \u2014 Contenus (10h)", c: "ia", k: "ia g\u00e9n\u00e9rative contenus visuels certifiante inkrea intelligence artificielle 10h condens\u00e9", i: I.image },
    { t: "IA Business Pro \u2014 OptimIA", c: "ia", k: "ia automatisation make optimia business intelligence artificielle process", i: I.gear },
    { t: "CapCut \u2014 Montages vid\u00e9os IA", c: "ia", k: "capcut montage vid\u00e9o ia r\u00e9seaux sociaux tiktok intelligence artificielle", i: I.video },

    // === BILAN DE COMPÉTENCES ===
    { t: "Bilan de comp\u00e9tences \u2014 24h CPF", c: "bdc", k: "bilan comp\u00e9tences 24h cpf orientation projet professionnel reconversion", i: I.compass },
    { t: "Bilan de comp\u00e9tences \u2014 15h CPF", c: "bdc", k: "bilan comp\u00e9tences 15h cpf condens\u00e9 projet reconversion", i: I.compass }
  ];

  // --- Accent normalization for smart search ---
  function normalize(str) {
    return str.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[\u2019\u2018']/g, ' ');
  }

  // --- Levenshtein distance (fuzzy matching) ---
  function levenshtein(a, b) {
    if (a.length === 0) return b.length;
    if (b.length === 0) return a.length;
    var matrix = [];
    for (var i = 0; i <= b.length; i++) matrix[i] = [i];
    for (var j = 0; j <= a.length; j++) matrix[0][j] = j;
    for (var i = 1; i <= b.length; i++) {
      for (var j = 1; j <= a.length; j++) {
        var cost = a[j - 1] === b[i - 1] ? 0 : 1;
        matrix[i][j] = Math.min(
          matrix[i - 1][j] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j - 1] + cost
        );
      }
    }
    return matrix[b.length][a.length];
  }

  // Max typos allowed based on word length
  function maxTypos(word) {
    if (word.length <= 2) return 0;
    if (word.length <= 4) return 1;
    return 2;
  }

  // Check if queryWord fuzzy-matches any word in a word list
  function fuzzyMatchWords(queryWord, wordList) {
    var maxD = maxTypos(queryWord);
    if (maxD === 0) return false;
    for (var i = 0; i < wordList.length; i++) {
      var w = wordList[i];
      // Skip if length difference is too big (quick reject)
      if (Math.abs(w.length - queryWord.length) > maxD) continue;
      if (levenshtein(queryWord, w) <= maxD) return true;
    }
    return false;
  }

  // Check if queryWord fuzzy-matches as a substring (for longer fields)
  function fuzzyContains(queryWord, text) {
    // First try exact substring
    if (text.indexOf(queryWord) !== -1) return 2; // exact = high confidence
    var maxD = maxTypos(queryWord);
    if (maxD === 0) return 0;
    // Slide a window across the text
    var qLen = queryWord.length;
    for (var start = 0; start <= text.length - qLen + maxD; start++) {
      var end = Math.min(start + qLen + maxD, text.length);
      var chunk = text.substring(start, end);
      if (levenshtein(queryWord, chunk) <= maxD) return 1; // fuzzy match
    }
    return 0;
  }

  // --- Pre-compute normalized search fields + word lists ---
  FORMATIONS.forEach(function(f) {
    f._nt = normalize(f.t);
    f._nk = normalize(f.k);
    // Pre-split into individual words for fuzzy word-by-word matching
    f._tw = f._nt.split(/\s+/).filter(function(w) { return w.length > 1; });
    f._kw = f._nk.split(/\s+/).filter(function(w) { return w.length > 1; });
  });

  var normalizedAliases = {};
  var aliasWords = {};
  Object.keys(CAT_ALIASES).forEach(function(cat) {
    normalizedAliases[cat] = CAT_ALIASES[cat].map(normalize);
    aliasWords[cat] = [];
    CAT_ALIASES[cat].forEach(function(a) {
      normalize(a).split(/\s+/).forEach(function(w) {
        if (w.length > 1 && aliasWords[cat].indexOf(w) === -1) aliasWords[cat].push(w);
      });
    });
  });

  // --- DOM refs ---
  var modal = document.getElementById('cmdModal');
  var input = document.getElementById('cmdInput');
  var resultsBox = document.getElementById('cmdResults');
  var emptyBox = document.getElementById('cmdEmpty');
  var sel = -1;

  function openModal() {
    modal.classList.add('open');
    input.value = '';
    sel = -1;
    renderResults();
    setTimeout(function() { input.focus(); }, 50);
    document.body.style.overflow = 'hidden';
  }

  function closeModal() {
    modal.classList.remove('open');
    document.body.style.overflow = '';
  }

  function highlight(text, query) {
    if (!query.trim()) return text;
    var words = query.trim().split(/\s+/).filter(function(w) { return w.length > 0; });
    var escaped = words.map(function(w) { return w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); });
    var regex = new RegExp('(' + escaped.join('|') + ')', 'gi');
    return text.replace(regex, '<mark>$1</mark>');
  }

  // --- Smart search scoring with fuzzy matching ---
  function scoreFormation(f, queryWords, rawQuery) {
    var nq = normalize(rawQuery);
    var score = 0;
    var matched = true;

    // Check if the raw normalized query matches a category alias (exact or fuzzy)
    for (var cat in normalizedAliases) {
      var aliases = normalizedAliases[cat];
      for (var a = 0; a < aliases.length; a++) {
        if (f.c === cat) {
          if (nq === aliases[a]) { score += 100; break; }
          // Fuzzy alias match (e.g. "inteligence artificiele")
          if (aliases[a].length > 3 && levenshtein(nq, aliases[a]) <= maxTypos(aliases[a])) {
            score += 70;
            break;
          }
        }
      }
    }

    // Multi-word matching: each query word must match somewhere (exact or fuzzy)
    for (var w = 0; w < queryWords.length; w++) {
      var word = queryWords[w];
      var wordFound = false;
      var wordScore = 0;

      // --- EXACT matches (higher scores) ---

      // Title exact substring
      if (f._nt.indexOf(word) !== -1) {
        wordScore += 30;
        wordFound = true;
        if (f._nt.indexOf(word) === 0 || f._nt.indexOf(' ' + word) !== -1) {
          wordScore += 10; // word-boundary bonus
        }
      }

      // Keyword exact substring
      if (f._nk.indexOf(word) !== -1) {
        wordScore += 15;
        wordFound = true;
      }

      // Category alias exact substring
      if (!wordFound) {
        for (var cat2 in normalizedAliases) {
          var aliases2 = normalizedAliases[cat2];
          for (var b = 0; b < aliases2.length; b++) {
            if (aliases2[b].indexOf(word) !== -1 && f.c === cat2) {
              wordScore += 20;
              wordFound = true;
              break;
            }
          }
          if (wordFound) break;
        }
      }

      // --- FUZZY matches (lower scores, only if no exact match found) ---
      if (!wordFound && word.length > 2) {

        // Fuzzy match against title words
        if (fuzzyMatchWords(word, f._tw)) {
          wordScore += 18;
          wordFound = true;
        }

        // Fuzzy match against keyword words
        if (!wordFound && fuzzyMatchWords(word, f._kw)) {
          wordScore += 10;
          wordFound = true;
        }

        // Fuzzy match against category alias words
        if (!wordFound) {
          for (var cat3 in aliasWords) {
            if (f.c === cat3 && fuzzyMatchWords(word, aliasWords[cat3])) {
              wordScore += 12;
              wordFound = true;
              break;
            }
          }
        }
      }

      if (!wordFound) {
        matched = false;
        break;
      }

      score += wordScore;
    }

    return matched ? score : 0;
  }

  function renderResults() {
    var q = input.value.trim();

    if (!q) {
      // Show all formations when empty
      emptyBox.classList.remove('vis');
      resultsBox.innerHTML = FORMATIONS.map(function(f, idx) {
        var col = COLORS[f.c];
        return '<a class="cmd-item" href="/inscription.html" data-i="' + idx + '">' +
          '<div class="cmd-item-icon" style="color:' + col + ';border-color:' + col + '22;background:' + col + '0a">' + f.i + '</div>' +
          '<div class="cmd-item-title">' + f.t + '</div>' +
          '<svg class="cmd-item-arrow" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m9 18 6-6-6-6"/></svg>' +
          '</a>';
      }).join('');
      return;
    }

    var nq = normalize(q);
    var queryWords = nq.split(/\s+/).filter(function(w) { return w.length > 0; });

    // Score all formations
    var scored = [];
    for (var i = 0; i < FORMATIONS.length; i++) {
      var s = scoreFormation(FORMATIONS[i], queryWords, q);
      if (s > 0) {
        scored.push({ f: FORMATIONS[i], s: s, idx: i });
      }
    }

    // Sort by score descending
    scored.sort(function(a, b) { return b.s - a.s; });

    if (!scored.length) {
      resultsBox.innerHTML = '';
      emptyBox.classList.add('vis');
      return;
    }

    emptyBox.classList.remove('vis');

    resultsBox.innerHTML = scored.map(function(item, idx) {
      var f = item.f;
      var col = COLORS[f.c];
      return '<a class="cmd-item' + (idx === sel ? ' sel' : '') + '" href="/inscription.html" data-i="' + idx + '">' +
        '<div class="cmd-item-icon" style="color:' + col + ';border-color:' + col + '22;background:' + col + '0a">' + f.i + '</div>' +
        '<div class="cmd-item-title">' + highlight(f.t, q) + '</div>' +
        '<svg class="cmd-item-arrow" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m9 18 6-6-6-6"/></svg>' +
        '</a>';
    }).join('');
  }

  // --- Keyboard shortcuts ---
  document.addEventListener('keydown', function(e) {
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
      e.preventDefault();
      modal.classList.contains('open') ? closeModal() : openModal();
    }
    if (e.key === 'Escape' && modal.classList.contains('open')) closeModal();

    if (modal.classList.contains('open')) {
      var items = resultsBox.querySelectorAll('.cmd-item');
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        sel = Math.min(sel + 1, items.length - 1);
        items.forEach(function(it, i) { it.classList.toggle('sel', i === sel); });
        if (items[sel]) items[sel].scrollIntoView({ block: 'nearest' });
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        sel = Math.max(sel - 1, 0);
        items.forEach(function(it, i) { it.classList.toggle('sel', i === sel); });
        if (items[sel]) items[sel].scrollIntoView({ block: 'nearest' });
      }
      if (e.key === 'Enter' && sel >= 0 && items[sel]) {
        items[sel].click();
      }
    }
  });

  // --- Event listeners ---
  var trigger = document.getElementById('navSearchTrigger');
  if (trigger) trigger.addEventListener('click', openModal);
  document.getElementById('cmdBackdrop').addEventListener('click', closeModal);
  document.getElementById('cmdClose').addEventListener('click', closeModal);
  input.addEventListener('input', function() { sel = -1; renderResults(); });
})();
