(function() {
  'use strict';

  /* ─── Constants ─── */
  var MAX_MESSAGES = 20;
  var STORAGE_KEY = 'sf-chat-messages';
  var STORAGE_COUNT_KEY = 'sf-chat-count';
  var PHONE = '06 95 18 50 57';
  var PHONE_HREF = 'tel:+33695185057';
  var WELCOME_TEXT = '\ud83d\udc4b Bonjour ! Je suis l\'Assistant Switching Formation. Comment puis-je vous aider ?';
  var WELCOME_BUTTONS = ['\ud83d\udcda Je cherche une formation', '\ud83d\udcb3 Question sur le financement', '\ud83d\udcdd Demander un devis'];
  var LIMIT_TEXT = 'Pour continuer, appelez-nous au <a href="' + PHONE_HREF + '" style="color:#10ABAF;font-weight:700;text-decoration:underline">' + PHONE + '</a>';

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

  /* ─── Inject CSS ─── */
  var style = document.createElement('style');
  style.textContent = '\
/* ── Chat Bubble — Dark Orb ── */\
.sf-chat-bubble{\
  position:fixed;bottom:28px;right:28px;z-index:9998;\
  width:64px;height:64px;border-radius:50%;\
  background:#0F0F1A;\
  display:flex;align-items:center;justify-content:center;\
  cursor:pointer;border:1px solid rgba(139,92,246,.2);\
  outline:none;-webkit-tap-highlight-color:transparent;\
  box-shadow:\
    0 0 24px rgba(139,92,246,.35),\
    0 0 48px rgba(99,102,241,.15),\
    0 4px 16px rgba(0,0,0,.4),\
    inset 0 0 20px rgba(139,92,246,.1);\
  transition:all .4s cubic-bezier(.16,1,.3,1);\
  animation:sf-orb-glow 4s ease-in-out infinite;\
}\
/* Rotating gradient ring */\
.sf-chat-bubble::before{\
  content:"";position:absolute;inset:-3px;border-radius:50%;\
  background:conic-gradient(from 0deg,#8B5CF6,#6366F1,#10ABAF,#8B5CF6);\
  animation:sf-orb-spin 8s linear infinite;\
  -webkit-mask:radial-gradient(farthest-side,transparent calc(100% - 2px),#fff calc(100% - 2px));\
  mask:radial-gradient(farthest-side,transparent calc(100% - 2px),#fff calc(100% - 2px));\
}\
/* Inner living light — plasma effect */\
.sf-chat-bubble::after{\
  content:"";position:absolute;inset:1px;border-radius:50%;z-index:0;\
  background:\
    radial-gradient(circle at 30% 25%,rgba(139,92,246,.8),transparent 45%),\
    radial-gradient(circle at 80% 75%,rgba(99,102,241,.7),transparent 40%),\
    radial-gradient(circle at 50% 50%,rgba(168,85,247,.3),transparent 55%);\
  background-size:300% 300%;\
  pointer-events:none;\
  animation:sf-orb-inner 6s ease-in-out infinite;\
  mix-blend-mode:screen;\
}\
.sf-chat-bubble.sf-chat-active::before,.sf-chat-bubble.sf-chat-active::after{animation:none;opacity:0;}\
.sf-chat-bubble:hover{\
  transform:scale(1.1);\
  border-color:rgba(139,92,246,.4);\
  box-shadow:\
    0 0 36px rgba(139,92,246,.5),\
    0 0 64px rgba(99,102,241,.25),\
    0 4px 20px rgba(0,0,0,.5),\
    inset 0 0 28px rgba(139,92,246,.15);\
}\
.sf-chat-bubble:active{transform:scale(.93);transition-duration:.1s;}\
.sf-chat-bubble svg{width:26px;height:26px;color:#fff;fill:none;stroke:currentColor;stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round;filter:drop-shadow(0 0 8px rgba(139,92,246,.6));position:relative;z-index:1;}\
.sf-chat-bubble.sf-chat-active{display:none;}\
@keyframes sf-orb-glow{\
  0%,100%{box-shadow:0 0 24px rgba(139,92,246,.35),0 0 48px rgba(99,102,241,.15),0 4px 16px rgba(0,0,0,.4),inset 0 0 20px rgba(139,92,246,.1);}\
  50%{box-shadow:0 0 32px rgba(139,92,246,.5),0 0 56px rgba(99,102,241,.25),0 4px 16px rgba(0,0,0,.4),inset 0 0 24px rgba(139,92,246,.15);}\
}\
@keyframes sf-orb-spin{\
  0%{transform:rotate(0deg);}100%{transform:rotate(360deg);}\
}\
@keyframes sf-orb-inner{\
  0%,100%{background-position:0% 0%;}\
  25%{background-position:100% 0%;}\
  50%{background-position:100% 100%;}\
  75%{background-position:0% 100%;}\
}\
\
/* ── Chat Panel ── */\
.sf-chat-panel{\
  position:fixed;bottom:96px;right:28px;z-index:9997;\
  width:380px;height:560px;\
  background:rgba(255,255,255,.85);\
  backdrop-filter:blur(20px) saturate(180%);\
  -webkit-backdrop-filter:blur(20px) saturate(180%);\
  border-radius:22px;\
  border:1px solid rgba(16,171,175,.08);\
  box-shadow:0 32px 64px -12px rgba(0,0,0,.1),0 0 0 1px rgba(16,171,175,.05);\
  display:flex;flex-direction:column;\
  overflow:hidden;\
  opacity:0;\
  transform:translateY(16px) scale(.96);\
  pointer-events:none;\
  transition:opacity .35s cubic-bezier(.16,1,.3,1),transform .35s cubic-bezier(.16,1,.3,1);\
}\
.sf-chat-panel.sf-chat-visible{\
  opacity:1;transform:translateY(0) scale(1);pointer-events:auto;\
  box-shadow:0 20px 60px -8px rgba(0,0,0,.15),0 0 0 1px rgba(16,171,175,.08);\
}\
\
/* ── Header ── */\
.sf-chat-header{\
  background:linear-gradient(135deg,#0E9599 0%,#10ABAF 50%,#3DC8C9 100%);\
  padding:18px 20px;\
  display:flex;align-items:center;gap:12px;\
  flex-shrink:0;\
  position:relative;\
  overflow:hidden;\
}\
.sf-chat-header::before{\
  content:"";position:absolute;inset:0;\
  background:url("data:image/svg+xml,%3Csvg viewBox=\'0 0 256 256\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'n\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23n)\' opacity=\'0.04\'/%3E%3C/svg%3E");\
  opacity:.35;pointer-events:none;\
}\
.sf-chat-header::after{\
  content:"";position:absolute;inset:0;\
  background:\
    radial-gradient(ellipse 120px 120px at 15% 30%,rgba(255,255,255,.15) 0%,transparent 70%),\
    radial-gradient(ellipse 80px 80px at 85% 60%,rgba(255,255,255,.1) 0%,transparent 70%);\
  pointer-events:none;\
}\
.sf-chat-header-avatar{\
  width:40px;height:40px;border-radius:12px;\
  background:rgba(255,255,255,.18);\
  backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);\
  border:1px solid rgba(255,255,255,.25);\
  display:flex;align-items:center;justify-content:center;\
  flex-shrink:0;position:relative;z-index:2;\
}\
.sf-chat-header-avatar svg{width:22px;height:22px;color:#fff;fill:none;stroke:currentColor;stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round;}\
.sf-chat-header-info{flex:1;min-width:0;position:relative;z-index:2;}\
.sf-chat-header-title{\
  font-family:"Poppins",sans-serif;font-weight:700;font-size:14px;\
  color:#fff;letter-spacing:-0.01em;line-height:1.3;\
}\
.sf-chat-header-status{\
  font-family:"Almarai",sans-serif;font-size:11px;font-weight:500;\
  color:rgba(255,255,255,.8);margin-top:2px;\
  display:flex;align-items:center;gap:5px;\
}\
.sf-chat-header-dot{\
  width:6px;height:6px;border-radius:50%;background:#86efac;\
  box-shadow:0 0 8px rgba(134,239,172,.5);\
  animation:sf-chat-dotPulse 2s ease-in-out infinite;\
}\
@keyframes sf-chat-dotPulse{\
  0%,100%{opacity:1;transform:scale(1);}\
  50%{opacity:.4;transform:scale(.85);}\
}\
.sf-chat-header-close{\
  width:32px;height:32px;border-radius:8px;border:none;\
  background:rgba(255,255,255,.18);cursor:pointer;\
  display:flex;align-items:center;justify-content:center;\
  transition:background .2s;position:relative;z-index:2;\
}\
.sf-chat-header-close:hover{background:rgba(255,255,255,.3);}\
.sf-chat-header-close svg{width:16px;height:16px;color:#fff;fill:none;stroke:currentColor;stroke-width:2;stroke-linecap:round;stroke-linejoin:round;}\
\
/* ── Messages ── */\
.sf-chat-messages{\
  flex:1;overflow-y:auto;padding:16px 16px 8px;\
  display:flex;flex-direction:column;gap:10px;\
  scroll-behavior:smooth;\
  -webkit-overflow-scrolling:touch;\
  background:rgba(255,255,255,.5);\
}\
.sf-chat-messages::-webkit-scrollbar{width:3px;}\
.sf-chat-messages::-webkit-scrollbar-track{background:transparent;}\
.sf-chat-messages::-webkit-scrollbar-thumb{background:rgba(16,171,175,.2);border-radius:4px;}\
\
.sf-chat-msg{\
  max-width:84%;display:flex;flex-direction:column;\
  animation:sf-chat-msgIn .45s cubic-bezier(.16,1,.3,1) both;\
}\
@keyframes sf-chat-msgIn{\
  from{opacity:0;transform:translateY(10px);}\
  to{opacity:1;transform:translateY(0);}\
}\
.sf-chat-msg-bot{align-self:flex-start;}\
.sf-chat-msg-user{align-self:flex-end;}\
\
.sf-chat-msg-bubble{\
  padding:13px 17px;\
  font-family:"Almarai",sans-serif;font-size:13.5px;line-height:1.6;\
  border-radius:16px;\
  word-break:break-word;\
}\
.sf-chat-msg-bot .sf-chat-msg-bubble{\
  background:rgba(255,255,255,.75);\
  backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);\
  color:#1E293B;\
  border-bottom-left-radius:4px;\
  border:1px solid rgba(16,171,175,.08);\
}\
.sf-chat-msg-bubble strong,.sf-chat-msg-bubble b{font-weight:700;color:#0E9599;}\
.sf-chat-msg-bubble em,.sf-chat-msg-bubble i{font-style:italic;}\
.sf-chat-msg-bubble a{color:#10ABAF;text-decoration:underline;font-weight:600;}\
.sf-chat-msg-user .sf-chat-msg-bubble{\
  background:rgba(16,171,175,.9);\
  color:#fff;\
  border-bottom-right-radius:4px;\
  box-shadow:0 3px 16px rgba(16,171,175,.2);\
}\
\
/* ── Quick Buttons ── */\
.sf-chat-buttons{\
  display:flex;flex-wrap:wrap;gap:8px;margin-top:8px;\
  animation:sf-chat-msgIn .45s cubic-bezier(.16,1,.3,1) both;\
  animation-delay:.15s;\
}\
.sf-chat-btn{\
  font-family:"Almarai",sans-serif;font-size:12.5px;font-weight:600;\
  padding:9px 18px;border-radius:100px;\
  border:1px solid rgba(16,171,175,.18);\
  background:rgba(16,171,175,.04);\
  color:#0E9599;cursor:pointer;\
  transition:all .3s cubic-bezier(.16,1,.3,1);\
  line-height:1.3;\
}\
.sf-chat-btn:hover{\
  background:rgba(16,171,175,.9);\
  color:#fff;\
  border-color:transparent;\
  transform:translateY(-2px);\
  box-shadow:0 6px 20px rgba(16,171,175,.2);\
}\
\
/* ── Typing ── */\
.sf-chat-typing{\
  align-self:flex-start;display:flex;gap:4px;padding:14px 18px;\
  background:rgba(255,255,255,.7);border-radius:16px;border-bottom-left-radius:4px;\
  border:1px solid rgba(16,171,175,.06);\
  backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);\
}\
.sf-chat-typing-dot{\
  width:7px;height:7px;border-radius:50%;background:#94A3B8;\
  animation:sf-chat-bounce 1.4s ease-in-out infinite;\
}\
.sf-chat-typing-dot:nth-child(2){animation-delay:.15s;}\
.sf-chat-typing-dot:nth-child(3){animation-delay:.3s;}\
@keyframes sf-chat-bounce{\
  0%,60%,100%{transform:translateY(0);opacity:.4;}\
  30%{transform:translateY(-6px);opacity:1;}\
}\
\
/* ── Input ── */\
.sf-chat-input-area{\
  padding:14px 16px;border-top:1px solid rgba(16,171,175,.08);\
  display:flex;align-items:center;gap:10px;flex-shrink:0;\
  background:rgba(255,255,255,.6);\
  backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);\
}\
.sf-chat-input{\
  flex:1;border:1px solid rgba(16,171,175,.12);border-radius:100px;\
  padding:10px 16px;font-family:"Almarai",sans-serif;font-size:13.5px;\
  color:#1E293B;background:rgba(255,255,255,.7);outline:none;\
  transition:border-color .25s,box-shadow .25s;\
}\
.sf-chat-input::placeholder{color:#94A3B8;}\
.sf-chat-input:focus{\
  border-color:rgba(16,171,175,.4);\
  box-shadow:0 0 0 3px rgba(16,171,175,.08);\
}\
.sf-chat-send{\
  width:38px;height:38px;border-radius:50%;border:none;\
  background:#10ABAF;\
  display:flex;align-items:center;justify-content:center;\
  cursor:pointer;flex-shrink:0;\
  transition:all .3s cubic-bezier(.16,1,.3,1);\
  opacity:.5;pointer-events:none;\
  box-shadow:0 2px 10px rgba(16,171,175,.25);\
}\
.sf-chat-send.sf-chat-send-active{opacity:1;pointer-events:auto;}\
.sf-chat-send:hover{transform:scale(1.08);box-shadow:0 4px 16px rgba(16,171,175,.3);}\
.sf-chat-send:active{transform:scale(.94);}\
.sf-chat-send svg{width:17px;height:17px;color:#fff;fill:none;stroke:currentColor;stroke-width:2.5;stroke-linecap:round;stroke-linejoin:round;}\
\
/* ── Success Message ── */\
.sf-chat-success{\
  display:flex;align-items:center;gap:8px;padding:10px 14px;\
  background:rgba(16,185,129,.08);border-radius:12px;\
  border:1px solid rgba(16,185,129,.15);\
  color:#059669;font-family:"Almarai",sans-serif;font-size:13px;\
  margin-top:4px;\
}\
.sf-chat-success svg{width:18px;height:18px;flex-shrink:0;fill:none;stroke:currentColor;stroke-width:2;stroke-linecap:round;stroke-linejoin:round;}\
\
/* ── Inline Input Field ── */\
.sf-chat-inline-input{\
  margin-top:8px;padding:12px 14px;\
  background:#fff;border-radius:14px;\
  border:1px solid rgba(16,171,175,.12);\
  box-shadow:0 2px 12px rgba(16,171,175,.06);\
  animation:sf-chat-msgIn .45s cubic-bezier(.16,1,.3,1) both;\
  animation-delay:.1s;\
}\
.sf-chat-inline-label{\
  font-family:"Almarai",sans-serif;font-size:12px;font-weight:600;\
  color:#0E9599;letter-spacing:.02em;\
  display:block;margin-bottom:6px;\
}\
.sf-chat-inline-row{\
  display:flex;gap:8px;align-items:center;\
}\
.sf-chat-inline-field{\
  flex:1;border:1px solid rgba(0,0,0,.1);border-radius:10px;\
  padding:9px 14px;font-family:"Almarai",sans-serif;font-size:13.5px;\
  color:#1E293B;background:#F8FAFC;outline:none;\
  transition:border-color .25s,box-shadow .25s;\
}\
.sf-chat-inline-field:focus{\
  border-color:rgba(16,171,175,.4);\
  box-shadow:0 0 0 3px rgba(16,171,175,.08);\
}\
.sf-chat-inline-field::placeholder{color:#94A3B8;}\
.sf-chat-inline-submit{\
  width:36px;height:36px;border-radius:10px;border:none;\
  background:#10ABAF;\
  display:flex;align-items:center;justify-content:center;\
  cursor:pointer;flex-shrink:0;\
  transition:all .3s cubic-bezier(.16,1,.3,1);\
  box-shadow:0 2px 8px rgba(16,171,175,.2);\
}\
.sf-chat-inline-submit:disabled{opacity:.35;cursor:default;}\
.sf-chat-inline-submit:not(:disabled):hover{transform:scale(1.08);box-shadow:0 4px 12px rgba(16,171,175,.3);}\
.sf-chat-inline-submit svg{width:16px;height:16px;color:#fff;fill:none;stroke:currentColor;stroke-width:2;stroke-linecap:round;stroke-linejoin:round;}\
\
/* ── Error ── */\
.sf-chat-error .sf-chat-msg-bubble{\
  background:rgba(239,68,68,.08)!important;\
  color:#DC2626!important;\
  border:1px solid rgba(239,68,68,.15);\
}\
\
/* ── Contextual Nudge ── */\
.sf-chat-nudge{\
  position:fixed;bottom:96px;right:28px;z-index:9998;\
  background:#fff;\
  padding:14px 18px;border-radius:16px 16px 4px 16px;\
  box-shadow:\
    0 8px 32px rgba(79,70,229,.1),\
    0 2px 8px rgba(0,0,0,.04),\
    0 0 0 1px rgba(79,70,229,.06);\
  font-family:"Almarai",sans-serif;\
  max-width:270px;\
  cursor:pointer;\
  opacity:0;transform:translateY(12px) scale(.9);\
  transition:all .7s cubic-bezier(.16,1,.3,1);\
  pointer-events:none;\
}\
.sf-chat-nudge.sf-chat-nudge-visible{\
  opacity:1;transform:translateY(0) scale(1);pointer-events:auto;\
}\
.sf-chat-nudge:hover{\
  box-shadow:\
    0 12px 40px rgba(79,70,229,.15),\
    0 4px 12px rgba(0,0,0,.06),\
    0 0 0 1px rgba(79,70,229,.1);\
  transform:translateY(-2px);\
}\
.sf-chat-nudge-body{\
  display:flex;align-items:flex-start;gap:12px;\
}\
.sf-chat-nudge-emoji{\
  font-size:20px;flex-shrink:0;line-height:1;\
  animation:sf-chat-emojiFloat 2.5s ease-in-out infinite;\
}\
@keyframes sf-chat-emojiFloat{\
  0%,100%{transform:translateY(0) scale(1);}\
  50%{transform:translateY(-3px) scale(1.08);}\
}\
.sf-chat-nudge-text{\
  font-size:13.5px;line-height:1.55;color:#1e1b3a;font-weight:500;\
}\
.sf-chat-nudge-text strong{\
  background:linear-gradient(135deg,#6366f1,#a855f7);\
  -webkit-background-clip:text;-webkit-text-fill-color:transparent;\
  background-clip:text;font-weight:700;\
}\
.sf-chat-nudge-sub{\
  font-size:11.5px;color:#a0a4c1;margin-top:6px;\
  display:flex;align-items:center;gap:5px;\
}\
.sf-chat-nudge-sub-dot{\
  width:5px;height:5px;background:#22c55e;border-radius:50%;\
  animation:sf-chat-dotPulse 2s ease-in-out infinite;\
}\
.sf-chat-nudge-close{\
  position:absolute;top:8px;right:8px;\
  width:20px;height:20px;border-radius:50%;border:none;\
  background:rgba(107,112,148,.08);\
  cursor:pointer;display:flex;align-items:center;justify-content:center;\
  opacity:0;transition:all .2s ease;\
}\
.sf-chat-nudge:hover .sf-chat-nudge-close{opacity:1;}\
.sf-chat-nudge-close:hover{background:rgba(107,112,148,.16);}\
.sf-chat-nudge-close svg{width:10px;height:10px;stroke:#6b7094;stroke-width:2.5;fill:none;stroke-linecap:round;}\
@media(hover:none),(pointer:coarse){\
  .sf-chat-nudge-close{opacity:1;}\
}\
@media(max-width:480px){\
  .sf-chat-nudge{right:20px;bottom:84px;max-width:230px;font-size:12.5px;padding:12px 14px;}\
  .sf-chat-nudge-emoji{font-size:18px;}\
}\
\
/* ── Mobile Backdrop ── */\
.sf-chat-backdrop{\
  display:none;position:fixed;inset:0;z-index:9996;\
  background:rgba(15,23,42,.4);\
  backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);\
  opacity:0;transition:opacity .35s cubic-bezier(.16,1,.3,1);\
  pointer-events:none;\
}\
.sf-chat-backdrop.sf-chat-backdrop-visible{\
  opacity:1;pointer-events:auto;\
}\
\
/* ── Mobile ── */\
@media(max-width:480px){\
  .sf-chat-backdrop{display:block;}\
  .sf-chat-panel{\
    position:fixed;\
    bottom:12px;right:10px;left:10px;top:auto;\
    width:auto;height:calc(100dvh - 24px);max-height:calc(100dvh - 24px);\
    border-radius:20px;\
    border:1px solid rgba(255,255,255,.15);\
    box-shadow:0 20px 60px rgba(0,0,0,.25);\
  }\
  .sf-chat-bubble{bottom:20px;right:20px;width:56px;height:56px;}\
  .sf-chat-bubble svg{width:24px;height:24px;}\
  .sf-chat-bubble::before{inset:-5px;filter:blur(6px);}\
  .sf-chat-input-area{\
    padding:10px 12px;\
    padding-bottom:max(10px,env(safe-area-inset-bottom));\
  }\
  .sf-chat-header{padding:14px 16px;}\
  .sf-chat-messages{padding:12px 12px 6px;}\
  .sf-chat-input{font-size:16px;}\
  .sf-chat-inline-field{font-size:16px;}\
}\
';
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

  /* ─── DOM ─── */

  // Remove existing .chat bubble
  var existingChat = document.querySelector('.chat');
  if (existingChat) existingChat.remove();

  // Bubble
  var bubble = document.createElement('button');
  bubble.className = 'sf-chat-bubble';
  bubble.setAttribute('aria-label', 'Ouvrir le chat');
  bubble.innerHTML = '\
<svg viewBox="0 0 24 24">\
<path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z"/>\
<path d="M12 6.5c.6 2.2 1.8 3.4 4 4-2.2.6-3.4 1.8-4 4-.6-2.2-1.8-3.4-4-4 2.2-.6 3.4-1.8 4-4z" fill="white" stroke="none"/>\
</svg>';

  // Panel
  var panel = document.createElement('div');
  panel.className = 'sf-chat-panel';
  panel.innerHTML = '\
<div class="sf-chat-header">\
  <div class="sf-chat-header-avatar"><svg viewBox="0 0 24 24"><path d="M12 2a7 7 0 017 7v1a7 7 0 01-14 0V9a7 7 0 017-7z"/><path d="M5 10v2a7 7 0 0014 0v-2"/><line x1="12" y1="19" x2="12" y2="22"/><line x1="8" y1="22" x2="16" y2="22"/></svg></div>\
  <div class="sf-chat-header-info">\
    <div class="sf-chat-header-title">Assistant Switching Formation</div>\
    <div class="sf-chat-header-status"><span class="sf-chat-header-dot"></span>En ligne</div>\
  </div>\
  <button class="sf-chat-header-close" aria-label="Fermer"><svg viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>\
</div>\
<div class="sf-chat-messages"></div>\
<div class="sf-chat-input-area">\
  <input class="sf-chat-input" type="text" placeholder="Votre message..." autocomplete="off"/>\
  <button class="sf-chat-send" aria-label="Envoyer"><svg viewBox="0 0 24 24"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg></button>\
</div>';

  // Backdrop (for mobile modal effect)
  var backdrop = document.createElement('div');
  backdrop.className = 'sf-chat-backdrop';
  document.body.appendChild(backdrop);

  document.body.appendChild(panel);
  document.body.appendChild(bubble);

  var messagesEl = panel.querySelector('.sf-chat-messages');
  var inputEl = panel.querySelector('.sf-chat-input');
  var sendBtn = panel.querySelector('.sf-chat-send');
  var closeBtn = panel.querySelector('.sf-chat-header-close');

  // ── Visual Viewport handling for mobile keyboard ──
  // When the keyboard opens on mobile, resize the panel to fit the visible area
  function adjustForKeyboard() {
    if (window.innerWidth > 480 || !isOpen) return;
    var vv = window.visualViewport;
    if (!vv) return;
    var keyboardHeight = window.innerHeight - vv.height;
    if (keyboardHeight > 50) {
      // Keyboard is open
      var availableHeight = vv.height - 24;
      panel.style.height = availableHeight + 'px';
      panel.style.maxHeight = availableHeight + 'px';
      panel.style.bottom = (keyboardHeight + 12) + 'px';
    } else {
      // Keyboard closed — reset to CSS defaults
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

  function renderBotBubble(text) {
    var div = document.createElement('div');
    div.className = 'sf-chat-msg sf-chat-msg-bot';
    var bub = document.createElement('div');
    bub.className = 'sf-chat-msg-bubble';
    bub.innerHTML = formatMarkdown(stripMarkers(text));
    div.appendChild(bub);
    return div;
  }

  function renderUserBubble(text) {
    var div = document.createElement('div');
    div.className = 'sf-chat-msg sf-chat-msg-user';
    var bub = document.createElement('div');
    bub.className = 'sf-chat-msg-bubble';
    bub.textContent = text;
    div.appendChild(bub);
    return div;
  }

  function renderButtons(buttons) {
    var wrap = document.createElement('div');
    wrap.className = 'sf-chat-buttons';
    buttons.forEach(function(label) {
      var btn = document.createElement('button');
      btn.className = 'sf-chat-btn';
      btn.textContent = label;
      btn.addEventListener('click', function() {
        wrap.remove();
        sendMessage(label);
      });
      wrap.appendChild(btn);
    });
    return wrap;
  }

  function renderInputField(label) {
    var wrap = document.createElement('div');
    wrap.className = 'sf-chat-inline-input';
    var lbl = document.createElement('label');
    lbl.className = 'sf-chat-inline-label';
    lbl.textContent = label;
    var row = document.createElement('div');
    row.className = 'sf-chat-inline-row';
    var inp = document.createElement('input');
    inp.className = 'sf-chat-inline-field';
    inp.type = label.toLowerCase().indexOf('email') !== -1 ? 'email'
      : label.toLowerCase().indexOf('tel') !== -1 || label.toLowerCase().indexOf('phone') !== -1 || label.toLowerCase().indexOf('téléphone') !== -1 || label.toLowerCase().indexOf('numero') !== -1 || label.toLowerCase().indexOf('numéro') !== -1 ? 'tel'
      : 'text';
    inp.placeholder = label;
    inp.autocomplete = inp.type === 'email' ? 'email' : inp.type === 'tel' ? 'tel' : 'off';
    var btn = document.createElement('button');
    btn.className = 'sf-chat-inline-submit';
    btn.innerHTML = '<svg viewBox="0 0 24 24"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>';
    btn.disabled = true;
    inp.addEventListener('input', function() {
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
    btn.addEventListener('click', submit);
    row.appendChild(inp);
    row.appendChild(btn);
    wrap.appendChild(lbl);
    wrap.appendChild(row);
    requestAnimationFrame(function() { inp.focus(); });
    return wrap;
  }

  function renderSuccess(text) {
    var div = document.createElement('div');
    div.className = 'sf-chat-success';
    div.innerHTML = '<svg viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg><span>' + text + '</span>';
    return div;
  }

  function showTyping() {
    var div = document.createElement('div');
    div.className = 'sf-chat-typing';
    div.id = 'sf-chat-typing';
    div.innerHTML = '<span class="sf-chat-typing-dot"></span><span class="sf-chat-typing-dot"></span><span class="sf-chat-typing-dot"></span>';
    messagesEl.appendChild(div);
    scrollToBottom();
    return div;
  }

  function removeTyping() {
    var t = document.getElementById('sf-chat-typing');
    if (t) t.remove();
  }

  function renderAllMessages() {
    messagesEl.innerHTML = '';
    messages.forEach(function(msg) {
      if (msg.role === 'bot') {
        messagesEl.appendChild(renderBotBubble(msg.text));
        if (msg.buttons && msg.buttons.length) {
          messagesEl.appendChild(renderButtons(msg.buttons));
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
      inputEl.focus();
    } else {
      panel.classList.remove('sf-chat-visible');
      bubble.classList.remove('sf-chat-active');
      backdrop.classList.remove('sf-chat-backdrop-visible');
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

  inputEl.addEventListener('input', function() {
    if (inputEl.value.trim()) {
      sendBtn.classList.add('sf-chat-send-active');
    } else {
      sendBtn.classList.remove('sf-chat-send-active');
    }
  });

  inputEl.addEventListener('keydown', function(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      var text = inputEl.value.trim();
      if (text && !isSending) sendMessage(text);
    }
  });

  sendBtn.addEventListener('click', function() {
    var text = inputEl.value.trim();
    if (text && !isSending) sendMessage(text);
  });

  /* ─── Send Message ─── */

  function sendMessage(text) {
    if (isSending) return;

    // Check limit
    if (userCount >= MAX_MESSAGES) {
      messages.push({ role: 'bot', text: LIMIT_TEXT, buttons: [] });
      saveSession();
      renderAllMessages();
      return;
    }

    // Add user message
    messages.push({ role: 'user', text: text });
    userCount++;
    saveSession();

    messagesEl.appendChild(renderUserBubble(text));
    scrollToBottom();

    inputEl.value = '';
    sendBtn.classList.remove('sf-chat-send-active');

    // Remove any leftover quick buttons and inline inputs
    var oldBtns = messagesEl.querySelectorAll('.sf-chat-buttons, .sf-chat-inline-input');
    oldBtns.forEach(function(b) { b.remove(); });

    isSending = true;
    showTyping();

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
      removeTyping();

      var cleanText = stripMarkers(data.text || '');
      var botMsg = { role: 'bot', text: cleanText, buttons: data.buttons || [], success: '' };
      messages.push(botMsg);

      messagesEl.appendChild(renderBotBubble(cleanText));

      // Handle conversation_id from server
      if (data.conversation_id) {
        conversationId = data.conversation_id;
        try { sessionStorage.setItem(CONV_STORAGE_KEY, String(conversationId)); } catch(ex) {}
      }

      if (data.buttons && data.buttons.length) {
        messagesEl.appendChild(renderButtons(data.buttons));
      }

      if (data.input) {
        messagesEl.appendChild(renderInputField(data.input));
      }

      if (data.submit) {
        botMsg.success = 'Demande envoyée';
        messagesEl.appendChild(renderSuccess('Demande envoyée avec succès !'));
      }

      isSending = false;
      saveSession();
      scrollToBottom();
    }).catch(function(err) {
      clearTimeout(fetchTimeout);
      removeTyping();
      isSending = false;
      var errText = err && err.name === 'AbortError'
        ? 'La réponse a pris trop de temps. Veuillez réessayer.'
        : 'Désolé, une erreur est survenue. Veuillez réessayer.';
      messages.push({ role: 'bot', text: errText, buttons: [] });
      saveSession();
      var errEl = renderBotBubble(errText);
      errEl.classList.add('sf-chat-error');
      messagesEl.appendChild(errEl);
      scrollToBottom();
    });
  }

  /* ─── Escape key to close ─── */
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape' && isOpen) togglePanel();
  });

  /* ─── Contextual Nudge Message ─── */
  var nudgeDismissed = false;
  try { nudgeDismissed = sessionStorage.getItem('sf-chat-nudge-dismissed') === '1'; } catch(e) {}

  if (!nudgeDismissed && messages.length === 0) {
    var page = window.location.pathname.replace(/^\/|\.html$/g, '') || 'index';
    var nudgeMessages = {
      'index':           { emoji: '\u2728', text: 'Besoin d\u2019aide pour choisir <strong>votre formation</strong> ? On vous guide !', sub: 'Sophie r\u00e9pond en quelques secondes' },
      'formations':      { emoji: '\ud83d\udcda', text: 'Vous h\u00e9sitez entre <strong>plusieurs formations</strong> ? Je vous aide \u00e0 trouver la bonne.', sub: 'R\u00e9ponse imm\u00e9diate' },
      'financement':     { emoji: '\ud83d\udcb3', text: 'Des questions sur le <strong>financement CPF</strong> ou OPCO ? Je vous explique tout.', sub: 'Simulation gratuite' },
      'inscription':     { emoji: '\ud83d\udcdd', text: 'Besoin d\u2019un <strong>devis personnalis\u00e9</strong> ? Je peux vous le pr\u00e9parer maintenant.', sub: 'R\u00e9ponse en 30 secondes' },
      'documentation':   { emoji: '\ud83d\udcc4', text: 'Vous souhaitez recevoir <strong>la documentation</strong> ? \u00c9changeons !', sub: 'Sophie est l\u00e0 pour vous' },
      'le-centre':       { emoji: '\ud83c\udfe2', text: 'Envie d\u2019en savoir plus sur <strong>notre centre</strong> certifi\u00e9 Qualiopi ?', sub: 'Sophie est l\u00e0 pour vous' },
      'donnees':         { emoji: '\ud83d\udcac', text: 'Une question ? N\u2019h\u00e9sitez pas \u00e0 <strong>me la poser</strong> !', sub: 'Assistance en temps r\u00e9el' },
      'mentions-legales': { emoji: '\ud83d\udcac', text: 'Une question ? Je suis l\u00e0 pour <strong>vous aider</strong> !', sub: 'Assistance en temps r\u00e9el' },
      'cgv':             { emoji: '\ud83d\udcac', text: 'Besoin d\u2019<strong>\u00e9claircissements</strong> ? Demandez-moi !', sub: 'Assistance en temps r\u00e9el' }
    };
    var nudgeData = nudgeMessages[page] || { emoji: '\u2728', text: 'Comment puis-je <strong>vous aider</strong> ?', sub: 'Sophie r\u00e9pond instantan\u00e9ment' };

    var nudge = document.createElement('div');
    nudge.className = 'sf-chat-nudge';
    nudge.innerHTML = '<button class="sf-chat-nudge-close" aria-label="Fermer"><svg viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>'
      + '<div class="sf-chat-nudge-body">'
      + '<span class="sf-chat-nudge-emoji">' + nudgeData.emoji + '</span>'
      + '<div><div class="sf-chat-nudge-text">' + nudgeData.text + '</div>'
      + '<div class="sf-chat-nudge-sub"><span class="sf-chat-nudge-sub-dot"></span>' + nudgeData.sub + '</div>'
      + '</div></div>';
    document.body.appendChild(nudge);

    // Show after 4 seconds
    setTimeout(function() {
      if (!isOpen && !nudgeDismissed) {
        nudge.classList.add('sf-chat-nudge-visible');
      }
    }, 4000);

    // Auto-hide after 12 seconds
    setTimeout(function() {
      nudge.classList.remove('sf-chat-nudge-visible');
    }, 16000);

    // Click nudge opens chat
    nudge.addEventListener('click', function(e) {
      if (e.target.closest('.sf-chat-nudge-close')) {
        nudge.classList.remove('sf-chat-nudge-visible');
        nudgeDismissed = true;
        try { sessionStorage.setItem('sf-chat-nudge-dismissed', '1'); } catch(ex) {}
        return;
      }
      nudge.classList.remove('sf-chat-nudge-visible');
      nudgeDismissed = true;
      try { sessionStorage.setItem('sf-chat-nudge-dismissed', '1'); } catch(ex) {}
      if (!isOpen) togglePanel();
    });

    // Hide nudge when chat opens
    var origToggle = togglePanel;
    togglePanel = function() {
      origToggle();
      if (isOpen) {
        nudge.classList.remove('sf-chat-nudge-visible');
        nudgeDismissed = true;
        try { sessionStorage.setItem('sf-chat-nudge-dismissed', '1'); } catch(ex) {}
      }
    };
    bubble.removeEventListener('click', origToggle);
    bubble.addEventListener('click', togglePanel);
  }

})();
