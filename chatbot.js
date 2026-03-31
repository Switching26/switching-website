(function() {
  'use strict';

  /* ─── Constants ─── */
  var MAX_MESSAGES = 20;
  var STORAGE_KEY = 'sf-chat-messages';
  var STORAGE_COUNT_KEY = 'sf-chat-count';
  var PHONE = '06 95 18 50 57';
  var PHONE_HREF = 'tel:+33695185057';
  var WELCOME_TEXT = 'Bonjour ! Je suis l\'Assistant Switching Formation. Comment puis-je vous aider ?';
  var WELCOME_BUTTONS = ['Je cherche une formation', 'Question sur le financement', 'Demander un devis'];
  var LIMIT_TEXT = 'Pour continuer, appelez-nous au <a href="' + PHONE_HREF + '" style="color:#10ABAF;font-weight:700;text-decoration:underline">' + PHONE + '</a>';

  /* ─── Inject CSS ─── */
  var style = document.createElement('style');
  style.textContent = '\
/* ── Chat Bubble ── */\
.sf-chat-bubble{\
  position:fixed;bottom:28px;right:28px;z-index:9998;\
  width:56px;height:56px;border-radius:50%;\
  background:linear-gradient(135deg,#10ABAF,#0E9599);\
  display:flex;align-items:center;justify-content:center;\
  cursor:pointer;border:none;outline:none;\
  box-shadow:0 4px 20px rgba(16,171,175,.3),0 0 0 0 rgba(16,171,175,.2);\
  transition:all .4s cubic-bezier(.16,1,.3,1);\
  animation:sf-chat-pulse 3s ease-in-out infinite;\
}\
.sf-chat-bubble:hover{\
  transform:translateY(-3px) scale(1.05);\
  box-shadow:0 8px 32px rgba(16,171,175,.4);\
}\
.sf-chat-bubble svg{width:24px;height:24px;color:#fff;fill:none;stroke:currentColor;stroke-width:1.5;stroke-linecap:round;stroke-linejoin:round;}\
.sf-chat-bubble .sf-chat-close-icon{display:none;}\
.sf-chat-bubble.sf-chat-active .sf-chat-open-icon{display:none;}\
.sf-chat-bubble.sf-chat-active .sf-chat-close-icon{display:block;}\
.sf-chat-bubble.sf-chat-active{animation:none;}\
@keyframes sf-chat-pulse{\
  0%,100%{box-shadow:0 4px 20px rgba(16,171,175,.3),0 0 0 0 rgba(16,171,175,.2);}\
  50%{box-shadow:0 4px 20px rgba(16,171,175,.3),0 0 0 12px rgba(16,171,175,0);}\
}\
\
/* ── Chat Panel ── */\
.sf-chat-panel{\
  position:fixed;bottom:96px;right:28px;z-index:9997;\
  width:380px;height:560px;\
  background:rgba(255,255,255,.95);\
  backdrop-filter:blur(20px) saturate(180%);\
  -webkit-backdrop-filter:blur(20px) saturate(180%);\
  border-radius:20px;\
  border:1px solid rgba(0,0,0,.08);\
  box-shadow:0 20px 60px rgba(0,0,0,.15),0 0 0 1px rgba(255,255,255,.5) inset;\
  display:flex;flex-direction:column;\
  overflow:hidden;\
  opacity:0;\
  transform:translateY(16px) scale(.96);\
  pointer-events:none;\
  transition:opacity .35s cubic-bezier(.16,1,.3,1),transform .35s cubic-bezier(.16,1,.3,1);\
}\
.sf-chat-panel.sf-chat-visible{\
  opacity:1;transform:translateY(0) scale(1);pointer-events:auto;\
}\
\
/* ── Header ── */\
.sf-chat-header{\
  background:linear-gradient(135deg,#10ABAF 0%,#0E9599 100%);\
  padding:18px 20px;\
  display:flex;align-items:center;gap:12px;\
  flex-shrink:0;\
  position:relative;\
  overflow:hidden;\
}\
.sf-chat-header::after{\
  content:"";position:absolute;inset:0;\
  background:radial-gradient(circle at 80% 20%,rgba(255,255,255,.12),transparent 60%);\
  pointer-events:none;\
}\
.sf-chat-header-avatar{\
  width:38px;height:38px;border-radius:12px;\
  background:rgba(255,255,255,.2);\
  display:flex;align-items:center;justify-content:center;\
  flex-shrink:0;\
}\
.sf-chat-header-avatar svg{width:20px;height:20px;color:#fff;fill:none;stroke:currentColor;stroke-width:1.5;stroke-linecap:round;stroke-linejoin:round;}\
.sf-chat-header-info{flex:1;min-width:0;}\
.sf-chat-header-title{\
  font-family:"Poppins",sans-serif;font-weight:600;font-size:14px;\
  color:#fff;letter-spacing:-0.01em;line-height:1.3;\
}\
.sf-chat-header-status{\
  font-family:"Almarai",sans-serif;font-size:11px;font-weight:400;\
  color:rgba(255,255,255,.75);margin-top:1px;\
  display:flex;align-items:center;gap:5px;\
}\
.sf-chat-header-dot{\
  width:6px;height:6px;border-radius:50%;background:#5EEAD4;\
  box-shadow:0 0 6px rgba(94,234,212,.6);\
}\
.sf-chat-header-close{\
  width:32px;height:32px;border-radius:8px;border:none;\
  background:rgba(255,255,255,.15);cursor:pointer;\
  display:flex;align-items:center;justify-content:center;\
  transition:background .2s;\
}\
.sf-chat-header-close:hover{background:rgba(255,255,255,.25);}\
.sf-chat-header-close svg{width:16px;height:16px;color:#fff;fill:none;stroke:currentColor;stroke-width:2;stroke-linecap:round;stroke-linejoin:round;}\
\
/* ── Messages ── */\
.sf-chat-messages{\
  flex:1;overflow-y:auto;padding:16px 16px 8px;\
  display:flex;flex-direction:column;gap:10px;\
  scroll-behavior:smooth;\
  -webkit-overflow-scrolling:touch;\
}\
.sf-chat-messages::-webkit-scrollbar{width:4px;}\
.sf-chat-messages::-webkit-scrollbar-track{background:transparent;}\
.sf-chat-messages::-webkit-scrollbar-thumb{background:rgba(0,0,0,.1);border-radius:4px;}\
\
.sf-chat-msg{\
  max-width:85%;display:flex;flex-direction:column;\
  animation:sf-chat-msgIn .35s cubic-bezier(.16,1,.3,1) both;\
}\
@keyframes sf-chat-msgIn{\
  from{opacity:0;transform:translateY(8px);}\
  to{opacity:1;transform:translateY(0);}\
}\
.sf-chat-msg-bot{align-self:flex-start;}\
.sf-chat-msg-user{align-self:flex-end;}\
\
.sf-chat-msg-bubble{\
  padding:11px 15px;\
  font-family:"Almarai",sans-serif;font-size:13.5px;line-height:1.55;\
  border-radius:16px;\
  word-break:break-word;\
}\
.sf-chat-msg-bot .sf-chat-msg-bubble{\
  background:#F1F5F9;color:#1E293B;\
  border-bottom-left-radius:4px;\
}\
.sf-chat-msg-user .sf-chat-msg-bubble{\
  background:linear-gradient(135deg,#10ABAF,#0E9599);\
  color:#fff;\
  border-bottom-right-radius:4px;\
}\
\
/* ── Quick Buttons ── */\
.sf-chat-buttons{\
  display:flex;flex-wrap:wrap;gap:6px;margin-top:8px;\
  animation:sf-chat-msgIn .35s cubic-bezier(.16,1,.3,1) both;\
  animation-delay:.1s;\
}\
.sf-chat-btn{\
  font-family:"Almarai",sans-serif;font-size:12.5px;font-weight:500;\
  padding:8px 14px;border-radius:100px;\
  border:1px solid rgba(16,171,175,.2);background:rgba(16,171,175,.04);\
  color:#10ABAF;cursor:pointer;\
  transition:all .3s cubic-bezier(.16,1,.3,1);\
  line-height:1.3;\
}\
.sf-chat-btn:hover{\
  background:rgba(16,171,175,.1);\
  border-color:rgba(16,171,175,.35);\
  transform:translateY(-2px);\
  box-shadow:0 4px 12px rgba(16,171,175,.12);\
}\
\
/* ── Typing ── */\
.sf-chat-typing{\
  align-self:flex-start;display:flex;gap:4px;padding:14px 18px;\
  background:#F1F5F9;border-radius:16px;border-bottom-left-radius:4px;\
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
  padding:12px 16px;border-top:1px solid rgba(0,0,0,.06);\
  display:flex;align-items:center;gap:8px;flex-shrink:0;\
  background:rgba(255,255,255,.8);\
}\
.sf-chat-input{\
  flex:1;border:1px solid rgba(0,0,0,.08);border-radius:100px;\
  padding:10px 16px;font-family:"Almarai",sans-serif;font-size:13.5px;\
  color:#1E293B;background:#F8FAFC;outline:none;\
  transition:border-color .25s,box-shadow .25s;\
}\
.sf-chat-input::placeholder{color:#94A3B8;}\
.sf-chat-input:focus{\
  border-color:rgba(16,171,175,.35);\
  box-shadow:0 0 0 3px rgba(16,171,175,.08);\
}\
.sf-chat-send{\
  width:38px;height:38px;border-radius:50%;border:none;\
  background:linear-gradient(135deg,#10ABAF,#0E9599);\
  display:flex;align-items:center;justify-content:center;\
  cursor:pointer;flex-shrink:0;\
  transition:all .3s cubic-bezier(.16,1,.3,1);\
  opacity:.5;pointer-events:none;\
}\
.sf-chat-send.sf-chat-send-active{opacity:1;pointer-events:auto;}\
.sf-chat-send:hover{transform:scale(1.08);box-shadow:0 4px 16px rgba(16,171,175,.3);}\
.sf-chat-send svg{width:16px;height:16px;color:#fff;fill:none;stroke:currentColor;stroke-width:2;stroke-linecap:round;stroke-linejoin:round;margin-left:1px;}\
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
/* ── Error ── */\
.sf-chat-error .sf-chat-msg-bubble{\
  background:rgba(239,68,68,.08)!important;\
  color:#DC2626!important;\
  border:1px solid rgba(239,68,68,.15);\
}\
\
/* ── Mobile ── */\
@media(max-width:480px){\
  .sf-chat-panel{\
    bottom:0;right:0;left:0;top:0;\
    width:100%;height:100%;\
    border-radius:0;border:none;\
  }\
  .sf-chat-bubble{bottom:20px;right:20px;}\
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
<svg class="sf-chat-open-icon" viewBox="0 0 24 24"><path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z"/></svg>\
<svg class="sf-chat-close-icon" viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>';

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

  document.body.appendChild(panel);
  document.body.appendChild(bubble);

  var messagesEl = panel.querySelector('.sf-chat-messages');
  var inputEl = panel.querySelector('.sf-chat-input');
  var sendBtn = panel.querySelector('.sf-chat-send');
  var closeBtn = panel.querySelector('.sf-chat-header-close');

  /* ─── Helpers ─── */

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
    // Remove [BUTTONS: ...] and [SUBMIT: ...] markers
    return text
      .replace(/\[BUTTONS?:\s*[^\]]*\]/gi, '')
      .replace(/\[SUBMIT:\s*[^\]]*\]/gi, '')
      .trim();
  }

  function renderBotBubble(text) {
    var div = document.createElement('div');
    div.className = 'sf-chat-msg sf-chat-msg-bot';
    var bub = document.createElement('div');
    bub.className = 'sf-chat-msg-bubble';
    bub.innerHTML = stripMarkers(text);
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
    }
  }

  bubble.addEventListener('click', togglePanel);
  closeBtn.addEventListener('click', function(e) {
    e.stopPropagation();
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

    // Remove any leftover quick buttons
    var oldBtns = messagesEl.querySelectorAll('.sf-chat-buttons');
    oldBtns.forEach(function(b) { b.remove(); });

    isSending = true;
    var typingEl = showTyping();

    // Build conversation history for API
    var history = messages.filter(function(m) {
      return m.role === 'user' || m.role === 'bot';
    }).map(function(m) {
      return { role: m.role === 'bot' ? 'assistant' : 'user', content: m.text };
    });

    // SSE fetch
    fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: history })
    }).then(function(response) {
      if (!response.ok) throw new Error('HTTP ' + response.status);
      if (!response.body) throw new Error('No stream');

      removeTyping();

      var botMsg = { role: 'bot', text: '', buttons: [], success: '' };
      messages.push(botMsg);

      var botEl = renderBotBubble('');
      messagesEl.appendChild(botEl);
      var bubbleTextEl = botEl.querySelector('.sf-chat-msg-bubble');

      var reader = response.body.getReader();
      var decoder = new TextDecoder();
      var buffer = '';

      function processChunk() {
        return reader.read().then(function(result) {
          if (result.done) {
            // Finalize
            isSending = false;
            saveSession();
            return;
          }

          buffer += decoder.decode(result.value, { stream: true });

          // Parse SSE lines
          var lines = buffer.split('\n');
          buffer = lines.pop() || '';

          lines.forEach(function(line) {
            line = line.trim();
            if (!line || line === '') return;

            // Parse "event:" lines and "data:" lines
            if (line.startsWith('event:')) return; // We parse data lines below

            if (!line.startsWith('data:')) return;

            var dataStr = line.substring(5).trim();
            if (!dataStr) return;

            var data;
            try { data = JSON.parse(dataStr); } catch(e) { return; }

            if (data.type === 'text' || data.text) {
              var txt = data.text || data.content || '';
              botMsg.text += txt;
              bubbleTextEl.innerHTML = stripMarkers(botMsg.text);
              scrollToBottom();
            } else if (data.type === 'buttons' && data.buttons) {
              botMsg.buttons = data.buttons;
              messagesEl.appendChild(renderButtons(data.buttons));
              scrollToBottom();
            } else if (data.type === 'submit' && data.message) {
              botMsg.success = data.message;
              messagesEl.appendChild(renderSuccess(data.message));
              scrollToBottom();
            } else if (data.type === 'done') {
              isSending = false;
              saveSession();
            } else if (data.type === 'error') {
              var errMsg = data.message || 'Une erreur est survenue.';
              bubbleTextEl.textContent = errMsg;
              botEl.classList.add('sf-chat-error');
              botMsg.text = errMsg;
              isSending = false;
              saveSession();
            }
          });

          return processChunk();
        });
      }

      return processChunk();
    }).catch(function(err) {
      removeTyping();
      isSending = false;
      var errText = 'D\u00e9sol\u00e9, une erreur est survenue. Veuillez r\u00e9essayer.';
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

})();
