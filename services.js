// 

// services.js — КиноЭзэн AI Үйлчилгээнүүд
// КРЕДИТ СИСТЕМ + FEEDBACK ХОЛБОГДСОН ХУВИЛБАР
// ============================================================

console.log('✅ services.js ачааллаж байна...');

// ============================================================
// SUPABASE ТОХИРГОО (profile.html, login.html-тэй ИЖИЛ байх ёстой)
// ============================================================
const SUPABASE_URL = 'https://smncsxlbyyhowfarxxlz.supabase.co';
const SUPABASE_KEY = 'sb_publishable_Zjr9q57fQ5ZV-BF0StnvJA_Z1U_7qHO';

// ============================================================
// КРЕДИТ СИСТЕМ — БОДИТ SUPABASE ХОЛБОЛТ
// ============================================================

let currentBalance = 0;

function isLoggedIn() {
    return !!localStorage.getItem('sb_token');
}

async function updateCreditUI() {
    const bar = document.getElementById('credit-bar');
    const guestBar = document.getElementById('credit-bar-guest');

    if (!isLoggedIn()) {
        if (bar) bar.classList.add('hidden');
        if (guestBar) guestBar.style.display = 'block';
        return;
    }

    if (guestBar) guestBar.style.display = 'none';
    if (bar) bar.classList.remove('hidden');

    try {
        const token = localStorage.getItem('sb_token');
        const user = JSON.parse(localStorage.getItem('sb_user') || '{}');
        const userId = user.id;
        if (!userId) return;

        const r = await fetch(`${SUPABASE_URL}/rest/v1/profiles?id=eq.${userId}&select=credit_balance`, {
            headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${token}` }
        });
        const rows = await r.json();
        const balance = (rows && rows[0] && typeof rows[0].credit_balance === 'number') ? rows[0].credit_balance : 0;
        currentBalance = balance;

        const remainingEl = document.getElementById('cred-remaining');
        const totalEl = document.getElementById('cred-total');
        const fillEl = document.getElementById('cred-fill');
        const pctEl = document.getElementById('cred-pct');

        const referenceMax = Math.max(balance, 100);

        if (remainingEl) remainingEl.textContent = balance.toLocaleString('mn-MN');
        if (totalEl) totalEl.textContent = referenceMax.toLocaleString('mn-MN');

        const pct = Math.min(100, Math.round((balance / referenceMax) * 100));
        if (fillEl) fillEl.style.width = pct + '%';
        if (pctEl) pctEl.textContent = pct + '% үлдсэн';

        if (fillEl) {
            fillEl.style.background = pct < 15
                ? 'linear-gradient(90deg,#e63946,#f4a261)'
                : 'linear-gradient(90deg,#4ade80,#f4a261)';
        }
    } catch (e) {
        console.error('Credit balance fetch error:', e);
    }
}

async function spendCreditsOrFail(amount, service, description, noticeId) {
    if (!isLoggedIn()) {
        window.location.href = 'login.html';
        return false;
    }

    const token = localStorage.getItem('sb_token');
    const noticeEl = noticeId ? document.getElementById(noticeId) : null;
    if (noticeEl) noticeEl.style.display = 'none';

    try {
        const r = await fetch(`${SUPABASE_URL}/rest/v1/rpc/spend_credits`, {
            method: 'POST',
            headers: {
                'apikey': SUPABASE_KEY,
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                p_amount: amount,
                p_service: service,
                p_description: description
            })
        });

        if (!r.ok) {
            const err = await r.json().catch(() => ({}));
            const msg = (err.message || '').toLowerCase();
            if (msg.includes('хүрэлцэхгүй') || msg.includes('insufficient') || r.status === 400) {
                if (noticeEl) noticeEl.style.display = 'block';
                else showToast('💎 Кредит хүрэлцэхгүй байна!', 'error');
            } else {
                showToast('❌ Кредит хасах үед алдаа гарлаа.', 'error');
            }
            return false;
        }

        const newBalance = await r.json();
        currentBalance = newBalance;
        updateCreditUI();
        return true;
    } catch (e) {
        console.error('spendCreditsOrFail error:', e);
        showToast('❌ Сүлжээний алдаа гарлаа.', 'error');
        return false;
    }
}

// ============================================================
// FEEDBACK ХОЛБОЛТ — Урсгал 2 (AI үйлчилгээний дараах ⭐ үнэлгээ)
// ============================================================
function triggerServiceFeedback(serviceKey, serviceLabel) {
    try {
        if (window.КиноЭзэнFeedback && typeof window.КиноЭзэнFeedback.showServiceRating === 'function') {
            window.КиноЭзэнFeedback.showServiceRating(serviceKey, serviceLabel);
        }
    } catch (e) {
        console.warn('Feedback widget дуудахад алдаа гарлаа:', e);
    }
}

// ===== TOAST МЭДЭГДЭЛ =====
function showToast(message, type = 'info') {
    const old = document.querySelector('.toast');
    if (old) old.remove();
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    toast.style.cssText = `
        position: fixed; bottom: 100px; left: 50%; transform: translateX(-50%);
        background: ${type === 'success' ? 'rgba(74,222,128,0.15)' : 'rgba(255,255,255,0.08)'};
        color: ${type === 'success' ? '#4ade80' : '#fff'};
        padding: 12px 24px; border-radius: 12px; font-size: 14px; font-weight: 600;
        font-family: 'Nunito', sans-serif; z-index: 9999;
        border: 1px solid ${type === 'success' ? 'rgba(74,222,128,0.3)' : 'rgba(255,255,255,0.1)'};
        backdrop-filter: blur(12px); box-shadow: 0 8px 32px rgba(0,0,0,0.4);
        transition: all 0.3s; pointer-events: none;
    `;
    document.body.appendChild(toast);
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(-50%) translateY(20px)';
        setTimeout(() => toast.remove(), 400);
    }, 3000);
}

// ============================================================
// TTS — ДУУ ҲСГЭГЧ (3 хоолойтой: Edge / Gemini / Дорж-Байгалийн)
// ============================================================

let ttsEngine = 'edge';
const TTS_CHAR_LIMITS = { edge: 5000, gemini: 500, natural: 300 };

// ЗАСВАР: Инженер тус бүрийн кредит тооцоолол
//   - edge:    50 тэмдэгт = 1 кредит
//   - natural (Дорж): 1 тэмдэгт = 1 кредит
//   - gemini:  1 тэмдэгт = 2 кредит
function calcTTSCost(text, engine) {
    const len = text.length;
    if (engine === 'gemini') return len * 2;
    if (engine === 'natural') return len;
    return Math.max(1, Math.ceil(len / 50)); // edge
}

function selEngine(engine, el) {
    ttsEngine = engine;
    document.querySelectorAll('#engine-edge, #engine-gemini, #engine-natural').forEach(b => b.classList.remove('on'));
    el.classList.add('on');

    const edgeRow = document.getElementById('edge-voice-row');
    const geminiRow = document.getElementById('gemini-voice-row');
    const naturalRow = document.getElementById('natural-voice-row');
    if (edgeRow) edgeRow.style.display = engine === 'edge' ? 'block' : 'none';
    if (geminiRow) geminiRow.style.display = engine === 'gemini' ? 'block' : 'none';
    if (naturalRow) naturalRow.style.display = engine === 'natural' ? 'block' : 'none';

    updateTTSCount();
}

function updateTTSCount() {
    const textEl = document.getElementById('tts-text');
    if (!textEl) return;
    const len = textEl.value.length;
    const limit = TTS_CHAR_LIMITS[ttsEngine];
    const countEl = document.getElementById('char-count');
    if (countEl) {
        countEl.textContent = len + '/' + limit;
        countEl.style.color = len > limit ? '#e63946' : '#4ade80';
    }
}

function selVoice(el) {
    document.querySelectorAll('#edge-voice-row .vbtn').forEach(b => b.classList.remove('on'));
    el.classList.add('on');
}

async function runTTS() {
    const text = document.getElementById('tts-text')?.value.trim();
    if (!text) { showToast('⚠️ Текст оруулна уу!', 'error'); return; }

    const limit = TTS_CHAR_LIMITS[ttsEngine];
    if (text.length > limit) {
        showToast(`⚠️ Текст хэт урт (${limit} тэмдэгтээс ихгуй байх ёстой)`, 'error');
        return;
    }

    const btn = document.getElementById('tts-run-btn');
    if (btn) { btn.disabled = true; btn.textContent = '⏳ Шалгаж байна...'; }

    // ЗАСВАР: Кредит хасалт нэмэгдсэн — инженер тус бүрээр өөр тариф
    const cost = calcTTSCost(text, ttsEngine);
    const engineLabel = ttsEngine === 'gemini' ? 'Gemini' : (ttsEngine === 'natural' ? 'Дорж' : 'Edge');
    const ok = await spendCreditsOrFail(cost, 'tts', `TTS (${engineLabel}): ${text.length} тэмдэгт`, 'tts-notice');
    if (!ok) { if (btn) { btn.disabled = false; btn.textContent = '▶ Дуу үүсгэх'; } return; }

    const resultDiv = document.getElementById('tts-result');
    const isNatural = ttsEngine === 'natural';

    if (btn) btn.textContent = '⏳ Үүсгэж байна...';

    if (resultDiv) {
        resultDiv.classList.add('show');
        resultDiv.innerHTML = `<div class="result-label">⏳ Дуу үүсгэж байна...</div>
        <div id="tts-wake-msg" style="font-size:12px;color:#f4a261;margin-top:4px;display:none;">🌙 Сервер сэрж байна — түр хүлээнэ үү...</div>
        <div style="background:rgba(255,255,255,0.08);border-radius:99px;height:8px;overflow:hidden;margin-top:8px;">
            <div id="tts-progress-bar" style="background:linear-gradient(90deg,#4ade80,#f4a261);height:100%;width:0%;transition:width 0.3s;"></div>
        </div>
        <div id="tts-progress-text" style="font-size:12px;color:rgba(255,255,255,0.4);margin-top:6px;">0%</div>`;
    }

    let fakeProgress = 0;
    const wakeMsgEl = () => document.getElementById('tts-wake-msg');
    const startTime = Date.now();

    const progressInterval = setInterval(() => {
        const elapsedSec = (Date.now() - startTime) / 1000;

        if (elapsedSec > 10) {
            const wm = wakeMsgEl();
            if (wm) wm.style.display = 'block';
        }

        if (fakeProgress < 95) {
            const step = isNatural ? Math.random() * 2 : Math.random() * 8;
            fakeProgress += step;
            if (fakeProgress > 95) fakeProgress = 95;
            const bar = document.getElementById('tts-progress-bar');
            const txt = document.getElementById('tts-progress-text');
            if (bar) bar.style.width = fakeProgress + '%';
            if (txt) txt.textContent = Math.round(fakeProgress) + '%';
        }
    }, 400);

    try {
        const rate = document.getElementById('rate')?.value || 15;
        const pitch = document.getElementById('pitch')?.value || -8;

        let body;
        if (ttsEngine === 'gemini') {
            const geminiVoice = document.getElementById('gemini-voice-select')?.value || 'Лхагваа (эрэгтэй)';
            body = { text, engine: 'gemini', geminiVoice, rate: Number(rate), pitch: Number(pitch), volume: 0 };
        } else if (ttsEngine === 'natural') {
            body = { text, engine: 'natural' };
        } else {
            const voiceText = document.querySelector('#edge-voice-row .vbtn.on')?.textContent.trim() || 'Батаа';
            body = {
                text,
                engine: 'edge',
                voice: voiceText,
                rate: Number(rate),
                pitch: Number(pitch),
                volume: 0
            };
        }

        const response = await fetch('/api/tts', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Дуу үүсгэх уед алдаа гарлаа');
        if (!data.audioUrl) throw new Error('Дуу уусгэгдсэн ч URL олдсонгуй');

        clearInterval(progressInterval);
        const bar = document.getElementById('tts-progress-bar');
        const txt = document.getElementById('tts-progress-text');
        if (bar) bar.style.width = '100%';
        if (txt) txt.textContent = '100%';
        const wm = wakeMsgEl();
        if (wm) wm.style.display = 'none';

        setTimeout(() => {
            if (resultDiv) {
                const mimeMatch = data.audioUrl.match(/^data:([^;]+);/);
                const mimeType = mimeMatch ? mimeMatch[1] : 'audio/mpeg';
                resultDiv.innerHTML = `<div class="result-label">✅ Дуу бэлэн</div>
                <audio controls style="width:100%;border-radius:8px;margin-top:6px;">
                    <source src="${data.audioUrl}" type="${mimeType}">
                </audio>
                <div style="font-size:10px;color:rgba(255,255,255,0.25);margin-top:4px;">debug: ${mimeType}, len=${data.audioUrl.length}</div>`;
            }
        }, 400);

        showToast('✅ Дуу амжилттай үүсгэгдлээ!', 'success');
        triggerServiceFeedback('tts', 'Монгол TTS');
    } catch (error) {
        clearInterval(progressInterval);
        if (resultDiv) resultDiv.classList.remove('show');
        console.error('TTS error:', error);
        showToast('❌ ' + error.message, 'error');
    }

    if (btn) { btn.disabled = false; btn.textContent = '▶ Дуу үүсгэх'; }
}

// ============================================================
// ОРЧУУЛАГЧ — 1 тэмдэгт = 2 кредит
// ============================================================
async function runTranslate() {
    const text = document.getElementById('trans-input')?.value.trim();
    if (!text) { showToast('⚠️ Текст оруулна уу!', 'error'); return; }
    const btn = event.target;
    if (btn) { btn.disabled = true; btn.textContent = '⏳ Шалгаж байна...'; }

    const cost = Math.max(1, Math.ceil(text.length / 10));
    const ok = await spendCreditsOrFail(cost, 'translate', `Орчуулга: ${text.length} тэмдэгт`, 'trans-notice');
    if (!ok) { if (btn) { btn.disabled = false; btn.textContent = '🌐 Орчуулах'; } return; }

    if (btn) btn.textContent = '⏳ Орчуулж байна...';
    try {
        const from = document.getElementById('trans-from')?.value || 'en';
        const to = document.getElementById('trans-to')?.value || 'mn';

        const response = await fetch('/api/translate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text, from, to })
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Орчуулах үед алдаа гарлаа');

        const resultDiv = document.getElementById('trans-result');
        if (resultDiv) {
            resultDiv.classList.add('show');
            resultDiv.innerHTML = `<div class="result-label">✅ Орчуулга</div>
            <div style="font-size:14px;line-height:1.7;color:rgba(255,255,255,0.8);">${data.translatedText}</div>`;
        }
        showToast('✅ Орчуулга амжилттай!', 'success');
        triggerServiceFeedback('translate', 'Орчуулагч');
    } catch (error) {
        console.error('Translate error:', error);
        showToast('❌ ' + error.message, 'error');
    }
    if (btn) { btn.disabled = false; btn.textContent = '🌐 Орчуулах'; }
}

// ============================================================
// HUMANIZER — 1 тэмдэгт = 1 кредит
// ============================================================
async function runHum() {
    const text = document.getElementById('hum-input')?.value.trim();
    if (!text) { showToast('⚠️ Текст оруулна уу!', 'error'); return; }
    const btn = event.target;
    if (btn) { btn.disabled = true; btn.textContent = '⏳ Шалгаж байна...'; }

    const cost = Math.max(1, Math.ceil(text.length / 5));
    const ok = await spendCreditsOrFail(cost, 'humanizer', `Humanizer: ${text.length} тэмдэгт`, 'hum-notice');
    if (!ok) { if (btn) { btn.disabled = false; btn.textContent = '✨ Хүмүүнжүүлэх'; } return; }

    if (btn) btn.textContent = '⏳ Хүмүүнжүүлж байна...';
    try {
        const response = await fetch('/api/humanize', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text })
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Хүмүүнжүүлэх үед алдаа гарлаа');
        const beforeEl = document.getElementById('hum-before');
        const afterEl = document.getElementById('hum-after');
        const resultEl = document.getElementById('hum-result');
        if (beforeEl) beforeEl.textContent = data.original;
        if (afterEl) afterEl.textContent = data.humanized;
        if (resultEl) resultEl.style.display = 'grid';
        showToast('✅ Хүмүүнжүүлэлт амжилттай!', 'success');
        triggerServiceFeedback('humanizer', 'Humanizer');
    } catch (error) {
        console.error('Humanizer error:', error);
        showToast('❌ ' + error.message, 'error');
    }
    if (btn) { btn.disabled = false; btn.textContent = '✨ Хүмүүнжүүлэх'; }
}
// ============================================================
// SRT СУБТИТР ОРЧУУЛАГЧ — 10 кредит/файл
// ============================================================
function selSrtMode(mode, el) {
    document.querySelectorAll('#srt-mode-file, #srt-mode-text').forEach(b => b.classList.remove('on'));
    el.classList.add('on');
    document.getElementById('srt-file-row').style.display = mode === 'file' ? 'block' : 'none';
    document.getElementById('srt-text-row').style.display = mode === 'text' ? 'block' : 'none';
}

function handleSrtFile(e) {
    const f = e.target.files[0];
    if (f) document.getElementById('srt-file-name').textContent = f.name;
}
function handleSrtDrop(e) {
    e.preventDefault();
    const f = e.dataTransfer.files[0];
    if (f) {
        document.getElementById('srt-file').files = e.dataTransfer.files;
        document.getElementById('srt-file-name').textContent = f.name;
    }
}

async function runSrtTranslate() {
    const fileMode = document.getElementById('srt-mode-file')?.classList.contains('on');
    const btn = event.target;

    let srtContent = '';
    if (fileMode) {
        const file = document.getElementById('srt-file')?.files[0];
        if (!file) { showToast('⚠️ SRT файл оруулна уу!', 'error'); return; }
        srtContent = await file.text();
    } else {
        srtContent = document.getElementById('srt-text-input')?.value.trim();
        if (!srtContent) { showToast('⚠️ SRT агуулга оруулна уу!', 'error'); return; }
    }

    if (btn) { btn.disabled = true; btn.textContent = '⏳ Шалгаж байна...'; }

    const ok = await spendCreditsOrFail(10, 'srt-translate', 'SRT субтитр орчуулагч', 'srt-translate-notice');
    if (!ok) { if (btn) { btn.disabled = false; btn.textContent = '📄 Орчуулах'; } return; }

    if (btn) btn.textContent = '⏳ Орчуулж байна...';
    try {
        const targetLang = document.getElementById('srt-target-lang')?.value || 'mn';

        const response = await fetch('/api/srt-translate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ srtContent: srtContent, targetLang })
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Орчуулах үед алдаа гарлаа');

        const resultDiv = document.getElementById('srt-translate-result');
        if (resultDiv) {
            resultDiv.classList.add('show');
            resultDiv.innerHTML = `<div class="result-label">📄 Орчуулагдсан SRT</div>
            <textarea readonly style="height:160px;font-family:monospace;font-size:11px;">${data.translatedSrt || ''}</textarea>
            <button onclick="downloadSrt(this)" data-content="${encodeURIComponent(data.translatedSrt || '')}" style="margin-top:8px;padding:8px 16px;border-radius:8px;background:rgba(74,222,128,0.12);border:1px solid rgba(74,222,128,0.25);color:#4ade80;font-size:12px;cursor:pointer;">⬇️ .srt файл татах</button>`;
        }
        showToast('✅ SRT орчуулга амжилттай!', 'success');
        triggerServiceFeedback('srt-translate', 'SRT субтитр орчуулагч');
    } catch (error) {
        console.error('SrtTranslate error:', error);
        showToast('❌ ' + error.message, 'error');
    }
    if (btn) { btn.disabled = false; btn.textContent = '📄 Орчуулах'; }
}

function downloadSrt(btn) {
    const content = decodeURIComponent(btn.dataset.content || '');
    const blob = new Blob([content], { type: 'text/plain' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'translated.srt';
    link.click();
}

// ============================================================
// SCRIPT БИЧИГЧ — 5 кредит/script
// ============================================================
async function runScriptWriter() {
    const topic = document.getElementById('script-writer-input')?.value.trim();
    if (!topic) { showToast('⚠️ Сэдэв оруулна уу!', 'error'); return; }
    const btn = event.target;
    if (btn) { btn.disabled = true; btn.textContent = '⏳ Шалгаж байна...'; }

    const ok = await spendCreditsOrFail(10, 'script-writer', `Script бичигч: ${topic.slice(0,40)}`, 'script-writer-notice');
    if (!ok) { if (btn) { btn.disabled = false; btn.textContent = '✍️ Script бичих'; } return; }

    if (btn) btn.textContent = '⏳ Бичиж байна...';
    try {
        const scriptType = document.querySelector('input[name="script-type"]:checked')?.value || 'youtube';
        const length = document.getElementById('script-writer-length')?.value || 'medium';

        const response = await fetch('/api/script-writer', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ topic, type: scriptType, length })
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Script бичих үед алдаа гарлаа');

        const resultDiv = document.getElementById('script-writer-result');
        if (resultDiv) {
            resultDiv.classList.add('show');
            resultDiv.innerHTML = `<div class="result-label">✍️ Script</div>
            <div style="font-size:14px;line-height:1.8;color:rgba(255,255,255,0.85);white-space:pre-wrap;">${data.script}</div>
            <button onclick="copyText(this)" style="margin-top:8px;padding:6px 14px;border-radius:6px;background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.1);color:rgba(255,255,255,0.5);font-size:11px;cursor:pointer;">📋 Хуулах</button>`;
        }
        showToast('✅ Script амжилттай бичигдлээ!', 'success');
        triggerServiceFeedback('script-writer', 'Script бичигч');
    } catch (error) {
        console.error('ScriptWriter error:', error);
        showToast('❌ ' + error.message, 'error');
    }
    if (btn) { btn.disabled = false; btn.textContent = '✍️ Script бичих'; }
}

// ============================================================
// STT (Дуу → Текст) — 1 мин = 10 кредит
// ============================================================
async function runSTT() {
    const fileInput = document.getElementById('stt-file');
    if (!fileInput?.files || fileInput.files.length === 0) {
        showToast('⚠️ Аудио файл оруулна уу!', 'error');
        return;
    }
    const btn = event.target;
    if (btn) { btn.disabled = true; btn.textContent = '⏳ Шалгаж байна...'; }

    const file = fileInput.files[0];
    const estimatedMinutes = Math.max(1, Math.ceil(file.size / (1024 * 1024)));
    const cost = estimatedMinutes * 50;

    const ok = await spendCreditsOrFail(cost, 'stt', `STT: ~${estimatedMinutes} мин`, 'stt-notice');
    if (!ok) { if (btn) { btn.disabled = false; btn.textContent = '🎙️ Текст болгох'; } return; }

    if (btn) btn.textContent = '⏳ Боловсруулж байна...';
    const resultDiv = document.getElementById('stt-result');
    try {
        const audioUrl = URL.createObjectURL(file);
        if (resultDiv) {
            resultDiv.classList.add('show');
            resultDiv.innerHTML = `<div class="result-label">⏳ Текст рүү хөрвүүлж байна...</div>
            <audio controls style="width:100%;border-radius:8px;margin-bottom:10px;">
                <source src="${audioUrl}">
            </audio>`;
        }

        const formData = new FormData();
        formData.append('audio', file);

        const response = await fetch('/api/stt', {
            method: 'POST',
            body: formData
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Текст рүү хөрвүүлэх үед алдаа гарлаа');
        if (!data.transcript) throw new Error('Транскрипц ирсэнгуй');

        if (resultDiv) {
            resultDiv.innerHTML = `<div class="result-label">🎙️ Текст болсон</div>
            <audio controls style="width:100%;border-radius:8px;margin-bottom:10px;">
                <source src="${audioUrl}">
            </audio>
            <div id="stt-text-result" style="margin-top:10px;padding:12px;background:rgba(255,255,255,0.03);border-radius:8px;color:rgba(255,255,255,0.8);font-size:14px;line-height:1.7;white-space:pre-wrap;">${data.transcript}</div>
            <button onclick="copyText(this)" style="margin-top:8px;padding:6px 14px;border-radius:6px;background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.1);color:rgba(255,255,255,0.5);font-size:11px;cursor:pointer;">📋 Хуулах</button>`;
        }
        showToast('✅ Текст амжилттай гарлаа!', 'success');
        triggerServiceFeedback('stt', 'Дуу → Текст');
    } catch (error) {
        if (resultDiv) resultDiv.classList.remove('show');
        console.error('STT error:', error);
        showToast('❌ ' + error.message, 'error');
    }
    if (btn) { btn.disabled = false; btn.textContent = '🎙️ Текст болгох'; }
}
// ============================================================
// ТЕКСТ ЗАСАГЧ — 1 тэмдэгт = 1 кредит
// ============================================================
async function runTextEdit() {
    const text = document.getElementById('textedit-input')?.value.trim();
    if (!text) { showToast('⚠️ Текст оруулна уу!', 'error'); return; }
    const btn = event.target;
    if (btn) { btn.disabled = true; btn.textContent = '⏳ Шалгаж байна...'; }

    const cost = Math.max(1, Math.ceil(text.length / 10));
    const ok = await spendCreditsOrFail(cost, 'textedit', `Текст засагч: ${text.length} тэмдэгт`, 'textedit-notice');
    if (!ok) { if (btn) { btn.disabled = false; btn.textContent = '📝 Засах'; } return; }

    if (btn) btn.textContent = '⏳ Засаж байна...';
    try {
        const fixGrammar = document.getElementById('fix-grammar')?.checked ?? true;
        const fixPunctuation = document.getElementById('fix-punctuation')?.checked ?? true;

        const response = await fetch('/api/textedit', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text, fixGrammar, fixPunctuation })
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Засах үед алдаа гарлаа');

        const beforeEl = document.getElementById('textedit-before');
        const afterEl = document.getElementById('textedit-after');
        const resultEl = document.getElementById('textedit-result');
        if (beforeEl) beforeEl.textContent = data.original;
        if (afterEl) afterEl.textContent = data.edited;
        if (resultEl) resultEl.style.display = 'grid';
        showToast('✅ Текст амжилттай засагдлаа!', 'success');
        triggerServiceFeedback('textedit', 'Текст засагч');
    } catch (error) {
        console.error('TextEdit error:', error);
        showToast('❌ ' + error.message, 'error');
    }
    if (btn) { btn.disabled = false; btn.textContent = '📝 Засах'; }
}

// ============================================================
// КИНО ТОЙМЧ — 5 кредит
// ============================================================
async function runMovieReview() {
    const movieName = document.getElementById('movie-review-input')?.value.trim();
    if (!movieName) { showToast('⚠️ Кино нэр оруулна уу!', 'error'); return; }

    const btn = event.target;
    if (btn) { btn.disabled = true; btn.textContent = '⏳ Шалгаж байна...'; }

    const ok = await spendCreditsOrFail(10, 'movie-review', `Кино тойм: ${movieName}`, 'movie-review-notice');
    if (!ok) { if (btn) { btn.disabled = false; btn.textContent = '🎬 Тойм бичих'; } return; }

    if (btn) btn.textContent = '⏳ Тойм бичиж байна...';
    try {
        const response = await fetch('/api/movie-review', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ title: movieName, length: 'medium' })
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Тойм бичих үед алдаа гарлаа');

        const resultDiv = document.getElementById('movie-review-result');
        if (resultDiv) {
            resultDiv.classList.add('show');
            resultDiv.innerHTML = `<div class="result-label">🎬 Тойм</div>
            <div style="font-size:14px;line-height:1.8;color:rgba(255,255,255,0.85);white-space:pre-wrap;">${data.review}</div>
            <button onclick="copyText(this)" style="margin-top:8px;padding:6px 14px;border-radius:6px;background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.1);color:rgba(255,255,255,0.5);font-size:11px;cursor:pointer;">📋 Хуулах</button>`;
        }
        showToast('✅ Тойм амжилттай!', 'success');
        triggerServiceFeedback('movie-review', 'Кино тоймч');
    } catch (error) {
        console.error('MovieReview error:', error);
        showToast('❌ ' + error.message, 'error');
    }

    if (btn) { btn.disabled = false; btn.textContent = '🎬 Тойм бичих'; }
}

// ============================================================
// СУБТИТР НИЙЛҮҮЛЭГЧ — 50 кредит
// ============================================================
async function runMergeSubtitle() {
    const videoFile = document.getElementById('merge-video-file')?.files[0];
    const srtFile = document.getElementById('merge-srt-file')?.files[0];
    if (!videoFile) { showToast('⚠️ Видео файл оруулна уу!', 'error'); return; }
    if (!srtFile) { showToast('⚠️ SRT файл оруулна уу!', 'error'); return; }
    const btn = event.target;
    if (btn) { btn.disabled = true; btn.textContent = '⏳ Шалгаж байна...'; }

    const ok = await spendCreditsOrFail(50, 'merge-subtitle', 'Субтитр нийлүүлэгч', 'merge-sub-notice');
    if (!ok) { if (btn) { btn.disabled = false; btn.textContent = '🎞️ Нийлүүлэх'; } return; }

    if (btn) btn.textContent = '⏳ Боловсруулж байна...';
    setTimeout(() => {
        const resultDiv = document.getElementById('merge-sub-result');
        if (resultDiv) {
            resultDiv.classList.add('show');
            resultDiv.innerHTML = `<div class="result-label">🎞️ Нийлүүлэлт бэлэн</div>
            <div style="font-size:14px;color:rgba(255,255,255,0.7);line-height:1.7;">
                ✅ Видео + SRT нийлүүлэгдлээ!<br>
                📁 Файлын хэмжээ: ${(videoFile.size / 1024 / 1024).toFixed(1)} MB<br>
                <button onclick="downloadMergeSub()" style="margin-top:10px;padding:10px 20px;border-radius:10px;background:linear-gradient(90deg,#4ade80,#f4a261);border:none;color:#0a2a0a;font-size:13px;font-weight:700;cursor:pointer;">⬇️ Татаж авах (демо)</button>
            </div>`;
        }
        showToast('✅ Нийлүүлэлт амжилттай!', 'success');
        triggerServiceFeedback('merge-subtitle', 'Субтитр нийлүүлэгч');
        if (btn) { btn.disabled = false; btn.textContent = '🎞️ Нийлүүлэх'; }
    }, 1500);
}
function downloadMergeSub() {
    const blob = new Blob(['Demo video with subtitles'], { type: 'video/mp4' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'merged_video.mp4';
    link.click();
}

// ============================================================
// ВИДЕО ХУВААГЧ — 30 кредит
// ============================================================
async function runVideoSplit() {
    const file = document.getElementById('vsplit-file')?.files[0];
    if (!file) { showToast('⚠️ Видео файл оруулна уу!', 'error'); return; }
    const btn = event.target;
    if (btn) { btn.disabled = true; btn.textContent = '⏳ Шалгаж байна...'; }

    const ok = await spendCreditsOrFail(30, 'video-split', 'Видео хуваагч', 'video-split-notice');
    if (!ok) { if (btn) { btn.disabled = false; btn.textContent = '✂️ Хуваах'; } return; }

    if (btn) btn.textContent = '⏳ Хувааж байна...';
    setTimeout(() => {
        const resultDiv = document.getElementById('video-split-result');
        if (resultDiv) {
            resultDiv.classList.add('show');
            resultDiv.innerHTML = `<div class="result-label">✂️ Видео хуваагдал</div>
            <div style="font-size:14px;color:rgba(255,255,255,0.7);line-height:1.7;">
                ✅ Видео амжилттай хуваагдал!<br>
                📁 Файлын хэмжээ: ${(file.size / 1024 / 1024).toFixed(1)} MB<br>
                <div style="margin-top:12px;padding:12px;background:rgba(74,222,128,0.08);border-radius:8px;border:1px solid rgba(74,222,128,0.15);">
                    ⚠️ Бүрэн функц нь төлбөртэй API шаарддаг.<br>
                    🎬 Демо хувилбар
                </div>
            </div>`;
        }
        showToast('✅ Видео хуваагдал амжилттай!', 'success');
        triggerServiceFeedback('video-split', 'Видео хуваагч');
        if (btn) { btn.disabled = false; btn.textContent = '✂️ Хуваах'; }
    }, 1500);
}

// ============================================================
// ДҮРИЙН НЭР ОРЧУУЛАГЧ — 1 нэр = 2 кредит
// ============================================================
function toggleNameTranslateTarget() {
    const sourceLang = document.getElementById('name-translate-lang')?.value;
    const targetRow = document.getElementById('name-translate-target-row');
    if (targetRow) {
        targetRow.style.display = sourceLang === 'mn' ? 'block' : 'none';
    }
}

async function runNameTranslate() {
    const text = document.getElementById('name-translate-input')?.value.trim();
    if (!text) { showToast('⚠️ Нэрс оруулна уу!', 'error'); return; }
    const btn = event.target;
    if (btn) { btn.disabled = true; btn.textContent = '⏳ Шалгаж байна...'; }

    const nameCount = text.split('\n').filter(l => l.trim()).length;
    const cost = nameCount * 2;
    const ok = await spendCreditsOrFail(cost, 'name-translate', `Нэр орчуулга: ${nameCount} нэр`, 'name-translate-notice');
    if (!ok) { if (btn) { btn.disabled = false; btn.textContent = '🎭 Орчуулах'; } return; }

    if (btn) btn.textContent = '⏳ Орчуулж байна...';
    try {
        const sourceLang = document.getElementById('name-translate-lang')?.value || 'en';
        const targetLang = document.getElementById('name-translate-target')?.value || 'en';

        const response = await fetch('/api/name-translate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ names: text, sourceLang, targetLang })
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Орчуулах үед алдаа гарлаа');

        const resultDiv = document.getElementById('name-translate-result');
        if (resultDiv) {
            resultDiv.classList.add('show');
            resultDiv.innerHTML = `<div class="result-label">🎭 Орчуулга</div>
            <div style="font-size:14px;line-height:1.8;color:rgba(255,255,255,0.8);">
                ${data.translations.map(t => `<div style="padding:4px 0;border-bottom:1px solid rgba(255,255,255,0.04);">${t.original} → ${t.translated}</div>`).join('')}
            </div>`;
        }
        showToast('✅ Нэрс амжилттай орчуулагдлаа!', 'success');
        triggerServiceFeedback('name-translate', 'Дүрийн нэр орчуулагч');
    } catch (error) {
        console.error('NameTranslate error:', error);
        showToast('❌ ' + error.message, 'error');
    }
    if (btn) { btn.disabled = false; btn.textContent = '🎭 Орчуулах'; }
}

// ============================================================
// ПОСТ ҮҮСГЭГЧ — 3 кредит
// ============================================================
async function runPostGen() {
    const text = document.getElementById('post-gen-input')?.value.trim();
    if (!text) { showToast('⚠️ Агуулга оруулна уу!', 'error'); return; }
    const btn = event.target;
    if (btn) { btn.disabled = true; btn.textContent = '⏳ Шалгаж байна...'; }

    const ok = await spendCreditsOrFail(3, 'post-gen', 'Пост үүсгэгч', 'post-gen-notice');
    if (!ok) { if (btn) { btn.disabled = false; btn.textContent = '📱 Пост үүсгэх'; } return; }

    if (btn) btn.textContent = '⏳ Үүсгэж байна...';
    try {
        const platform = document.querySelector('input[name="post-platform"]:checked')?.value || 'facebook';
        const platformNames = { facebook: 'Facebook', instagram: 'Instagram' };

        const response = await fetch('/api/post-gen', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ content: text, platform })
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Пост үүсгэх үед алдаа гарлаа');

        const resultDiv = document.getElementById('post-gen-result');
        if (resultDiv) {
            resultDiv.classList.add('show');
            resultDiv.innerHTML = `<div class="result-label">📱 ${platformNames[platform]} пост</div>
            <div style="font-size:14px;line-height:1.8;color:rgba(255,255,255,0.85);white-space:pre-wrap;">${data.post}</div>
            <button onclick="copyText(this)" style="margin-top:8px;padding:6px 14px;border-radius:6px;background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.1);color:rgba(255,255,255,0.5);font-size:11px;cursor:pointer;">📋 Хуулах</button>`;
        }
        showToast('✅ Пост амжилттай үүсгэгдлээ!', 'success');
        triggerServiceFeedback('post-gen', 'Пост үүсгэгч');
    } catch (error) {
        console.error('PostGen error:', error);
        showToast('❌ ' + error.message, 'error');
    }
    if (btn) { btn.disabled = false; btn.textContent = '📱 Пост үүсгэх'; }
}

// ============================================================
// THUMBNAIL ГАРЧИГ — 2 кредит
// ============================================================
async function runThumbnail() {
    const text = document.getElementById('thumbnail-input')?.value.trim();
    if (!text) { showToast('⚠️ Агуулга оруулна уу!', 'error'); return; }
    const btn = event.target;
    if (btn) { btn.disabled = true; btn.textContent = '⏳ Шалгаж байна...'; }

    const ok = await spendCreditsOrFail(2, 'thumbnail', 'Thumbnail гарчиг', 'thumbnail-notice');
    if (!ok) { if (btn) { btn.disabled = false; btn.textContent = '🖼️ Гарчиг үүсгэх'; } return; }

    if (btn) btn.textContent = '⏳ Үүсгэж байна...';
    try {
        const response = await fetch('/api/thumbnail', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ content: text })
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Гарчиг үүсгэх үед алдаа гарлаа');

        const resultDiv = document.getElementById('thumbnail-result');
        if (resultDiv) {
            resultDiv.classList.add('show');
            resultDiv.innerHTML = `<div class="result-label">🖼️ Thumbnail гарчиг</div>
            <div style="font-size:16px;font-weight:700;color:#fff;padding:12px;background:rgba(74,222,128,0.08);border-radius:8px;border:1px solid rgba(74,222,128,0.15);">${data.title}</div>
            <button onclick="copyText(this)" style="margin-top:8px;padding:6px 14px;border-radius:6px;background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.1);color:rgba(255,255,255,0.5);font-size:11px;cursor:pointer;">📋 Хуулах</button>`;
        }
        showToast('✅ Гарчиг амжилттай үүсгэгдлээ!', 'success');
        triggerServiceFeedback('thumbnail', 'Thumbnail гарчиг');
    } catch (error) {
        console.error('Thumbnail error:', error);
        showToast('❌ ' + error.message, 'error');
    }
    if (btn) { btn.disabled = false; btn.textContent = '🖼️ Гарчиг үүсгэх'; }
}

// ============================================================
// ТРАНСКРИПТ ЗАСАГЧ — 1 тэмдэгт = 1 кредит
// ============================================================
const TRANSCRIPT_CLEAN_LIMIT = 6000;

function updateTranscriptCleanCount() {
    const textEl = document.getElementById('transcript-clean-input');
    const countEl = document.getElementById('transcript-clean-count');
    if (!textEl || !countEl) return;
    const len = textEl.value.length;
    countEl.textContent = len + '/' + TRANSCRIPT_CLEAN_LIMIT;
    countEl.style.color = len > TRANSCRIPT_CLEAN_LIMIT ? '#e63946' : '#4ade80';
}

async function runTranscriptClean() {
    const text = document.getElementById('transcript-clean-input')?.value.trim();
    if (!text) { showToast('⚠️ Текст оруулна уу!', 'error'); return; }
    if (text.length > TRANSCRIPT_CLEAN_LIMIT) {
        showToast(`⚠️ Текст ${TRANSCRIPT_CLEAN_LIMIT} тэмдэгтээс ихгуй байх ёстой`, 'error');
        return;
    }
    const btn = event.target;
    if (btn) { btn.disabled = true; btn.textContent = '⏳ Шалгаж байна...'; }

    const cost = text.length;
    const ok = await spendCreditsOrFail(cost, 'transcript-clean', `Транскрипт цэвэрлэгч: ${text.length} тэмдэгт`, 'transcript-clean-notice');
    if (!ok) { if (btn) { btn.disabled = false; btn.textContent = '🧹 Цэвэрлэх'; } return; }

    if (btn) btn.textContent = '⏳ Цэвэрлэж байна...';
    try {
        const removeFillers = document.getElementById('clean-fillers')?.checked ?? true;
        const removeRepeats = document.getElementById('clean-repeat')?.checked ?? true;

        const response = await fetch('/api/transcript-clean', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text, removeFillers, removeRepeats })
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Цэвэрлэх үед алдаа гарлаа');

        const beforeEl = document.getElementById('transcript-clean-before');
        const afterEl = document.getElementById('transcript-clean-after');
        const resultEl = document.getElementById('transcript-clean-result');
        if (beforeEl) beforeEl.textContent = data.original;
        if (afterEl) afterEl.textContent = data.cleaned;
        if (resultEl) resultEl.style.display = 'grid';
        showToast('✅ Транскрипт цэвэрлэгдлээ!', 'success');
        triggerServiceFeedback('transcript-clean', 'Транскрипт засагч');
    } catch (error) {
        console.error('TranscriptClean error:', error);
        showToast('❌ ' + error.message, 'error');
    }
    if (btn) { btn.disabled = false; btn.textContent = '🧹 Цэвэрлэх'; }
}

// ============================================================
// SEO ГАРЧИГ — 5 кредит
// ============================================================
async function runSeoTitle() {
    const text = document.getElementById('seo-title-input')?.value.trim();
    if (!text) { showToast('⚠️ Агуулга оруулна уу!', 'error'); return; }
    const btn = event.target;
    if (btn) { btn.disabled = true; btn.textContent = '⏳ Шалгаж байна...'; }

    const ok = await spendCreditsOrFail(5, 'seo-title', 'SEO гарчиг', 'seo-title-notice');
    if (!ok) { if (btn) { btn.disabled = false; btn.textContent = '🔍 SEO үүсгэх'; } return; }

    if (btn) btn.textContent = '⏳ Үүсгэж байна...';
    try {
        const response = await fetch('/api/seo-title', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ content: text })
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'SEO үүсгэх үед алдаа гарлаа');

        const resultDiv = document.getElementById('seo-title-result');
        if (resultDiv) {
            resultDiv.classList.add('show');
            resultDiv.innerHTML = `<div class="result-label">🔍 SEO гарчиг & мета тайлбар</div>
            <div style="margin-bottom:8px;"><div style="font-size:11px;color:rgba(255,255,255,0.3);">📌 Гарчиг</div>
            <div style="font-size:15px;font-weight:700;color:#4ade80;">${data.title}</div></div>
            <div><div style="font-size:11px;color:rgba(255,255,255,0.3);">📝 Мета тайлбар</div>
            <div style="font-size:13px;color:rgba(255,255,255,0.7);line-height:1.6;">${data.description}</div></div>
            <button onclick="copyText(this)" style="margin-top:8px;padding:6px 14px;border-radius:6px;background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.1);color:rgba(255,255,255,0.5);font-size:11px;cursor:pointer;">📋 Хуулах</button>`;
        }
        showToast('✅ SEO гарчиг амжилттай!', 'success');
        triggerServiceFeedback('seo-title', 'SEO гарчиг');
    } catch (error) {
        console.error('SeoTitle error:', error);
        showToast('❌ ' + error.message, 'error');
    }
    if (btn) { btn.disabled = false; btn.textContent = '🔍 SEO үүсгэх'; }
}

// ============================================================
// PLAGIARISM ШАЛГАГЧ — 10 кредит
// ============================================================
async function runPlagiarism() {
    const text = document.getElementById('plagiarism-input')?.value.trim();
    if (!text) { showToast('⚠️ Текст оруулна уу!', 'error'); return; }
    const btn = event.target;
    if (btn) { btn.disabled = true; btn.textContent = '⏳ Шалгаж байна...'; }

    const ok = await spendCreditsOrFail(10, 'plagiarism', 'Plagiarism шалгагч', 'plagiarism-notice');
    if (!ok) { if (btn) { btn.disabled = false; btn.textContent = '🔎 Шалгах'; } return; }

    if (btn) btn.textContent = '⏳ Шалгаж байна...';
    try {
        const response = await fetch('/api/plagiarism', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text })
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Шалгах үед алдаа гарлаа');

        const score = data.score ?? 50;
        const isHigh = score > 60;
        const resultDiv = document.getElementById('plagiarism-result');
        if (resultDiv) {
            resultDiv.classList.add('show');
            resultDiv.innerHTML = `<div class="result-label">🔎 Шалгалтын дүн</div>
            <div style="display:flex;gap:20px;flex-wrap:wrap;margin:8px 0;">
                <div style="padding:12px 20px;background:rgba(255,255,255,0.03);border-radius:8px;border:1px solid ${isHigh ? 'rgba(230,57,70,0.3)' : 'rgba(74,222,128,0.3)'};">
                    <div style="font-size:11px;color:rgba(255,255,255,0.3);">Клише/Өвөрмөц бус байдал</div>
                    <div style="font-size:24px;font-weight:700;color:${isHigh ? '#e63946' : '#4ade80'};">${score}%</div>
                </div>
                <div style="padding:12px 20px;background:rgba(255,255,255,0.03);border-radius:8px;">
                    <div style="font-size:11px;color:rgba(255,255,255,0.3);">Дүгнэлт</div>
                    <div style="font-size:14px;font-weight:700;color:${isHigh ? '#e63946' : '#4ade80'};">${data.verdict || ''}</div>
                </div>
            </div>
            ${data.reasons ? `<div style="font-size:13px;color:rgba(255,255,255,0.5);padding:10px;background:rgba(255,255,255,0.03);border-radius:8px;">${data.reasons.join('<br>')}</div>` : ''}
            <div style="font-size:11px;color:rgba(255,255,255,0.3);margin-top:8px;">⚠️ Энэ хэрэгсэл интернет дэх эх сурвалжтай шууд харьцуулдаггуй, зөвхөн текстийн хэв шинжийг шинжилдэг.</div>`;
        }
        showToast('✅ Шалгалт амжилттай!', 'success');
        triggerServiceFeedback('plagiarism', 'Plagiarism шалгагч');
    } catch (error) {
        console.error('Plagiarism error:', error);
        showToast('❌ ' + error.message, 'error');
    }
    if (btn) { btn.disabled = false; btn.textContent = '🔎 Шалгах'; }
}

// ============================================================
// PDF → ТЕКСТ (OCR) — 50 тэмдэгт/хуудас ≈ 5 кредит/хуудас
// ЗАСВАР: кредит хасалт нэмэгдсэн. PDF-ийн хуудасны тоог урьдчилж
// мэдэхгүй тул файлын хэмжээгээр ойролцоогоор тооцоолж
// (шинийн хуудас ~200KB гэж үзээд), урьдаас кредит хасна.
// ============================================================
function estimatePdfPages(fileSize) {
    return Math.max(1, Math.min(10, Math.ceil(fileSize / (200 * 1024))));
}

async function runPdfOcr() {
    const fileInput = document.getElementById('pdf-ocr-file');
    if (!fileInput?.files || fileInput.files.length === 0) {
        showToast('⚠️ PDF файл оруулна уу!', 'error');
        return;
    }
    const btn = event.target;
    if (btn) { btn.disabled = true; btn.textContent = '⏳ Шалгаж байна...'; }

    const file = fileInput.files[0];

    if (file.size > 20 * 1024 * 1024) {
        showToast('⚠️ PDF файл 20MB-ээс ихгуй байх ёстой', 'error');
        if (btn) { btn.disabled = false; btn.textContent = '📑 Текст гаргах'; }
        return;
    }

    // ЗАСВАР: 50 тэмдэгт/хуудас ≈ 5 кредит/хуудас — хуудасны тоог
    // файлын хэмжээгээр ойролцоогоор тооцоолно
    const estimatedPages = estimatePdfPages(file.size);
    const cost = estimatedPages * 5;
    const ok = await spendCreditsOrFail(cost, 'pdf-ocr', `PDF OCR: ~${estimatedPages} хуудас`, 'pdf-ocr-notice');
    if (!ok) { if (btn) { btn.disabled = false; btn.textContent = '📑 Текст гаргах'; } return; }

    if (btn) btn.textContent = '⏳ Боловсруулж байна...';

    const resultDiv = document.getElementById('pdf-ocr-result');
    if (resultDiv) {
        resultDiv.classList.add('show');
        resultDiv.innerHTML = `<div class="result-label">⏳ Боловсруулж байна...</div>
        <div style="background:rgba(255,255,255,0.08);border-radius:99px;height:8px;overflow:hidden;margin-top:8px;">
            <div id="pdf-progress-bar" style="background:linear-gradient(90deg,#4ade80,#f4a261);height:100%;width:0%;transition:width 0.3s;"></div>
        </div>
        <div id="pdf-progress-text" style="font-size:12px;color:rgba(255,255,255,0.4);margin-top:6px;">0%</div>`;
    }
    let fakeProgress = 0;
    const progressInterval = setInterval(() => {
        if (fakeProgress < 90) {
            fakeProgress += Math.random() * 6;
            if (fakeProgress > 90) fakeProgress = 90;
            const bar = document.getElementById('pdf-progress-bar');
            const txt = document.getElementById('pdf-progress-text');
            if (bar) bar.style.width = fakeProgress + '%';
            if (txt) txt.textContent = Math.round(fakeProgress) + '%';
        }
    }, 400);

    try {
        const formData = new FormData();
        formData.append('pdf', file);

        const response = await fetch('/api/pdf-ocr', {
            method: 'POST',
            body: formData
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'PDF боловсруулах үед алдаа гарлаа');

        clearInterval(progressInterval);
        const bar = document.getElementById('pdf-progress-bar');
        const txt = document.getElementById('pdf-progress-text');
        if (bar) bar.style.width = '100%';
        if (txt) txt.textContent = '100%';

        setTimeout(() => {
            if (resultDiv) {
                const warningHtml = data.warning
                    ? `<div style="font-size:12px;color:#f4a261;background:rgba(244,162,97,0.08);border:1px solid rgba(244,162,97,0.2);border-radius:8px;padding:8px 10px;margin-bottom:10px;">${data.warning}</div>`
                    : '';
                resultDiv.innerHTML = `<div class="result-label">📑 OCR уур дун</div>
                ${warningHtml}
                <div style="font-size:13px;color:rgba(255,255,255,0.4);margin-bottom:8px;">
                    📄 Файл: ${file.name} | 📁 Хэмжээ: ${(file.size / 1024 / 1024).toFixed(1)} MB | 📃 Ойролцоо хуудас: ${data.pages}
                </div>
                <div style="font-size:14px;color:rgba(255,255,255,0.8);line-height:1.7;padding:12px;background:rgba(255,255,255,0.03);border-radius:8px;max-height:400px;overflow-y:auto;white-space:pre-wrap;">${data.text}</div>
                <div style="display:flex;gap:8px;margin-top:8px;">
                    <button onclick="copyText(this)" style="padding:6px 14px;border-radius:6px;background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.1);color:rgba(255,255,255,0.5);font-size:11px;cursor:pointer;">📋 Хуулах</button>
                    <button onclick="downloadPdfText(this)" style="padding:6px 14px;border-radius:6px;background:rgba(74,222,128,0.1);border:1px solid rgba(74,222,128,0.2);color:#4ade80;font-size:11px;cursor:pointer;">⬇️ Татах (.txt)</button>
                </div>`;
            }
        }, 400);

        showToast(data.truncated ? '⚠️ PDF дутуу боловсруулагдлаа (хэт урт)' : '✅ PDF боловсруулагдлаа!', data.truncated ? 'error' : 'success');
        triggerServiceFeedback('pdf-ocr', 'PDF → Текст (OCR)');
    } catch (error) {
        clearInterval(progressInterval);
        if (resultDiv) resultDiv.classList.remove('show');
        console.error('PdfOcr error:', error);
        showToast('❌ ' + error.message, 'error');
    }
    if (btn) { btn.disabled = false; btn.textContent = '📑 Текст гаргах'; }
}

function downloadPdfText(btn) {
    const parent = btn.closest('.result');
    const textEl = parent.querySelector('[style*="white-space:pre-wrap"]');
    if (!textEl) return;
    const blob = new Blob([textEl.textContent], { type: 'text/plain;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'pdf-text.txt';
    link.click();
}
// ============================================================
// AI ИЛРҮҮЛЭГЧ — 5 кредит
// ============================================================
async function runAiDetect() {
    const text = document.getElementById('ai-detect-input')?.value.trim();
    if (!text) { showToast('⚠️ Текст оруулна уу!', 'error'); return; }
    const btn = event.target;
    if (btn) { btn.disabled = true; btn.textContent = '⏳ Шалгаж байна...'; }

    const ok = await spendCreditsOrFail(5, 'ai-detect', 'AI илрүүлэгч', 'ai-detect-notice');
    if (!ok) { if (btn) { btn.disabled = false; btn.textContent = '🤖 Шалгах'; } return; }

    if (btn) btn.textContent = '⏳ Шалгаж байна...';
    try {
        const response = await fetch('/api/ai-detect', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text })
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Шалгах үед алдаа гарлаа');

        const aiScore = data.score ?? 50;
        const isAi = aiScore > 50;
        const resultDiv = document.getElementById('ai-detect-result');
        if (resultDiv) {
            resultDiv.classList.add('show');
            resultDiv.innerHTML = `<div class="result-label">🤖 AI илрүүлэлтийн дүн</div>
            <div style="display:flex;gap:20px;flex-wrap:wrap;margin:8px 0;">
                <div style="padding:12px 20px;background:rgba(255,255,255,0.03);border-radius:8px;border:1px solid ${isAi ? 'rgba(230,57,70,0.3)' : 'rgba(74,222,128,0.3)'};">
                    <div style="font-size:11px;color:rgba(255,255,255,0.3);">AI-ээр бичигдсэн магадлал</div>
                    <div style="font-size:24px;font-weight:700;color:${isAi ? '#e63946' : '#4ade80'};">${aiScore}%</div>
                </div>
                <div style="padding:12px 20px;background:rgba(255,255,255,0.03);border-radius:8px;">
                    <div style="font-size:11px;color:rgba(255,255,255,0.3);">Дүгнэлт</div>
                    <div style="font-size:14px;font-weight:700;color:${isAi ? '#e63946' : '#4ade80'};">${data.verdict || (isAi ? '🤖 AI-ээр бичигдсэн байх магадлалтай' : '✅ Хүний бичсэн байх магадлалтай')}</div>
                </div>
            </div>
            ${data.reasons ? `<div style="font-size:13px;color:rgba(255,255,255,0.5);padding:10px;background:rgba(255,255,255,0.03);border-radius:8px;">${data.reasons.join('<br>')}</div>` : ''}`;
        }
        showToast('✅ Шалгалт амжилттай!', 'success');
        triggerServiceFeedback('ai-detect', 'AI илрүүлэгч');
    } catch (error) {
        console.error('AiDetect error:', error);
        showToast('❌ ' + error.message, 'error');
    }
    if (btn) { btn.disabled = false; btn.textContent = '🤖 Шалгах'; }
}

// ============================================================
// CHATBOT — 2 кредит/хариулт
// ============================================================
let chatbotHistory = [];

async function runChatbot() {
    const input = document.getElementById('chatbot-input');
    if (!input) { showToast('⚠️ Chatbot олдсонгүй', 'error'); return; }
    const question = input.value.trim();
    if (!question) { showToast('⚠️ Асуулт бичнэ үү!', 'error'); return; }

    const btn = event?.target || document.querySelector('#chatbot-box .run-btn');
    if (btn) { btn.disabled = true; btn.textContent = '⏳'; }

    const ok = await spendCreditsOrFail(2, 'chatbot', `Chatbot: "${question.slice(0,40)}"`, 'chatbot-notice');
    if (!ok) { if (btn) { btn.disabled = false; btn.textContent = '➤'; } return; }

    const messages = document.getElementById('chatbot-messages');

    if (messages) {
        const userMsg = document.createElement('div');
        userMsg.style.cssText = 'display:flex;gap:8px;margin-bottom:10px;justify-content:flex-end;';
        userMsg.innerHTML = `<div style="background:rgba(74,222,128,0.12);border-radius:10px 0 10px 10px;padding:10px 12px;font-size:13px;color:rgba(255,255,255,0.9);line-height:1.6;max-width:80%;">${question}</div>
        <div style="width:28px;height:28px;border-radius:50%;background:rgba(74,222,128,0.2);display:flex;align-items:center;justify-content:center;font-size:13px;flex-shrink:0;">👤</div>`;
        messages.appendChild(userMsg);
        messages.scrollTop = messages.scrollHeight;
    }
    if (input) input.value = '';

    try {
        const response = await fetch('/api/chatbot', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: question, history: chatbotHistory })
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Chatbot алдаа гарлаа');

        const reply = data.reply;

        chatbotHistory.push({ role: 'user', content: question });
        chatbotHistory.push({ role: 'assistant', content: reply });

        if (messages) {
            const botMsg = document.createElement('div');
            botMsg.style.cssText = 'display:flex;gap:8px;margin-bottom:10px;';
            botMsg.innerHTML = `<div style="width:28px;height:28px;border-radius:50%;background:linear-gradient(135deg,#059669,#4ade80);display:flex;align-items:center;justify-content:center;font-size:13px;flex-shrink:0;">🤖</div>
            <div style="background:rgba(74,222,128,0.06);border-radius:0 10px 10px 10px;padding:10px 12px;font-size:13px;color:rgba(255,255,255,0.85);line-height:1.6;max-width:80%;white-space:pre-wrap;">${reply}</div>`;
            messages.appendChild(botMsg);
            messages.scrollTop = messages.scrollHeight;
        }
        showToast('✅ Хариу амжилттай!', 'success');
    } catch (error) {
        console.error('Chatbot error:', error);
        showToast('❌ ' + error.message, 'error');
    }

    if (btn) { btn.disabled = false; btn.textContent = '➤'; }
}

// ============================================================
// НЭМЭЛТ ТҮЛХҮҮР ФУНКЦУУД
// ============================================================
function copyText(btn) {
    const parent = btn.parentElement;
    const textEl = parent.querySelector('[style*="color:rgba(255,255,255"]') || parent.querySelector('.result-label + div');
    if (textEl) {
        const text = textEl.textContent;
        navigator.clipboard.writeText(text).then(() => {
            btn.textContent = '✅ Хуулагдлаа!';
            setTimeout(() => btn.textContent = '📋 Хуулах', 2000);
        }).catch(() => {
            const range = document.createRange();
            range.selectNode(textEl);
            window.getSelection().removeAllRanges();
            window.getSelection().addRange(range);
            document.execCommand('copy');
            btn.textContent = '✅ Хуулагдлаа!';
            setTimeout(() => btn.textContent = '📋 Хуулах', 2000);
        });
    }
}

// ============================================================
// FILE UPLOAD HANDLERS (хуучин file-name харуулах функцууд)
// ============================================================
function handleSTTFile(e) { const f = e.target.files[0]; if(f) document.getElementById('stt-file-name').textContent = f.name; }
function handleSTTDrop(e) { e.preventDefault(); const f = e.dataTransfer.files[0]; if(f){ document.getElementById('stt-file').files = e.dataTransfer.files; document.getElementById('stt-file-name').textContent = f.name; } }
function handleMergeVideoFile(e) { const f = e.target.files[0]; if(f) document.getElementById('merge-video-name').textContent = f.name; }
function handleMergeVideoDrop(e) { e.preventDefault(); const f = e.dataTransfer.files[0]; if(f){ document.getElementById('merge-video-file').files = e.dataTransfer.files; document.getElementById('merge-video-name').textContent = f.name; } }
function handleMergeSRTFile(e) { const f = e.target.files[0]; if(f) document.getElementById('merge-srt-name').textContent = f.name; }
function handleMergeSRTDrop(e) { e.preventDefault(); const f = e.dataTransfer.files[0]; if(f){ document.getElementById('merge-srt-file').files = e.dataTransfer.files; document.getElementById('merge-srt-name').textContent = f.name; } }
function handleVsplitFile(e) { const f = e.target.files[0]; if(f) document.getElementById('vsplit-file-name').textContent = f.name; }
function handleVsplitDrop(e) { e.preventDefault(); const f = e.dataTransfer.files[0]; if(f){ document.getElementById('vsplit-file').files = e.dataTransfer.files; document.getElementById('vsplit-file-name').textContent = f.name; } }
function handlePdfOcrFile(e) { const f = e.target.files[0]; if(f) document.getElementById('pdf-ocr-file-name').textContent = f.name; }
function handlePdfOcrDrop(e) { e.preventDefault(); const f = e.dataTransfer.files[0]; if(f){ document.getElementById('pdf-ocr-file').files = e.dataTransfer.files; document.getElementById('pdf-ocr-file-name').textContent = f.name; } }

// ============================================================
// INIT
// ============================================================
document.addEventListener('DOMContentLoaded', function() {
    updateCreditUI();
    console.log('✅ services.js ачаалагдлаа! Кредит систем холбогдсон.');
});
