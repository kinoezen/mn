// ============================================================
// TTS — ДУУ ҲСГЭГЧ (2 хоолойтой: Edge / Gemini) — ЭЦСИЙН ХУВИЛБАР
// services.js доторх TTS-тэй холбоотой БУГД хуучин кодыг
// (TTS_CHAR_LIMITS, ttsEngine, selEngine, updateTTSCount,
// selVoice, runTTS — ХИЧНЭЭН ХЭСЭГТ ТАРСАН Ч БАЙСАН) олж,
// БУГДИЙГ УСТГААД, ЭНЭ БУГД БЛОКООР сольж нэг газар оруулна.
// ============================================================

let ttsEngine = 'edge';
const TTS_CHAR_LIMITS = { edge: 5000, gemini: 500 };

function selEngine(engine, el) {
    ttsEngine = engine;
    document.querySelectorAll('#engine-edge, #engine-gemini').forEach(b => b.classList.remove('on'));
    el.classList.add('on');

    const edgeRow = document.getElementById('edge-voice-row');
    const geminiRow = document.getElementById('gemini-voice-row');
    if (edgeRow) edgeRow.style.display = engine === 'edge' ? 'block' : 'none';
    if (geminiRow) geminiRow.style.display = engine === 'gemini' ? 'block' : 'none';

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
    if (btn) { btn.disabled = true; btn.textContent = '⏳ Уусгэж байна...'; }

    const resultDiv = document.getElementById('tts-result');
    if (resultDiv) {
        resultDiv.classList.add('show');
        resultDiv.innerHTML = `<div class="result-label">⏳ Дуу уусгэж байна...</div>
        <div style="background:rgba(255,255,255,0.08);border-radius:99px;height:8px;overflow:hidden;margin-top:8px;">
            <div id="tts-progress-bar" style="background:linear-gradient(90deg,#4ade80,#f4a261);height:100%;width:0%;transition:width 0.3s;"></div>
        </div>
        <div id="tts-progress-text" style="font-size:12px;color:rgba(255,255,255,0.4);margin-top:6px;">0%</div>`;
    }
    let fakeProgress = 0;
    const progressInterval = setInterval(() => {
        if (fakeProgress < 90) {
            fakeProgress += Math.random() * 8;
            if (fakeProgress > 90) fakeProgress = 90;
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
        } else {
            // selVoice() ОДОО АШИГЛАГДАЖ БАЙГАА .vbtn.on элементийн textContent-ийг
            // ШУУД авна (Батаа эсвэл Есуй), trim хийнэ. Backend дотор
            // EDGE_VOICE_MAP дотор хоёр хэлбэр (нэмэлт тайлбартай/тайлбаргуй)
            // бугдийг дэмждэг тул энд яг ямар хэлбэрээр явуулсан хамаагуй.
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
        if (!response.ok) throw new Error(data.error || 'Дуу уусгэх уед алдаа гарлаа');
        if (!data.audioUrl) throw new Error('Дуу уусгэгдсэн ч URL олдсонгуй');

        clearInterval(progressInterval);
        const bar = document.getElementById('tts-progress-bar');
        const txt = document.getElementById('tts-progress-text');
        if (bar) bar.style.width = '100%';
        if (txt) txt.textContent = '100%';

        setTimeout(() => {
            if (resultDiv) {
                resultDiv.innerHTML = `<div class="result-label">✅ Дуу бэлэн</div>
                <audio controls style="width:100%;border-radius:8px;margin-top:6px;">
                    <source src="${data.audioUrl}" type="audio/mpeg">
                </audio>`;
            }
        }, 400);

        showToast('✅ Дуу амжилттай уусгэгдлээ!', 'success');
    } catch (error) {
        clearInterval(progressInterval);
        if (resultDiv) resultDiv.classList.remove('show');
        console.error('TTS error:', error);
        showToast('❌ ' + error.message, 'error');
    }

    if (btn) { btn.disabled = false; btn.textContent = '▶ Дуу уусгэх'; }
}
