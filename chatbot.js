(function() {
  'use strict';

  /* ═══ Assistant Switching Formation — « Orbe » (19/11/2026, choix Samuel) ═══
     Bulle vivante, sans émojis, champ de saisie en textarea : Chrome Android
     n'affiche plus sa barre clé / carte / position au-dessus du clavier
     (prouvé sur Samsung le 19/11/2026 ; un <input> l'affichait malgré
     autocomplete="off"). Ne pas revenir à un <input> pour les champs du chat. */

  /* ─── Constants ─── */
  var MAX_MESSAGES = 20;
  var STORAGE_KEY = 'sf-chat-messages';
  var STORAGE_COUNT_KEY = 'sf-chat-count';
  var PHONE = '06 95 18 50 57';
  var PHONE_HREF = 'tel:+33695185057';
  var WELCOME_TEXT = 'Bonjour ! Je suis l\'Assistant Switching Formation. Comment puis-je vous aider ?';
  var WELCOME_BUTTONS = ['Je cherche une formation', 'Question sur le financement', 'Demander un devis'];
  var WELCOME_ICONS = ['search', 'euro', 'doc'];
  var LIMIT_TEXT = 'Pour continuer, appelez-nous au <a href="' + PHONE_HREF + '">' + PHONE + '</a>';

  var VISITOR_STORAGE_KEY = 'sf-visitor-id';
  var CONV_STORAGE_KEY = 'sf-chat-conv-id';
  var visitorId = '';
  var conversationId = null;

  // Generate or retrieve visitor ID (persists across sessions via localStorage)
  try {
    visitorId = localStorage.getItem(VISITOR_STORAGE_KEY);
    if (!visitorId) {
      visitorId = 'v_' + Math.random().toString(36).substring(2, 10);
      localStorage.setItem(VISITOR_STORAGE_KEY, visitorId);
    }
  } catch(e) {
    visitorId = 'v_' + Math.random().toString(36).substring(2, 10);
  }

  // Retrieve conversation ID from session (resets on new tab/browser close)
  try {
    var storedConvId = sessionStorage.getItem(CONV_STORAGE_KEY);
    if (storedConvId) conversationId = parseInt(storedConvId, 10);
  } catch(e) {}

  var reduceMotion = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var isTouch = window.matchMedia && matchMedia('(hover: none)').matches;

  /* ─── Inject CSS ─── */
  var style = document.createElement('style');
  style.textContent = `
/* ── Orbe vivante ── */
.sfc-orb{--s:112px;position:relative;width:var(--s);height:var(--s);flex:none;border-radius:50%;isolation:isolate;animation:sfc-breath 5.5s ease-in-out infinite}
.sfc-orb-in{position:absolute;inset:0;border-radius:50%;overflow:hidden;
  background:radial-gradient(circle at 50% 55%,#F2FCFC 0%,#E3EEFF 55%,#ECE6FF 100%);
  box-shadow:inset 0 0 0 1px rgba(255,255,255,.65),inset 0 calc(var(--s)*-.12) calc(var(--s)*.22) rgba(59,130,246,.28),inset 0 calc(var(--s)*.06) calc(var(--s)*.14) rgba(255,255,255,.9);
  animation:sfc-wob 7s ease-in-out infinite}
.sfc-orb-in i{position:absolute;inset:-28%;border-radius:50%;will-change:transform}
.sfc-orb-in i:nth-child(1){background:radial-gradient(circle at 32% 36%,rgba(16,171,175,.95) 0,rgba(16,171,175,.55) 14%,rgba(16,171,175,0) 36%);animation:sfc-spin 6.5s linear infinite}
.sfc-orb-in i:nth-child(2){background:radial-gradient(circle at 68% 62%,rgba(59,130,246,.92) 0,rgba(59,130,246,.5) 15%,rgba(59,130,246,0) 38%);animation:sfc-spin 8.5s linear infinite reverse}
.sfc-orb-in i:nth-child(3){background:radial-gradient(circle at 58% 28%,rgba(139,92,246,.8) 0,rgba(139,92,246,.35) 14%,rgba(139,92,246,0) 34%);animation:sfc-spin 10.5s linear infinite}
.sfc-orb-in i:nth-child(4){background:radial-gradient(circle at 36% 72%,rgba(61,200,201,.85) 0,rgba(61,200,201,.3) 15%,rgba(61,200,201,0) 33%);animation:sfc-spin 12.5s linear infinite reverse}
.sfc-orb-in i:nth-child(5){background:radial-gradient(circle at 74% 34%,rgba(244,63,94,.38) 0,rgba(244,63,94,0) 26%);animation:sfc-spin 15s linear infinite}
.sfc-orb-in::after{content:"";position:absolute;inset:0;border-radius:50%;z-index:2;
  background:radial-gradient(circle at 33% 26%,rgba(255,255,255,.95) 0,rgba(255,255,255,.55) 9%,rgba(255,255,255,0) 26%),radial-gradient(circle at 70% 82%,rgba(255,255,255,.35) 0,rgba(255,255,255,0) 22%)}
.sfc-orb::before{content:"";position:absolute;inset:-34%;border-radius:50%;z-index:-1;
  background:radial-gradient(circle,rgba(16,171,175,.30) 0,rgba(59,130,246,.18) 38%,rgba(139,92,246,0) 66%);animation:sfc-halo 5.5s ease-in-out infinite}
.sfc-orb.sfc-sm{--s:30px;animation:none}
.sfc-orb.sfc-sm::before{inset:-22%;opacity:.55;animation:none}
.sfc-orb.sfc-xs{--s:22px;animation:none}
.sfc-orb.sfc-xs::before{display:none}
.sfc-ring{position:absolute;inset:-4px;border-radius:50%;z-index:3;opacity:0;transition:opacity .3s;
  background:conic-gradient(from 0deg,transparent 0 55%,#10ABAF 80%,#3B82F6 92%,transparent 100%);
  -webkit-mask:radial-gradient(farthest-side,transparent calc(100% - 2px),#000 calc(100% - 2px));mask:radial-gradient(farthest-side,transparent calc(100% - 2px),#000 calc(100% - 2px));
  animation:sfc-spin 1s linear infinite}
.sfc-orb.sfc-busy .sfc-ring{opacity:1}
.sfc-fly{position:fixed;z-index:10000;pointer-events:none;transform-origin:0 0;animation:none;transition:transform .62s cubic-bezier(.65,0,.25,1)}
@keyframes sfc-spin{to{transform:rotate(360deg)}}
@keyframes sfc-breath{0%,100%{transform:scale(1)}50%{transform:scale(1.045)}}
@keyframes sfc-wob{0%,100%{transform:scale(1,1)}25%{transform:scale(1.03,.97)}50%{transform:scale(.98,1.02)}75%{transform:scale(1.02,.98)}}
@keyframes sfc-halo{0%,100%{opacity:.55;transform:scale(.94)}50%{opacity:1;transform:scale(1.06)}}
@keyframes sfc-up{to{opacity:1;transform:none}}

/* ── Pastille d'ouverture ── */
.sf-chat-bubble{position:fixed;right:24px;bottom:calc(24px + env(safe-area-inset-bottom));z-index:9998;display:flex;align-items:center;gap:11px;
  padding:7px 20px 7px 7px;border:0;border-radius:999px;background:#fff;cursor:pointer;text-align:left;font:inherit;color:#0F172A;
  box-shadow:0 18px 40px -12px rgba(15,23,42,.38),0 0 0 1px rgba(15,23,42,.05);
  transition:transform .45s cubic-bezier(.16,1,.3,1),box-shadow .45s cubic-bezier(.16,1,.3,1),opacity .3s;animation:sfc-pillIn .8s cubic-bezier(.16,1,.3,1) .4s both}
.sf-chat-bubble:hover{transform:translateY(-3px);box-shadow:0 24px 48px -14px rgba(15,23,42,.42),0 0 0 1px rgba(15,23,42,.06)}
.sf-chat-bubble:active{transform:scale(.95);transition-duration:.12s}
.sf-chat-bubble .sfc-orb{--s:40px;animation:sfc-breath 4s ease-in-out infinite}
.sf-chat-bubble .sfc-orb::before{inset:-26%}
.sf-chat-pill-t{display:flex;flex-direction:column;gap:2px}
.sf-chat-pill-t b{font:600 14.5px/1.15 "Poppins",sans-serif;color:#0F172A}
.sf-chat-pill-t small{display:flex;align-items:center;gap:6px;font-family:"Almarai",sans-serif;font-size:11.5px;line-height:1.3;color:#64748B}
.sf-chat-pill-t small i{width:6px;height:6px;border-radius:50%;background:#22C55E;box-shadow:0 0 0 3px rgba(34,197,94,.16)}
.sf-chat-bubble.sf-chat-active{animation:none;opacity:0;transform:scale(.6);pointer-events:none}
@keyframes sfc-pillIn{from{opacity:0;transform:translateY(16px) scale(.9)}to{opacity:1;transform:none}}

/* ── Fenêtre ── */
.sf-chat-backdrop{display:none;position:fixed;inset:0;z-index:9996;background:rgba(15,23,42,.32);backdrop-filter:blur(10px) saturate(140%);-webkit-backdrop-filter:blur(10px) saturate(140%);opacity:0;pointer-events:none;transition:opacity .4s cubic-bezier(.16,1,.3,1)}
.sf-chat-backdrop.sf-chat-backdrop-visible{opacity:1;pointer-events:auto}
.sf-chat-panel{position:fixed;right:24px;bottom:calc(24px + env(safe-area-inset-bottom));z-index:9997;width:400px;height:min(660px,calc(100vh - 48px));
  display:flex;flex-direction:column;overflow:hidden;background:#fff;border-radius:28px;container-type:size;font-family:"Almarai",sans-serif;color:#1E293B;
  box-shadow:0 40px 90px -20px rgba(15,23,42,.38),0 0 0 1px rgba(15,23,42,.06);
  opacity:0;transform:translateY(18px) scale(.92);transform-origin:100% 100%;pointer-events:none;
  transition:opacity .32s cubic-bezier(.16,1,.3,1),transform .55s cubic-bezier(.16,1,.3,1)}
.sf-chat-panel.sf-chat-visible{opacity:1;transform:none;pointer-events:auto}
.sf-chat-panel *{box-sizing:border-box}

.sf-chat-header{position:relative;z-index:3;display:flex;align-items:center;gap:11px;padding:14px 14px 12px 18px;background:#fff;flex-shrink:0;transition:box-shadow .3s}
.sf-chat-header.sfc-sc{box-shadow:0 1px 0 rgba(15,23,42,.06),0 10px 24px -18px rgba(15,23,42,.35)}
.sf-chat-header .sfc-orb{transition:opacity .35s cubic-bezier(.16,1,.3,1),transform .55s cubic-bezier(.34,1.56,.64,1)}
.sf-chat-panel.sfc-welcome .sf-chat-header .sfc-orb{opacity:0;transform:scale(.4)}
.sf-chat-header-info{flex:1;min-width:0}
.sf-chat-header-title{font:600 15px/1.2 "Poppins",sans-serif;color:#0F172A;letter-spacing:-.01em;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.sf-chat-header-status{display:flex;align-items:center;gap:6px;margin-top:3px;font-size:12px;color:#64748B}
.sf-chat-header-dot{width:6px;height:6px;border-radius:50%;background:#22C55E;animation:sfc-dot 2.4s ease-in-out infinite}
@keyframes sfc-dot{0%,100%{box-shadow:0 0 0 0 rgba(34,197,94,.35)}50%{box-shadow:0 0 0 4px rgba(34,197,94,0)}}
.sf-chat-header-close{width:38px;height:38px;flex:none;border:0;border-radius:50%;background:#F3F5F8;display:grid;place-items:center;cursor:pointer;transition:background .2s,transform .2s}
.sf-chat-header-close:hover{background:#E8ECF1}.sf-chat-header-close:active{transform:scale(.9)}
.sf-chat-header-close svg{width:16px;height:16px;stroke:#475569;stroke-width:2;fill:none;stroke-linecap:round}

.sf-chat-messages{flex:1;min-height:0;overflow-y:auto;overscroll-behavior:contain;padding:6px 18px 18px;display:flex;flex-direction:column;gap:14px}
.sf-chat-messages::-webkit-scrollbar{width:0}

/* Accueil */
.sfc-hero{flex:1;display:flex;flex-direction:column;min-height:100%;padding-top:4px}
.sfc-hero-top{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:10px 6px 22px}
.sfc-hero .sfc-orb{margin-bottom:26px}
.sfc-h1{font:600 27px/1.18 "Poppins",sans-serif;color:#0F172A;letter-spacing:-.025em}
.sfc-h2{margin-top:4px;font:600 21px/1.28 "Poppins",sans-serif;letter-spacing:-.02em;
  background:linear-gradient(100deg,#0F172A 0%,#334155 40%,#10ABAF 62%,#3B82F6 80%,#334155 100%);background-size:240% 100%;
  -webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent;animation:sfc-h2In .9s cubic-bezier(.16,1,.3,1) .35s both,sfc-sheen 7s ease-in-out 1.6s infinite}
@keyframes sfc-h2In{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}
@keyframes sfc-sheen{0%,100%{background-position:0% 0}50%{background-position:100% 0}}
.sfc-lead{margin-top:10px;font-size:14px;line-height:1.5;color:#64748B}
.sfc-w{display:inline-block;opacity:0;filter:blur(6px);transform:translateY(8px);animation:sfc-wIn .7s cubic-bezier(.16,1,.3,1) forwards}
@keyframes sfc-wIn{to{opacity:1;filter:none;transform:none}}
.sfc-sug-h{padding:0 4px 8px;font:700 11px/1 "Almarai",sans-serif;letter-spacing:.14em;text-transform:uppercase;color:#94A3B8}
.sfc-sug{display:flex;flex-direction:column;gap:4px}
.sfc-s{display:flex;align-items:center;gap:13px;width:100%;padding:9px 12px 9px 9px;border:0;border-radius:18px;background:transparent;cursor:pointer;text-align:left;font:600 15px/1.25 "Poppins",sans-serif;color:#0F172A;letter-spacing:-.01em;
  opacity:0;transform:translateY(10px);animation:sfc-up .6s cubic-bezier(.16,1,.3,1) forwards;transition:background .25s}
.sfc-s:hover{background:#F3F5F8}
.sfc-s:active{transform:scale(.98)}
.sfc-s-ic{width:40px;height:40px;flex:none;border-radius:13px;display:grid;place-items:center;background:#F3F5F8;transition:background .3s cubic-bezier(.16,1,.3,1),transform .3s cubic-bezier(.16,1,.3,1)}
.sfc-s-ic svg{width:19px;height:19px;stroke:#0F172A;stroke-width:1.7;fill:none;stroke-linecap:round;stroke-linejoin:round;transition:stroke .3s}
.sfc-s:hover .sfc-s-ic{background:#0F172A;transform:rotate(-6deg)}
.sfc-s:hover .sfc-s-ic svg{stroke:#fff}
.sfc-s-lb{flex:1}
.sfc-s-ar{width:16px;height:16px;flex:none;stroke:#94A3B8;stroke-width:2;fill:none;stroke-linecap:round;stroke-linejoin:round;transition:transform .3s cubic-bezier(.16,1,.3,1),stroke .3s}
.sfc-s:hover .sfc-s-ar{transform:translateX(3px);stroke:#0F172A}

/* Messages */
.sf-chat-msg-bot{max-width:94%;font-size:15px;line-height:1.62;color:#1E293B;word-wrap:break-word}
.sf-chat-msg-bot strong,.sf-chat-msg-bot b{color:#0F172A;font-weight:700}
.sf-chat-msg-bot a{color:#0F172A;font-weight:700;text-decoration:underline;text-underline-offset:3px}
.sf-chat-msg-bot .sfc-tw{display:inline;opacity:0;animation:sfc-twIn .45s cubic-bezier(.16,1,.3,1) forwards}
@keyframes sfc-twIn{from{opacity:0;filter:blur(3px)}to{opacity:1;filter:none}}
.sf-chat-msg-user{align-self:flex-end;max-width:84%;padding:11px 16px;border-radius:22px 22px 7px 22px;background:#F3F5F8;color:#0F172A;font-size:15px;line-height:1.5;word-wrap:break-word;white-space:pre-wrap;
  transform-origin:100% 100%;animation:sfc-bubIn .5s cubic-bezier(.34,1.56,.64,1) both}
@keyframes sfc-bubIn{from{opacity:0;transform:translateY(10px) scale(.88)}to{opacity:1;transform:none}}
.sf-chat-error{color:#B91C1C}
.sf-chat-buttons{display:flex;flex-wrap:wrap;gap:8px;margin-top:-2px}
.sf-chat-btn{border:0;border-radius:999px;padding:10px 15px;background:#fff;color:#0F172A;font:600 14px/1.2 "Poppins",sans-serif;cursor:pointer;letter-spacing:-.005em;text-align:left;
  box-shadow:0 0 0 1px rgba(15,23,42,.12),0 4px 10px -8px rgba(15,23,42,.3);opacity:0;transform:translateY(8px) scale(.96);animation:sfc-up .5s cubic-bezier(.16,1,.3,1) forwards;transition:background .2s,color .2s,box-shadow .2s}
.sf-chat-btn:hover{background:#0F172A;color:#fff;box-shadow:0 0 0 1px #0F172A,0 8px 18px -8px rgba(15,23,42,.5)}
.sf-chat-btn:active{transform:scale(.95)}
.sf-chat-typing{display:flex;align-items:center;gap:10px;font-size:13.5px;opacity:0;transform:translateY(6px);animation:sfc-up .4s cubic-bezier(.16,1,.3,1) both}
.sfc-typing-t{font-weight:700;background:linear-gradient(90deg,#94A3B8 0%,#94A3B8 35%,#0F172A 50%,#94A3B8 65%,#94A3B8 100%);background-size:250% 100%;-webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent;animation:sfc-shim 1.6s linear infinite}
@keyframes sfc-shim{from{background-position:100% 0}to{background-position:-50% 0}}
.sf-chat-inline-input{padding:14px;border-radius:20px;background:#fff;box-shadow:0 0 0 1px rgba(15,23,42,.09),0 12px 28px -18px rgba(15,23,42,.35);opacity:0;transform:translateY(8px);animation:sfc-up .5s cubic-bezier(.16,1,.3,1) forwards}
.sf-chat-inline-label{display:block;margin:0 0 9px 2px;font:600 13px/1.2 "Poppins",sans-serif;color:#0F172A}
.sf-chat-inline-row{display:flex;gap:8px;align-items:center}
.sf-chat-inline-field{flex:1;min-width:0;height:46px;padding:12px 14px;border:0;border-radius:14px;background:#F3F5F8;font:400 16px/22px "Almarai",sans-serif;color:#0F172A;outline:none;resize:none;overflow:hidden;white-space:nowrap;transition:box-shadow .2s,background .2s}
.sf-chat-inline-field:focus{background:#fff;box-shadow:0 0 0 1.5px #0F172A}
.sf-chat-inline-field::placeholder{color:#94A3B8}
.sf-chat-success{display:flex;align-items:center;gap:12px;padding:14px 16px;border-radius:20px;background:linear-gradient(135deg,#ECFDF5,#F0FDFA);color:#065F46;font:600 14px/1.35 "Poppins",sans-serif;animation:sfc-bubIn .6s cubic-bezier(.34,1.56,.64,1) both}
.sf-chat-success svg{width:30px;height:30px;flex:none}
.sf-chat-success circle{fill:#10B981}
.sf-chat-success path{fill:none;stroke:#fff;stroke-width:2.6;stroke-linecap:round;stroke-linejoin:round;stroke-dasharray:20;stroke-dashoffset:20;animation:sfc-draw .5s cubic-bezier(.16,1,.3,1) .35s forwards}
@keyframes sfc-draw{to{stroke-dashoffset:0}}

/* Saisie */
.sf-chat-input-area{position:relative;z-index:3;flex-shrink:0;padding:8px 14px 14px;background:#fff}
.sf-chat-input-area::before{content:"";position:absolute;left:0;right:0;top:-22px;height:22px;background:linear-gradient(rgba(255,255,255,0),#fff);pointer-events:none}
@property --sfc-a{syntax:"<angle>";initial-value:0deg;inherits:false}
.sfc-box{position:relative;display:flex;align-items:flex-end;gap:8px;padding:7px 7px 7px 16px;border-radius:26px;border:1.5px solid transparent;
  background:linear-gradient(#fff,#fff) padding-box,linear-gradient(rgba(15,23,42,.11),rgba(15,23,42,.11)) border-box;
  box-shadow:0 10px 30px -18px rgba(15,23,42,.4);transition:box-shadow .4s cubic-bezier(.16,1,.3,1)}
.sfc-box.sfc-focus{background:linear-gradient(#fff,#fff) padding-box,conic-gradient(from var(--sfc-a),#10ABAF,#3B82F6,#8B5CF6,#3DC8C9,#10ABAF) border-box;
  animation:sfc-ringturn 3.2s linear infinite;box-shadow:0 14px 34px -16px rgba(59,130,246,.45),0 0 0 4px rgba(16,171,175,.07)}
@keyframes sfc-ringturn{to{--sfc-a:360deg}}
.sf-chat-input{flex:1;min-width:0;max-height:120px;padding:9px 0;border:0;outline:none;resize:none;background:transparent;font:400 16px/22px "Almarai",sans-serif;color:#0F172A;overflow-y:auto}
.sf-chat-input::placeholder{color:#94A3B8}
.sf-chat-send,.sf-chat-inline-submit{width:38px;height:38px;flex:none;border:0;border-radius:50%;display:grid;place-items:center;cursor:pointer;background:#E2E8F0;transition:background .3s cubic-bezier(.16,1,.3,1),transform .35s cubic-bezier(.34,1.56,.64,1)}
.sf-chat-send svg,.sf-chat-inline-submit svg{width:18px;height:18px;stroke:#fff;stroke-width:2.4;fill:none;stroke-linecap:round;stroke-linejoin:round}
.sf-chat-send.sf-chat-send-active,.sf-chat-inline-submit:not(:disabled){background:#0F172A}
.sf-chat-send.sf-chat-send-active{transform:scale(1.04)}
.sf-chat-send:active,.sf-chat-inline-submit:not(:disabled):active{transform:scale(.88)}
.sf-chat-inline-submit:disabled{cursor:default}

/* Fenêtre courte (clavier ouvert) : l'accueil se resserre */
@container (max-height:560px){
  .sfc-hero .sfc-orb{--s:68px;margin-bottom:14px}
  .sfc-h1{font-size:22px}.sfc-h2{font-size:17px}.sfc-lead{display:none}
  .sfc-hero-top{padding:4px 6px 12px}
}
@container (max-height:430px){.sfc-hero-top{display:none}}

/* Téléphone */
@media(max-width:480px){
  .sf-chat-backdrop{display:block}
  .sf-chat-bubble{right:16px;bottom:calc(18px + env(safe-area-inset-bottom))}
  .sf-chat-panel{left:8px;right:8px;width:auto;bottom:calc(8px + env(safe-area-inset-bottom));height:calc(100dvh - 16px - env(safe-area-inset-bottom));max-height:none;transform-origin:85% 100%}
  .sf-chat-messages{padding:4px 16px 16px}
  .sf-chat-input-area{padding:8px 10px max(10px,env(safe-area-inset-bottom))}
}

@media(prefers-reduced-motion:reduce){
  .sfc-orb,.sfc-orb-in,.sfc-orb-in i,.sfc-orb::before,.sfc-h2,.sf-chat-header-dot,.sf-chat-bubble{animation:none!important}
  .sfc-w,.sfc-s,.sf-chat-btn,.sf-chat-msg-bot .sfc-tw,.sf-chat-inline-input,.sf-chat-typing{animation:none!important;opacity:1!important;filter:none!important;transform:none!important}
  .sfc-box.sfc-focus{animation:none}
}
`;
  document.head.appendChild(style);

  /* ─── State ─── */
  var isOpen = false;
  var isSending = false;
  var messages = [];
  var userCount = 0;

  // Restore session
  try {
    var stored = sessionStorage.getItem(STORAGE_KEY);
    if (stored) messages = JSON.parse(stored);
    var cnt = sessionStorage.getItem(STORAGE_COUNT_KEY);
    if (cnt) userCount = parseInt(cnt, 10) || 0;
  } catch(e) {}
  if (!Array.isArray(messages)) messages = [];

  /* ─── DOM ─── */

  // Remove existing .chat bubble
  var existingChat = document.querySelector('.chat');
  if (existingChat) existingChat.remove();

  var ORB_INNER = '<span class="sfc-orb-in"><i></i><i></i><i></i><i></i><i></i></span><span class="sfc-ring"></span>';
  var ICONS = {
    search: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="6.5"/><path d="m20 20-4.2-4.2"/></svg>',
    euro: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M17.5 6.6A7 7 0 1 0 17.5 17.4"/><path d="M4.5 10.2h9M4.5 13.8h9"/></svg>',
    doc: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5M9 13h6M9 17h4"/></svg>',
    arrow: '<svg class="sfc-s-ar" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>',
    up: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 19V5M5 12l7-7 7 7"/></svg>'
  };

  // Bubble
  var bubble = document.createElement('button');
  bubble.className = 'sf-chat-bubble';
  bubble.setAttribute('aria-label', 'Ouvrir le chat');
  bubble.innerHTML = '<span class="sfc-orb">' + ORB_INNER + '</span><span class="sf-chat-pill-t"><b>Une question ?</b><small><i></i>Sophie vous répond</small></span>';

  // Panel
  var panel = document.createElement('div');
  panel.className = 'sf-chat-panel';
  panel.setAttribute('role', 'dialog');
  panel.setAttribute('aria-label', 'Assistant Switching Formation');
  panel.innerHTML = '\
<div class="sf-chat-header">\
  <span class="sfc-orb sfc-sm">' + ORB_INNER + '</span>\
  <div class="sf-chat-header-info">\
    <div class="sf-chat-header-title">Assistant Switching Formation</div>\
    <div class="sf-chat-header-status"><span class="sf-chat-header-dot"></span>En ligne</div>\
  </div>\
  <button class="sf-chat-header-close" aria-label="Fermer"><svg viewBox="0 0 24 24"><path d="M18 6 6 18M6 6l12 12"/></svg></button>\
</div>\
<div class="sf-chat-messages" aria-live="polite"></div>\
<div class="sf-chat-input-area">\
  <div class="sfc-box">\
    <textarea class="sf-chat-input" name="sf-chat-message" rows="1" placeholder="Votre message…" aria-label="Votre message" autocomplete="off" autocapitalize="sentences" enterkeyhint="send" data-1p-ignore="true" data-lpignore="true"></textarea>\
    <button class="sf-chat-send" aria-label="Envoyer">' + ICONS.up + '</button>\
  </div>\
</div>';

  // Backdrop (for mobile modal effect)
  var backdrop = document.createElement('div');
  backdrop.className = 'sf-chat-backdrop';
  document.body.appendChild(backdrop);

  document.body.appendChild(panel);
  document.body.appendChild(bubble);

  var messagesEl = panel.querySelector('.sf-chat-messages');
  var inputEl = panel.querySelector('.sf-chat-input');
  var inputBox = panel.querySelector('.sfc-box');
  var sendBtn = panel.querySelector('.sf-chat-send');
  var closeBtn = panel.querySelector('.sf-chat-header-close');
  var headerEl = panel.querySelector('.sf-chat-header');
  var headerOrb = headerEl.querySelector('.sfc-orb');

  // The chatbot never needs passwords, cards or address suggestions. Keep this
  // policy on both the main composer and fields injected later in the dialogue.
  function disableChatAutofill(field) {
    if (!field || !field.matches || !field.matches('input,textarea,[contenteditable="true"]')) return;
    field.setAttribute('autocomplete', 'off');
    field.setAttribute('data-1p-ignore', 'true');
    field.setAttribute('data-lpignore', 'true');
  }
  function disableChatAutofillIn(root) {
    if (!root) return;
    disableChatAutofill(root);
    if (root.querySelectorAll) root.querySelectorAll('input,textarea,[contenteditable="true"]').forEach(disableChatAutofill);
  }
  disableChatAutofillIn(panel);
  new MutationObserver(function(records) {
    records.forEach(function(record) {
      record.addedNodes.forEach(function(node) { disableChatAutofillIn(node); });
    });
  }).observe(panel, { childList: true, subtree: true });

  // ── Visual Viewport handling for mobile keyboard ──
  // When the keyboard opens on mobile, resize the panel to fit the visible area
  function adjustForKeyboard() {
    if (window.innerWidth > 480 || !isOpen) return;
    var vv = window.visualViewport;
    if (!vv) return;
    var keyboardHeight = window.innerHeight - vv.height;
    if (keyboardHeight > 50) {
      var availableHeight = vv.height - 16;
      panel.style.height = availableHeight + 'px';
      panel.style.maxHeight = availableHeight + 'px';
      panel.style.bottom = (keyboardHeight + 8) + 'px';
    } else {
      panel.style.height = '';
      panel.style.maxHeight = '';
      panel.style.bottom = '';
    }
    scrollToBottom();
  }
  if (window.visualViewport) {
    window.visualViewport.addEventListener('resize', adjustForKeyboard);
    window.visualViewport.addEventListener('scroll', adjustForKeyboard);
  }

  /* ─── Helpers ─── */

  // Samuel, 19/11/2026 : aucun émoji dans l'assistant.
  function stripEmoji(text) {
    return String(text || '')
      .replace(/[ \t]*[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{2B00}-\u{2BFF}\u{FE0F}\u{200D}\u{20E3}]+/gu, '')
      .replace(/^[ \t]+/gm, '')
      .replace(/[ \t]{2,}/g, ' ')
      .trim();
  }

  function formatMarkdown(text) {
    // Convert markdown-style formatting to HTML
    return text
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.+?)\*/g, '<em>$1</em>')
      .replace(/__(.+?)__/g, '<strong>$1</strong>')
      .replace(/_(.+?)_/g, '<em>$1</em>')
      .replace(/\n/g, '<br>');
  }

  function saveSession() {
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
      sessionStorage.setItem(STORAGE_COUNT_KEY, String(userCount));
    } catch(e) {}
  }

  function scrollToBottom() {
    requestAnimationFrame(function() {
      messagesEl.scrollTop = messagesEl.scrollHeight;
    });
  }

  function stripMarkers(text) {
    return text
      .replace(/\[BUTTONS?:\s*[^\]]*\]/gi, '')
      .replace(/\[SUBMIT:\s*[^\]]*\]/gi, '')
      .replace(/\[INPUT:\s*[^\]]*\]/gi, '')
      .trim();
  }

  function isWelcome(msg) {
    if (!msg || msg.role !== 'bot') return false;
    return stripEmoji(msg.text) === stripEmoji(WELCOME_TEXT);
  }

  function inWelcomeMode() {
    return messages.length === 1 && isWelcome(messages[0]);
  }

  // Reveal the bot answer word by word (returns the duration in seconds)
  function typeIn(el) {
    if (reduceMotion) return 0;
    var nodes = [];
    (function walk(node) {
      Array.prototype.slice.call(node.childNodes).forEach(function(c) {
        if (c.nodeType === 3) nodes.push(c); else walk(c);
      });
    })(el);
    var total = 0;
    nodes.forEach(function(t) { total += t.nodeValue.split(/\s+/).length; });
    var step = Math.min(0.045, 1.1 / Math.max(total, 1));
    var n = 0;
    nodes.forEach(function(t) {
      var frag = document.createDocumentFragment();
      t.nodeValue.split(/(\s+)/).forEach(function(part) {
        if (!part) return;
        if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(part)); return; }
        var s = document.createElement('span');
        s.className = 'sfc-tw';
        s.style.animationDelay = (n++ * step).toFixed(3) + 's';
        s.textContent = part;
        frag.appendChild(s);
      });
      t.parentNode.replaceChild(frag, t);
    });
    return n * step;
  }

  function renderBotBubble(text, animate) {
    var div = document.createElement('div');
    div.className = 'sf-chat-msg sf-chat-msg-bot';
    div.innerHTML = formatMarkdown(stripEmoji(stripMarkers(text)));
    div._sfcDur = animate ? typeIn(div) : 0;
    return div;
  }

  function renderUserBubble(text) {
    var div = document.createElement('div');
    div.className = 'sf-chat-msg sf-chat-msg-user';
    div.textContent = text;
    return div;
  }

  function renderButtons(buttons, delay) {
    var wrap = document.createElement('div');
    wrap.className = 'sf-chat-buttons';
    buttons.forEach(function(raw, i) {
      var label = stripEmoji(raw);
      if (!label) return;
      var btn = document.createElement('button');
      btn.className = 'sf-chat-btn';
      btn.textContent = label;
      btn.style.animationDelay = ((delay || 0) + 0.05 + i * 0.05).toFixed(2) + 's';
      btn.addEventListener('click', function() {
        wrap.remove();
        sendMessage(label);
      });
      wrap.appendChild(btn);
    });
    return wrap;
  }

  function renderInputField(label, delay) {
    label = stripEmoji(label);
    var low = label.toLowerCase();
    var isMail = low.indexOf('email') !== -1 || low.indexOf('e-mail') !== -1 || low.indexOf('mail') !== -1;
    var isTel = low.indexOf('tel') !== -1 || low.indexOf('tél') !== -1 || low.indexOf('phone') !== -1 || low.indexOf('numero') !== -1 || low.indexOf('numéro') !== -1;
    var wrap = document.createElement('div');
    wrap.className = 'sf-chat-inline-input';
    wrap.style.animationDelay = (delay || 0).toFixed(2) + 's';
    var lbl = document.createElement('label');
    lbl.className = 'sf-chat-inline-label';
    lbl.textContent = label;
    var row = document.createElement('div');
    row.className = 'sf-chat-inline-row';
    // textarea d'une ligne : pas de barre clé / carte / position de Chrome Android
    var inp = document.createElement('textarea');
    inp.className = 'sf-chat-inline-field';
    inp.rows = 1;
    inp.placeholder = label;
    inp.setAttribute('inputmode', isMail ? 'email' : (isTel ? 'tel' : 'text'));
    inp.setAttribute('enterkeyhint', 'send');
    inp.setAttribute('autocapitalize', isMail || isTel ? 'none' : 'words');
    inp.setAttribute('aria-label', label);
    if (isMail || isTel) inp.spellcheck = false;
    disableChatAutofill(inp);
    var btn = document.createElement('button');
    btn.className = 'sf-chat-inline-submit';
    btn.setAttribute('aria-label', 'Valider');
    btn.innerHTML = ICONS.up;
    btn.disabled = true;
    inp.addEventListener('input', function() {
      if (/\n/.test(inp.value)) inp.value = inp.value.replace(/\n/g, ' ');
      btn.disabled = !inp.value.trim();
    });
    function submit() {
      var val = inp.value.trim();
      if (!val) return;
      wrap.remove();
      sendMessage(val);
    }
    inp.addEventListener('keydown', function(e) {
      if (e.key === 'Enter') { e.preventDefault(); submit(); }
    });
    btn.addEventListener('pointerdown', function(e) { if (document.activeElement === inp) e.preventDefault(); });
    btn.addEventListener('click', submit);
    row.appendChild(inp);
    row.appendChild(btn);
    wrap.appendChild(lbl);
    wrap.appendChild(row);
    if (!isTouch) setTimeout(function() { inp.focus(); }, (delay || 0) * 1000 + 150);
    return wrap;
  }

  function renderSuccess(text, delay) {
    var div = document.createElement('div');
    div.className = 'sf-chat-success';
    if (delay) div.style.animationDelay = delay.toFixed(2) + 's';
    div.innerHTML = '<svg viewBox="0 0 30 30" aria-hidden="true"><circle cx="15" cy="15" r="15"/><path d="M9.5 15.5l3.6 3.6 7.4-7.6"/></svg><span>' + text + '</span>';
    return div;
  }

  function showTyping() {
    var div = document.createElement('div');
    div.className = 'sf-chat-typing';
    div.id = 'sf-chat-typing';
    div.innerHTML = '<span class="sfc-orb sfc-xs sfc-busy">' + ORB_INNER + '</span><span class="sfc-typing-t">Sophie réfléchit…</span>';
    messagesEl.appendChild(div);
    headerOrb.classList.add('sfc-busy');
    scrollToBottom();
    return div;
  }

  function removeTyping() {
    var t = document.getElementById('sf-chat-typing');
    if (t) t.remove();
    headerOrb.classList.remove('sfc-busy');
  }

  /* ─── Accueil ─── */

  function words(txt, d0) {
    return txt.split(' ').map(function(w, i) {
      return '<span class="sfc-w" style="animation-delay:' + (d0 + i * 0.06).toFixed(2) + 's">' + w + '</span>';
    }).join(' ');
  }

  function renderWelcome() {
    panel.classList.add('sfc-welcome');
    var hero = document.createElement('div');
    hero.className = 'sfc-hero';
    var sug = WELCOME_BUTTONS.map(function(label, i) {
      return '<button class="sfc-s" style="animation-delay:' + (0.75 + i * 0.08).toFixed(2) + 's" data-t="' + label + '"><span class="sfc-s-ic">' + ICONS[WELCOME_ICONS[i]] + '</span><span class="sfc-s-lb">' + label + '</span>' + ICONS.arrow + '</button>';
    }).join('');
    hero.innerHTML = '<div class="sfc-hero-top"><span class="sfc-orb sfc-big">' + ORB_INNER + '</span>'
      + '<div class="sfc-h1">' + words('Bonjour !', 0.15) + '</div>'
      + '<div class="sfc-h2">Comment puis-je vous aider ?</div>'
      + '<p class="sfc-lead">' + words('Je suis l’Assistant Switching Formation.', 0.55) + '</p></div>'
      + '<div class="sfc-sug-h">Suggestions</div><div class="sfc-sug">' + sug + '</div>';
    messagesEl.appendChild(hero);
    hero.querySelectorAll('.sfc-s').forEach(function(b) {
      b.addEventListener('click', function() { sendMessage(b.getAttribute('data-t')); });
    });
  }

  // The big orb flies from the welcome screen into the header
  function leaveWelcome(cb) {
    if (!panel.classList.contains('sfc-welcome')) { cb(); return; }
    var big = messagesEl.querySelector('.sfc-big');
    var hero = messagesEl.querySelector('.sfc-hero');
    var visible = big && big.getBoundingClientRect().width > 20 && isOpen;
    if (reduceMotion || !visible) {
      panel.classList.remove('sfc-welcome');
      messagesEl.innerHTML = '';
      cb();
      return;
    }
    var a = big.getBoundingClientRect();
    var fly = document.createElement('span');
    fly.className = 'sfc-orb sfc-fly';
    fly.innerHTML = ORB_INNER;
    fly.style.cssText = 'left:' + a.left + 'px;top:' + a.top + 'px;--s:' + a.width + 'px;';
    document.body.appendChild(fly);
    big.style.visibility = 'hidden';
    hero.style.transition = 'opacity .3s';
    hero.style.opacity = '0';
    headerOrb.style.transition = 'none';
    headerOrb.style.opacity = '0';
    panel.classList.remove('sfc-welcome');
    requestAnimationFrame(function() {
      var b = headerOrb.getBoundingClientRect();
      fly.style.transform = 'translate(' + (b.left - a.left) + 'px,' + (b.top - a.top) + 'px) scale(' + (b.width / a.width) + ')';
      setTimeout(function() { messagesEl.innerHTML = ''; cb(); }, 260);
      setTimeout(function() {
        headerOrb.style.opacity = '';
        fly.remove();
        setTimeout(function() { headerOrb.style.transition = ''; }, 50);
      }, 640);
    });
  }

  function renderAllMessages() {
    messagesEl.innerHTML = '';
    if (inWelcomeMode()) { renderWelcome(); return; }
    panel.classList.remove('sfc-welcome');
    messages.forEach(function(msg, i) {
      var last = i === messages.length - 1;
      if (msg.role === 'bot') {
        if (i === 0 && isWelcome(msg)) return;
        messagesEl.appendChild(renderBotBubble(msg.text, false));
        if (last && msg.buttons && msg.buttons.length) {
          messagesEl.appendChild(renderButtons(msg.buttons, 0));
        }
        if (last && msg.input) {
          messagesEl.appendChild(renderInputField(msg.input, 0));
        }
        if (msg.success) {
          messagesEl.appendChild(renderSuccess(msg.success));
        }
      } else {
        messagesEl.appendChild(renderUserBubble(msg.text));
      }
    });
    scrollToBottom();
  }

  /* ─── Open / Close ─── */

  function togglePanel() {
    isOpen = !isOpen;
    if (isOpen) {
      panel.classList.add('sf-chat-visible');
      bubble.classList.add('sf-chat-active');
      backdrop.classList.add('sf-chat-backdrop-visible');
      if (messages.length === 0) {
        // Show welcome
        messages.push({ role: 'bot', text: WELCOME_TEXT, buttons: WELCOME_BUTTONS });
        saveSession();
      }
      renderAllMessages();
      // Sur téléphone, on montre d'abord l'accueil sans ouvrir le clavier
      if (!isTouch) setTimeout(function() { inputEl.focus(); }, 350);
    } else {
      panel.classList.remove('sf-chat-visible');
      bubble.classList.remove('sf-chat-active');
      backdrop.classList.remove('sf-chat-backdrop-visible');
      inputEl.blur();
      // Reset keyboard adjustments
      panel.style.height = '';
      panel.style.maxHeight = '';
      panel.style.bottom = '';
    }
  }

  bubble.addEventListener('click', togglePanel);
  closeBtn.addEventListener('click', function(e) {
    e.stopPropagation();
    if (isOpen) togglePanel();
  });
  backdrop.addEventListener('click', function() {
    if (isOpen) togglePanel();
  });

  /* ─── Input ─── */

  function autoGrow() {
    inputEl.style.height = 'auto';
    inputEl.style.height = Math.min(inputEl.scrollHeight, 120) + 'px';
  }
  function updateSend() {
    if (inputEl.value.trim()) sendBtn.classList.add('sf-chat-send-active');
    else sendBtn.classList.remove('sf-chat-send-active');
  }

  inputEl.addEventListener('input', function() { autoGrow(); updateSend(); });
  inputEl.addEventListener('focus', function() { inputBox.classList.add('sfc-focus'); });
  inputEl.addEventListener('blur', function() { inputBox.classList.remove('sfc-focus'); });

  inputEl.addEventListener('keydown', function(e) {
    if (e.key === 'Enter' && !e.shiftKey && !e.isComposing) {
      e.preventDefault();
      var text = inputEl.value.trim();
      if (text && !isSending) sendMessage(text);
    }
  });

  // Le clavier reste ouvert quand on touche « Envoyer »
  sendBtn.addEventListener('pointerdown', function(e) {
    if (document.activeElement === inputEl) e.preventDefault();
  });
  sendBtn.addEventListener('click', function() {
    var text = inputEl.value.trim();
    if (text && !isSending) sendMessage(text);
  });

  messagesEl.addEventListener('scroll', function() {
    if (messagesEl.scrollTop > 4) headerEl.classList.add('sfc-sc');
    else headerEl.classList.remove('sfc-sc');
  });

  /* ─── Send Message ─── */

  function sendMessage(text) {
    if (isSending) return;

    // Check limit
    if (userCount >= MAX_MESSAGES) {
      leaveWelcome(function() {
        messages.push({ role: 'bot', text: LIMIT_TEXT, buttons: [] });
        saveSession();
        renderAllMessages();
      });
      return;
    }

    isSending = true;
    inputEl.value = '';
    autoGrow();
    updateSend();

    leaveWelcome(function() {
      // Add user message
      messages.push({ role: 'user', text: text });
      userCount++;
      saveSession();

      // Remove any leftover quick buttons and inline inputs
      var oldBtns = messagesEl.querySelectorAll('.sf-chat-buttons, .sf-chat-inline-input');
      oldBtns.forEach(function(b) { b.remove(); });

      messagesEl.appendChild(renderUserBubble(text));
      scrollToBottom();

      setTimeout(function() { if (isSending) showTyping(); }, 250);

      // Build conversation history for API
      var history = messages.filter(function(m) {
        return m.role === 'user' || m.role === 'bot';
      }).map(function(m) {
        return { role: m.role === 'bot' ? 'assistant' : 'user', content: m.text };
      });

      // Simple JSON fetch with timeout
      var abortCtrl = new AbortController();
      var fetchTimeout = setTimeout(function() { abortCtrl.abort(); }, 30000);

      fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: history,
          visitor_id: visitorId,
          conversation_id: conversationId,
          page: window.location.pathname.replace(/^\/|\.html$/g, '') || 'index'
        }),
        signal: abortCtrl.signal
      }).then(function(response) {
        clearTimeout(fetchTimeout);
        if (!response.ok) {
          return response.json().then(function(body) {
            throw new Error(body.details || body.error || 'HTTP ' + response.status);
          }).catch(function() { throw new Error('HTTP ' + response.status); });
        }
        return response.json();
      }).then(function(data) {
        isSending = false;
        removeTyping();

        var cleanText = stripMarkers(data.text || '');
        var botMsg = { role: 'bot', text: cleanText, buttons: data.buttons || [], success: '' };
        if (data.input) botMsg.input = data.input;
        messages.push(botMsg);

        var bubbleEl = renderBotBubble(cleanText, true);
        messagesEl.appendChild(bubbleEl);
        var dur = bubbleEl._sfcDur || 0;

        // Handle conversation_id from server
        if (data.conversation_id) {
          conversationId = data.conversation_id;
          try { sessionStorage.setItem(CONV_STORAGE_KEY, String(conversationId)); } catch(ex) {}
        }

        if (data.buttons && data.buttons.length) {
          messagesEl.appendChild(renderButtons(data.buttons, dur));
        }

        if (data.input) {
          messagesEl.appendChild(renderInputField(data.input, dur));
        }

        if (data.submit) {
          botMsg.success = 'Demande envoyée';
          messagesEl.appendChild(renderSuccess('Demande envoyée avec succès !', dur));
        }

        saveSession();
        scrollToBottom();
        setTimeout(scrollToBottom, dur * 1000 + 150);
      }).catch(function(err) {
        clearTimeout(fetchTimeout);
        isSending = false;
        removeTyping();
        var errText = err && err.name === 'AbortError'
          ? 'La réponse a pris trop de temps. Veuillez réessayer.'
          : 'Désolé, une erreur est survenue. Veuillez réessayer.';
        messages.push({ role: 'bot', text: errText, buttons: [] });
        saveSession();
        var errEl = renderBotBubble(errText, false);
        errEl.classList.add('sf-chat-error');
        messagesEl.appendChild(errEl);
        scrollToBottom();
      });
    });
  }

  /* ─── Escape key to close ─── */
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape' && isOpen) togglePanel();
  });

})();
