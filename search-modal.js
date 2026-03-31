// ===== RECHERCHE ⌘K — AUTO-INJECTION =====
(function() {
  // --- Inject nav button before .nav-cta ---
  var cta = document.querySelector('.nav-cta');
  if (cta) {
    var btn = document.createElement('div');
    btn.className = 'nav-cmdk';
    btn.id = 'navSearchTrigger';
    btn.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>Rechercher<span class="nav-cmdk-kbd">\u2318K</span>';
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

  // --- SVG icons by category ---
  var ICONS = {
    langue: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="12" cy="12" r="10"/><path d="M2 12h20"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>',
    bureau: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8"/><path d="M12 17v4"/></svg>',
    graphisme: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="m12 20 7-7-4-4-7 7z"/><path d="m2 22 2.5-2.5"/><path d="m16 4 4 4"/><path d="m15 5 4 4"/></svg>',
    web: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>',
    compta: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20"/></svg>',
    ia: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M12 2a4 4 0 0 1 4 4v2a4 4 0 0 1-8 0V6a4 4 0 0 1 4-4z"/><path d="M16 14h.01"/><path d="M8 14h.01"/><rect x="4" y="12" width="16" height="8" rx="4"/></svg>',
    bdc: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="12" cy="12" r="10"/><path d="m16 10-6 6"/><path d="m10 10 0 6"/></svg>'
  };

  // --- Colors by category ---
  var COLORS = {
    langue: '#10ABAF',
    bureau: '#1E3442',
    graphisme: '#ec4899',
    web: '#6366f1',
    compta: '#E86328',
    ia: '#7c3aed',
    bdc: '#d97706'
  };

  // --- Full catalogue ---
  var FORMATIONS = [
    { t: "Anglais Niveau 1 (A1-A2)", c: "langue", k: "anglais d\u00e9butant a1 a2" },
    { t: "Anglais Niveau 2 (B1-B2)", c: "langue", k: "anglais interm\u00e9diaire b1 b2 professionnel" },
    { t: "Anglais Niveau 3 (C1-C2)", c: "langue", k: "anglais avanc\u00e9 c1 c2 n\u00e9gociation" },
    { t: "Anglais Complet (A1-C2)", c: "langue", k: "anglais complet vtest certification" },
    { t: "Fran\u00e7ais Niveau 1 (A1-A2)", c: "langue", k: "fran\u00e7ais fle d\u00e9butant a1 a2" },
    { t: "Fran\u00e7ais Niveau 2 (B1-B2)", c: "langue", k: "fran\u00e7ais fle interm\u00e9diaire b1 b2" },
    { t: "Fran\u00e7ais Niveau 3 (C1-C2)", c: "langue", k: "fran\u00e7ais fle avanc\u00e9 c1 c2" },
    { t: "Fran\u00e7ais Complet (A1-C2)", c: "langue", k: "fran\u00e7ais fle complet" },
    { t: "Bases Informatiques", c: "bureau", k: "bases informatique windows fichiers" },
    { t: "Excel Complet CPF", c: "bureau", k: "excel formules tableaux crois\u00e9s vba certification eni" },
    { t: "Excel VBA Complet", c: "bureau", k: "excel vba macros automatisation" },
    { t: "Word Complet", c: "bureau", k: "word mise en page publipostage" },
    { t: "PowerPoint Complet", c: "bureau", k: "powerpoint pr\u00e9sentations slides" },
    { t: "Outlook Complet", c: "bureau", k: "outlook messagerie calendrier" },
    { t: "Pack Office Complet", c: "bureau", k: "pack office excel word powerpoint" },
    { t: "Power BI", c: "bureau", k: "power bi donn\u00e9es dashboard tableaux de bord" },
    { t: "Outils Collaboratifs Google", c: "bureau", k: "google docs sheets slides drive meet" },
    { t: "Microsoft 365", c: "bureau", k: "microsoft 365 teams sharepoint onedrive" },
    { t: "Photoshop", c: "graphisme", k: "photoshop retouche photo adobe" },
    { t: "Illustrator", c: "graphisme", k: "illustrator vectoriel logo adobe" },
    { t: "InDesign", c: "graphisme", k: "indesign mise en page brochure adobe" },
    { t: "Canva", c: "graphisme", k: "canva design visuel r\u00e9seaux sociaux" },
    { t: "Premi\u00e8re Pro CC", c: "graphisme", k: "premiere pro montage vid\u00e9o adobe" },
    { t: "After Effects", c: "graphisme", k: "after effects motion design animation" },
    { t: "SketchUp Pro", c: "graphisme", k: "sketchup 3d architecture maquette" },
    { t: "AutoCAD", c: "graphisme", k: "autocad dessin technique 2d 3d industriel" },
    { t: "Sites web avec WordPress", c: "web", k: "wordpress site vitrine cms seo" },
    { t: "E-commerce WooCommerce", c: "web", k: "woocommerce boutique en ligne ecommerce" },
    { t: "Marketing digital", c: "web", k: "marketing digital strat\u00e9gie r\u00e9seaux sociaux emailing" },
    { t: "R\u00e9seaux sociaux & Ads", c: "web", k: "facebook instagram linkedin publicit\u00e9 ads" },
    { t: "D\u00e9veloppeur Web", c: "web", k: "html css javascript d\u00e9veloppeur code" },
    { t: "SEO : r\u00e9f\u00e9rencement web", c: "web", k: "seo r\u00e9f\u00e9rencement naturel mots-cl\u00e9s google" },
    { t: "SEA : Google Ads", c: "web", k: "sea google ads publicit\u00e9 payante search" },
    { t: "Gestion de la paie avec Silae CPF", c: "compta", k: "silae paie dsn bulletin charges sociales cpf" },
    { t: "Gestion de la paie avec Ciel Paie", c: "compta", k: "ciel paie cotisations d\u00e9clarations sociales" },
    { t: "Secr\u00e9taire Assistant Comptable", c: "compta", k: "comptabilit\u00e9 rapprochements bancaires tva bilan" },
    { t: "Comptabilit\u00e9 G\u00e9n\u00e9rale", c: "compta", k: "comptabilit\u00e9 \u00e9critures bilan compte r\u00e9sultat" },
    { t: "Apprendre \u00e0 utiliser ChatGPT", c: "ia", k: "chatgpt prompt engineering ia intelligence artificielle" },
    { t: "Midjourney PRO \u2014 Photos & Vid\u00e9os IA", c: "ia", k: "midjourney images photos vid\u00e9os ia g\u00e9n\u00e9rative" },
    { t: "IA conversationnelle \u2014 Cycle de vente", c: "ia", k: "ia vente prospection closing certifiante" },
    { t: "Copilot pour Microsoft 365", c: "ia", k: "copilot microsoft 365 word excel powerpoint ia" },
    { t: "Vid\u00e9os avec l\u2019IA", c: "ia", k: "vid\u00e9o ia acad\u00e9mie cr\u00e9ation professionnelle" },
    { t: "IA G\u00e9n\u00e9rative \u2014 Contenus (26h)", c: "ia", k: "ia g\u00e9n\u00e9rative contenus r\u00e9dactionnels visuels certifiante inkrea" },
    { t: "IA Business Pro \u2014 OptimIA", c: "ia", k: "ia automatisation make optimia business" },
    { t: "CapCut \u2014 Montages vid\u00e9os IA", c: "ia", k: "capcut montage vid\u00e9o ia r\u00e9seaux sociaux tiktok" },
    { t: "Bilan de comp\u00e9tences \u2014 24h CPF", c: "bdc", k: "bilan comp\u00e9tences 24h cpf orientation projet professionnel" },
    { t: "Bilan de comp\u00e9tences \u2014 15h CPF", c: "bdc", k: "bilan comp\u00e9tences 15h cpf condens\u00e9 projet" }
  ];

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
    var regex = new RegExp('(' + query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + ')', 'gi');
    return text.replace(regex, '<mark>$1</mark>');
  }

  function renderResults() {
    var q = input.value.toLowerCase().trim();
    var results = FORMATIONS.filter(function(f) {
      return !q || f.t.toLowerCase().includes(q) || f.k.includes(q);
    });

    if (!results.length) {
      resultsBox.innerHTML = '';
      emptyBox.classList.add('vis');
      return;
    }

    emptyBox.classList.remove('vis');

    resultsBox.innerHTML = results.map(function(f, idx) {
      var col = COLORS[f.c];
      return '<a class="cmd-item' + (idx === sel ? ' sel' : '') + '" href="/inscription.html" data-i="' + idx + '">' +
        '<div class="cmd-item-icon" style="color:' + col + ';border-color:' + col + '22;background:' + col + '0a">' + ICONS[f.c] + '</div>' +
        '<div class="cmd-item-title">' + highlight(f.t, input.value) + '</div>' +
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
