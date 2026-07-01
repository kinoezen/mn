// ============================================================
// feedback-widget.js — КиноЭзэн санал хүсэлтийн хөвдөг widget
// ============================================================
// Ашиглах арга: Бүх HTML хуудасны </body>-ийн өмнө дараах мөрийг
// нэмнэ:
//   <script src="feedback-widget.js"></script>
//
// Зөвхөн НЭВТЭРСЭН хэрэглэгчид харагдана.
// ============================================================

(function () {
  'use strict';

  const SUPABASE_URL = 'https://smncsxlbyyhowfarxxlz.supabase.co';
  const SUPABASE_KEY = 'sb_publishable_Zjr9q57fQ5ZV-BF0StnvJA_Z1U_7qHO';

  function isLoggedIn() {
    return !!localStorage.getItem('sb_token');
  }

  if (!isLoggedIn()) {
    console.log('feedback-widget: нэвтрээгүй тул widget харагдахгүй');
    return;
  }

  const style = document.createElement('style');
  style.textContent = `
    #fbw-bubble {
      position: fixed;
      width: 56px; height: 56px;
      border-radius: 50%;
      background: linear-gradient(135deg, #4ade80, #f4a261);
      display: flex; align-items: center; justify-content: center;
      font-size: 24px;
      cursor: grab;
      box-shadow: 0 6px 20px rgba(74,222,128,0.35), 0 2px 8px rgba(0,0,0,0.3);
      z-index: 99998;
      user-select: none;
      touch-action: none;
      transition: transform 0.15s, box-shadow 0.2s;
      right: 20px;
      bottom: 90px;
    }
    #fbw-bubble:hover { transform: scale(1.08); box-shadow: 0 8px 26px rgba(74,222,128,0.45), 0 2px 8px rgba(0,0,0,0.35); }
    #fbw-bubble.dragging { cursor: grabbing; transform: scale(1.05); }
    #fbw-bubble .fbw-pulse {
      position: absolute; inset: -4px; border-radius: 50%;
      border: 2px solid rgba(74,222,128,0.5);
      animation: fbw-pulse 2.4s ease-out infinite;
      pointer-events: none;
    }
    @keyframes fbw-pulse {
      0% { transform: scale(0.9); opacity: 0.8; }
      100% { transform: scale(1.5); opacity: 0; }
    }
    #fbw-panel {
      position: fixed;
      width: 320px;
      max-width: calc(100vw - 32px);
      background: #161621;
      border: 1px solid rgba(255,255,255,0.08);
      border-radius: 18px;
      box-shadow: 0 20px 60px rgba(0,0,0,0.5);
      z-index: 99999;
      display: none;
      flex-direction: column;
      overflow: hidden;
      font-family: 'Nunito', Arial, sans-serif;
    }
    #fbw-panel.open { display: flex; animation: fbw-pop 0.22s ease; }
    @keyframes fbw-pop {
      from { opacity: 0; transform: translateY(8px) scale(0.97); }
      to { opacity: 1; transform: translateY(0) scale(1); }
    }
    #fbw-header {
      padding: 14px 16px;
      background: linear-gradient(90deg, rgba(74,222,128,0.12), rgba(244,162,97,0.12));
      border-bottom: 1px solid rgba(255,255,255,0.06);
      display: flex; align-items: center; justify-content: space-between;
    }
    #fbw-header .fbw-title { font-size: 14px; font-weight: 700; color: #fff; }
    #fbw-header .fbw-sub { font-size: 11px; color: rgba(255,255,255,0.4); margin-top: 2px; }
    #fbw-close {
      background: rgba(255,255,255,0.06); border: none; color: rgba(255,255,255,0.5);
      width: 26px; height: 26px; border-radius: 8px; cursor: pointer; font-size: 14px;
      display: flex; align-items: center; justify-content: center;
    }
    #fbw-close:hover { background: rgba(255,255,255,0.12); color: #fff; }
    #fbw-body { padding: 16px; display: flex; flex-direction: column; gap: 10px; }
    .fbw-q { font-size: 13px; font-weight: 600; color: #fff; margin-bottom: 4px; }
    #fbw-emoji-row { display: flex; justify-content: space-between; gap: 3px; }
    .fbw-emoji {
      flex: 1; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.08);
      border-radius: 8px; padding: 6px 2px; font-size: 13px; cursor: pointer;
      transition: all 0.2s; line-height: 1.3; white-space: nowrap; text-align: center;
    }
    .fbw-emoji:hover { background: rgba(255,255,255,0.1); transform: scale(1.05); }
    .fbw-emoji.selected { background: rgba(74,222,128,0.18); border-color: #4ade80; transform: scale(1.06); }
    #fbw-skip {
      background: transparent; border: none; color: rgba(255,255,255,0.35);
      font-size: 11px; cursor: pointer; text-decoration: underline; padding: 2px;
    }
    #fbw-skip:hover { color: rgba(255,255,255,0.6); }
    #fbw-body textarea {
      width: 100%; min-height: 90px; resize: vertical;
      background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.08);
      border-radius: 10px; padding: 11px 13px; color: #fff; font-size: 13px;
      font-family: 'Nunito', Arial, sans-serif;
    }
    #fbw-body textarea:focus { outline: none; border-color: #4ade80; }
    #fbw-body textarea::placeholder { color: rgba(255,255,255,0.3); }
    #fbw-send {
      padding: 11px; border-radius: 10px; border: none;
      background: linear-gradient(90deg, #4ade80, #f4a261);
      color: #0a2a0a; font-size: 13px; font-weight: 700; cursor: pointer;
      transition: opacity 0.2s;
    }
    #fbw-send:disabled { opacity: 0.5; cursor: not-allowed; }
    #fbw-msg { font-size: 12px; padding: 9px 12px; border-radius: 8px; display: none; }
    #fbw-msg.success { display: block; background: rgba(74,222,128,0.12); color: #4ade80; border: 1px solid rgba(74,222,128,0.25); }
    #fbw-msg.error { display: block; background: rgba(230,57,70,0.12); color: #f87171; border: 1px solid rgba(230,57,70,0.25); }
    @media (max-width: 480px) {
      #fbw-bubble { width: 50px; height: 50px; font-size: 21px; right: 14px; bottom: 80px; }
      #fbw-panel { right: 12px !important; left: 12px !important; width: auto; }
    }
  `;
  document.head.appendChild(style);

  const bubble = document.createElement('div');
  bubble.id = 'fbw-bubble';
  bubble.innerHTML = '<div class="fbw-pulse"></div><span>\uD83D\uDCAC</span>';
  bubble.setAttribute('role', 'button');
  bubble.setAttribute('aria-label', 'Санал хүсэлт илгээх');
  document.body.appendChild(bubble);

  const panel = document.createElement('div');
  panel.id = 'fbw-panel';
  panel.innerHTML =
    '<div id="fbw-header">' +
      '<div>' +
        '<div class="fbw-title" id="fbw-title">\uD83D\uDCAC Санал хүсэлт</div>' +
        '<div class="fbw-sub" id="fbw-sub">Бид сайтаа сайжруулахад тань хэрэгтэй</div>' +
      '</div>' +
      '<button id="fbw-close" aria-label="Хаах">\u2715</button>' +
    '</div>' +
    '<div id="fbw-body">' +
      '<div id="fbw-step1">' +
        '<div class="fbw-q">Сайт ерөнхийдөө хэр байна?</div>' +
        '<div id="fbw-emoji-row">' +
          '<button class="fbw-emoji" data-val="1">\uD83D\uDE1E</button>' +
          '<button class="fbw-emoji" data-val="2">\uD83D\uDE10</button>' +
          '<button class="fbw-emoji" data-val="3">\uD83D\uDE42</button>' +
          '<button class="fbw-emoji" data-val="4">\uD83D\uDE00</button>' +
          '<button class="fbw-emoji" data-val="5">\uD83D\uDE0D</button>' +
        '</div>' +
      '</div>' +
      '<textarea id="fbw-textarea" placeholder="Дэлгэрэнгүй бичих үү? (заавал биш)" maxlength="1000"></textarea>' +
      '<div id="fbw-msg"></div>' +
      '<button id="fbw-send">Илгээх</button>' +
      '<button id="fbw-skip" style="display:none;">Алгасах, зөвхөн бичвэр илгээх</button>' +
    '</div>';
  document.body.appendChild(panel);

  function loadPosition() {
    try {
      const saved = JSON.parse(localStorage.getItem('fbw_position') || 'null');
      if (saved && typeof saved.right === 'number' && typeof saved.bottom === 'number') {
        bubble.style.right = saved.right + 'px';
        bubble.style.bottom = saved.bottom + 'px';
        bubble.style.left = 'auto';
        bubble.style.top = 'auto';
      }
    } catch (e) {}
  }
  function savePosition(right, bottom) {
    localStorage.setItem('fbw_position', JSON.stringify({ right: right, bottom: bottom }));
  }
  loadPosition();

  let isDragging = false;
  let dragMoved = false;
  let startX, startY, startRight, startBottom;

  function getClientPos(e) {
    if (e.touches && e.touches.length) return { x: e.touches[0].clientX, y: e.touches[0].clientY };
    return { x: e.clientX, y: e.clientY };
  }

  function onDragStart(e) {
    isDragging = true;
    dragMoved = false;
    bubble.classList.add('dragging');
    const pos = getClientPos(e);
    startX = pos.x;
    startY = pos.y;
    const rect = bubble.getBoundingClientRect();
    startRight = window.innerWidth - rect.right;
    startBottom = window.innerHeight - rect.bottom;
    document.addEventListener('mousemove', onDragMove);
    document.addEventListener('mouseup', onDragEnd);
    document.addEventListener('touchmove', onDragMove, { passive: false });
    document.addEventListener('touchend', onDragEnd);
  }

  function onDragMove(e) {
    if (!isDragging) return;
    e.preventDefault();
    const pos = getClientPos(e);
    const dx = pos.x - startX;
    const dy = pos.y - startY;
    if (Math.abs(dx) > 4 || Math.abs(dy) > 4) dragMoved = true;

    let newRight = startRight - dx;
    let newBottom = startBottom - dy;

    const size = bubble.offsetWidth;
    newRight = Math.max(4, Math.min(window.innerWidth - size - 4, newRight));
    newBottom = Math.max(4, Math.min(window.innerHeight - size - 4, newBottom));

    bubble.style.right = newRight + 'px';
    bubble.style.bottom = newBottom + 'px';
    bubble.style.left = 'auto';
    bubble.style.top = 'auto';
  }

  function onDragEnd() {
    if (!isDragging) return;
    isDragging = false;
    bubble.classList.remove('dragging');
    document.removeEventListener('mousemove', onDragMove);
    document.removeEventListener('mouseup', onDragEnd);
    document.removeEventListener('touchmove', onDragMove);
    document.removeEventListener('touchend', onDragEnd);

    const rect = bubble.getBoundingClientRect();
    const right = window.innerWidth - rect.right;
    const bottom = window.innerHeight - rect.bottom;
    savePosition(right, bottom);

    if (!dragMoved) {
      togglePanel();
    }
  }

  bubble.addEventListener('mousedown', onDragStart);
  bubble.addEventListener('touchstart', onDragStart, { passive: false });

  function positionPanel() {
    const rect = bubble.getBoundingClientRect();
    const panelWidth = Math.min(320, window.innerWidth - 32);
    let left = rect.left - panelWidth + rect.width;
    let top = rect.top - 280;

    left = Math.max(12, Math.min(window.innerWidth - panelWidth - 12, left));
    if (top < 12) top = rect.bottom + 10;

    panel.style.left = left + 'px';
    panel.style.top = top + 'px';
    panel.style.right = 'auto';
    panel.style.bottom = 'auto';
  }

  let selectedEmoji = null;

  function resetGeneralPanel() {
    selectedEmoji = null;
    const emojiDefaults = ['\uD83D\uDE1E', '\uD83D\uDE10', '\uD83D\uDE42', '\uD83D\uDE00', '\uD83D\uDE0D'];
    document.querySelectorAll('.fbw-emoji').forEach(function (b, i) {
      b.classList.remove('selected');
      b.textContent = emojiDefaults[i];
    });
    document.querySelector('.fbw-q').textContent = 'Сайт ерөнхийдөө хэр байна?';
    document.getElementById('fbw-textarea').value = '';
    document.getElementById('fbw-msg').style.display = 'none';
    document.getElementById('fbw-msg').className = '';
    document.getElementById('fbw-title').textContent = '\uD83D\uDCAC Санал хүсэлт';
    document.getElementById('fbw-sub').textContent = 'Бид сайтаа сайжруулахад тань хэрэгтэй';
    document.getElementById('fbw-step1').style.display = 'block';
    document.getElementById('fbw-skip').style.display = 'none';
    panel.dataset.mode = 'general';
    panel.dataset.service = '';
  }

  function togglePanel() {
    const isOpen = panel.classList.contains('open');
    if (isOpen) {
      panel.classList.remove('open');
    } else {
      resetGeneralPanel();
      positionPanel();
      panel.classList.add('open');
    }
  }

  document.querySelectorAll('.fbw-emoji').forEach(function (btn) {
    btn.addEventListener('click', function () {
      document.querySelectorAll('.fbw-emoji').forEach(function (b) { b.classList.remove('selected'); });
      btn.classList.add('selected');
      selectedEmoji = parseInt(btn.dataset.val, 10);
    });
  });

  document.getElementById('fbw-close').addEventListener('click', function () {
    panel.classList.remove('open');
  });

  document.addEventListener('click', function (e) {
    if (!panel.classList.contains('open')) return;
    if (panel.contains(e.target) || bubble.contains(e.target)) return;
    panel.classList.remove('open');
  });

  // ============================================================
  // FEEDBACK ИЛГЭЭХ — ТУСЛАХ ФУНКЦ (Урсгал 1 ба 2 хоёуланд ашиглана)
  // ============================================================
  async function submitFeedback(payload) {
    const token = localStorage.getItem('sb_token');
    const user = JSON.parse(localStorage.getItem('sb_user') || '{}');
    if (!token || !user.id) throw new Error('Та нэвтэрсэн байх ёстой.');

    const r = await fetch(SUPABASE_URL + '/rest/v1/feedback', {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': 'Bearer ' + token,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify(Object.assign({
        user_id: user.id,
        page: window.location.pathname.split('/').pop() || 'index.html'
      }, payload))
    });

    if (!r.ok) throw new Error('Илгээхэд алдаа гарлаа');
  }

  document.getElementById('fbw-send').addEventListener('click', async function () {
    const textarea = document.getElementById('fbw-textarea');
    const msgEl = document.getElementById('fbw-msg');
    const btn = this;
    const comment = textarea.value.trim();
    const mode = panel.dataset.mode || 'general';

    msgEl.className = '';
    msgEl.style.display = 'none';

    if (mode === 'general' && selectedEmoji === null && !comment) {
      msgEl.textContent = 'Эможоор үнэлэх эсвэл санал бичнэ үү.';
      msgEl.className = 'error';
      return;
    }
    if (mode === 'service' && selectedEmoji === null && !comment) {
      msgEl.textContent = 'Од сонгох эсвэл санал бичнэ үү.';
      msgEl.className = 'error';
      return;
    }

    btn.disabled = true;
    btn.textContent = 'Илгээж байна...';

    try {
      await submitFeedback({
        type: mode,
        service: panel.dataset.service || null,
        rating: selectedEmoji,
        comment: comment || null
      });

      msgEl.textContent = '\u2705 Баярлалаа! Санал хүсэлт хүлээн авлаа.';
      msgEl.className = 'success';
      textarea.value = '';
      setTimeout(function () { panel.classList.remove('open'); }, 1800);
    } catch (e) {
      msgEl.textContent = '\u274C Алдаа гарлаа. Дахин оролдоно уу.';
      msgEl.className = 'error';
    }

    btn.disabled = false;
    btn.textContent = 'Илгээх';
  });

  window.addEventListener('resize', function () {
    if (panel.classList.contains('open')) positionPanel();
  });

  console.log('feedback-widget.js ачаалагдлаа.');

  // ============================================================
  // УРСГАЛ 2 — AI ҪЙЛЧИЛГЭЭНИЙ ДАРААХ САНАЛ
  // ============================================================
  // services.js доторх run*() функцууд амжилттай дууссаны дараа
  // дараах функцийг дуудна:
  //   window.КиноЭзэнFeedback.showServiceRating('tts', 'TTS дуу үүсгэгч');
  // 5 секундын дараа bubble-аас автоматаар "⭐ od" асуулт гарч ирнэ.
  window.КиноЭзэнFeedback = {
    showServiceRating: function (serviceKey, serviceLabel) {
      if (!isLoggedIn()) return;
      setTimeout(function () {
        if (panel.classList.contains('open')) return; // хэрэглэгч өөр зүйл хийж байгаа бол давхар бүү гарга

        selectedEmoji = null;
        document.querySelectorAll('.fbw-emoji').forEach(function (b) { b.classList.remove('selected'); });
        document.getElementById('fbw-textarea').value = '';
        document.getElementById('fbw-msg').style.display = 'none';
        document.getElementById('fbw-msg').className = '';
        document.getElementById('fbw-title').textContent = '\u2B50 ' + (serviceLabel || serviceKey) + ' хэр сайн байсан бэ?';
        document.getElementById('fbw-sub').textContent = 'Таны үнэлгээ үйлчилгээг сайжруулахад тусална';
        document.getElementById('fbw-step1').style.display = 'block';
        document.getElementById('fbw-skip').style.display = 'none';
        panel.dataset.mode = 'service';
        panel.dataset.service = serviceKey;

        // Эможны оронд од (⭐) ашиглах — service rating-д илүү тохиромжтой
        document.querySelectorAll('.fbw-emoji').forEach(function (b) {
          const v = parseInt(b.dataset.val, 10);
          b.textContent = v <= 0 ? '' : '\u2B50'.repeat(v);
        });
        document.querySelector('.fbw-q').textContent = '1-5 хооронд үнэлнэ үү';

        // bubble-ийг анхааруулга хэлбэрээр гялалзуулна (анхаарлыг татах)
        bubble.style.animation = 'fbw-pulse 0.8s ease 2';

        positionPanel();
        panel.classList.add('open');
      }, 5000);
    }
  };
})();
