// ============================================================
// ШИНЭ TTS frontend логик — 2 хоолойтой (Edge/Gemini).
// services.js доторх ХУУЧИН эдгээр функцуудыг СОЛИХ:
//   - updateTTSCount()
//   - selVoice()
//   - runTTS()
// БА дараах ШИНЭ функцийг НЭМЭХ:
//   - selEngine()
// ============================================================

// Одоогийн сонгосон engine ('edge' эсвэл 'gemini')
let ttsEngine = 'edge';
const TTS_CHAR_LIMITS = { edge: 2000, gemini: 1000 };

// Engine солих (Edge <-> Gemini)
function selEngine(engine, el) {
    ttsEngine = engine;
    document.querySelectorAll('#engine-edge, #engine-gemini').forEach(b => b.classList.remove('on'));
    el.classList.add('on');

    // Дуу сонголтын мөрийг солих
    document.getElementById('edge-voice-row').style.display = engine === 'edge' ? 'block' : 'none';
    document.getElementById('gemini-voice-row').style.display = engine === 'gemini' ? 'block' : 'none';

    // Тэмдэгтийн хязгаарыг шинэчлэх
    updateTTSCount();
}

// Тэмдэгтийн тоо харуулах (engine-ээс хамаарсан хязгаартай)
function updateTTSCount() {
    const len = document.getElementById('tts-text').value.length;
    const limit = TTS_CHAR_LIMITS[ttsEngine];
    const countEl = document.getElementById('char-count');
    if (countEl) {
        countEl.textContent = len + '/' + limit;
        countEl.style.color = len > limit ? '#e63946' : '#4ade80';
    }
}

// Едж TTS-ийн дуу сонгох (Батаа/Есүй)
function selVoice(el) {
    document.querySelectorAll('#edge-voice-row .vbtn').forEach(b => b.classList.remove('on'));
    el.classList.add('on');
}

// Дуу үүсгэх — /api/tts руу fetch хийнэ
async function runTTS() {
    const text = document.getElementById('tts-text')?.value.trim();
    if (!text) { showToast('⚠️ Текст оруулна уу!', 'error'); return; }

    const limit = TTS_CHAR_LIMITS[ttsEngine];
    if (text.length > limit) {
        showToast(`⚠️ Текст хэт урт (${limit} тэмдэгтээс ихгүй байх ёстой)`, 'error');
        return;
    }

    const btn = document.getElementById('tts-run-btn');
    if (btn) { btn.disabled = true; btn.textContent = '⏳ Үүсгэж байна...'; }

    try {
        const rate = document.getElementById('rate')?.value || 15;
        const pitch = document.getElementById('pitch')?.value || -8;

        let body;
        if (ttsEngine === 'gemini') {
            const geminiVoice = document.getElementById('gemini-voice-select')?.value || 'Лхагваа (эрэгтэй)';
            body = { text, engine: 'gemini', geminiVoice, rate: Number(rate), pitch: Number(pitch), volume: 0 };
        } else {
            const voice = document.querySelector('#edge-voice-row .vbtn.on')?.textContent.trim() || 'Батаа';
            body = {
                text,
                engine: 'edge',
                voice: voice === 'Есүй' ? 'Есүй (эмэгтэй)' : 'Батаа (эрэгтэй)',
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
        if (!response.ok) throw new Error(data.error || 'Дуу үүсгэх үед алдаа гарлаа');
        if (!data.audioUrl) throw new Error('Дуу үүсгэгдсэн ч URL олдсонгүй');

        const resultDiv = document.getElementById('tts-result');
        if (resultDiv) {
            resultDiv.classList.add('show');
            resultDiv.innerHTML = `<div class="result-label">✅ Дуу бэлэн</div>
            <audio controls style="width:100%;border-radius:8px;margin-top:6px;">
                <source src="${data.audioUrl}" type="audio/mpeg">
            </audio>`;
        }
        showToast('✅ Дуу амжилттай үүсгэгдлээ!', 'success');
    } catch (error) {
        console.error('TTS error:', error);
        showToast('❌ ' + error.message, 'error');
    }

    if (btn) { btn.disabled = false; btn.textContent = '▶ Дуу үүсгэх'; }
}
