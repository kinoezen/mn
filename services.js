
// ============================================================
// services.js — КиноЭзэн AI Үйлчилгээнүүд (АЛДААГҮЙ ХУВИЛБАР)
// ============================================================

console.log('✅ services.js ачааллаж байна...');

// ===== КРЕДИТ СИСТЕМ (ТҮР ХААСАН) =====
function checkCredits(cost) { return true; }
function useCredits(cost) { return 0; }
function updateCreditUI() {
    const bar = document.getElementById('credit-bar');
    if (bar) bar.style.display = 'none';
    const guest = document.getElementById('credit-bar-guest');
    if (guest) guest.style.display = 'none';
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
// runTTS() — ОДОО БАЙГАА ФУНКЦИЙГ ЭНЭГЭЭР СОЛИХ.
// Цорын ганц өөрчлөлт: progress bar (0-100%) нэмэгдсэн.
// Бусад бугд (engine сонголт, body бэлдэх, fetch) ХЭВЭЭРЭЭ.
// ============================================================
async function runTTS() {
    const text = document.getElementById('tts-text')?.value.trim();
    if (!text) { showToast('⚠️ Текст оруулна уу!', 'error'); return; }

    const limit = TTS_CHAR_LIMITS[ttsEngine];
    if (text.length > limit) {
        showToast(`⚠️ Текст хэт урт (${limit} тэмдэгтээс ихгуй байх ёстой)`, 'error');
        return;
    }

    const btn = document.getElementById('tts-run-btn');
    if (btn) { btn.disabled = true; btn.textContent = '⏳ Үүсгэж байна...'; }

    // ===== ШИНЭ: progress bar харуулна =====
    const resultDiv = document.getElementById('tts-result');
    if (resultDiv) {
        resultDiv.classList.add('show');
        resultDiv.innerHTML = `<div class="result-label">⏳ Дуу үүсгэж байна...</div>
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
    // ===== ШИНЭ ХЭСЭГ ТӲГСЛӖ =====

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

        // ===== ШИНЭ: 100% болгож, дараа нь audio харуулна =====
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
        // ===== ШИНЭ ХЭСЭГ ТҲГСЛӖ =====

        showToast('✅ Дуу амжилттай үүсгэгдлээ!', 'success');
    } catch (error) {
        clearInterval(progressInterval);
        if (resultDiv) resultDiv.classList.remove('show');
        console.error('TTS error:', error);
        showToast('❌ ' + error.message, 'error');
    }

    if (btn) { btn.disabled = false; btn.textContent = '▶ Дуу үүсгэх'; }
}
// ============================================================
// ОРЧУУЛАГЧ
// ============================================================
// ШИНЭ runTranslate() — /api/translate руу бодитоор fetch хийнэ.
// services.js доторх ХУУЧИН runTranslate() функцийг ЭНЭ
// ФУНКЦЭЭР бүхэлд нь СОЛИХ.
// ============================================================
async function runTranslate() {
    const text = document.getElementById('trans-input')?.value.trim();
    if (!text) { showToast('⚠️ Текст оруулна уу!', 'error'); return; }
    const btn = event.target;
    if (btn) { btn.disabled = true; btn.textContent = '⏳ Орчуулж байна...'; }
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
    } catch (error) {
        console.error('Translate error:', error);
        showToast('❌ ' + error.message, 'error');
    }
    if (btn) { btn.disabled = false; btn.textContent = '🌐 Орчуулах'; }
}

// ============================================================
// HUMANIZER
// ============================================================
async function runHum() {
    const text = document.getElementById('hum-input')?.value.trim();
    if (!text) { showToast('⚠️ Текст оруулна уу!', 'error'); return; }
    const btn = event.target;
    if (btn) { btn.disabled = true; btn.textContent = '⏳ Хүмүүнжүүлж байна...'; }
    try {
        const humanized = text.replace(/машин/g, 'гайхалтай').replace(/хиймэл/g, 'байгалийн')
            .replace(/автомат/g, 'ухаалаг').replace(/технологи/g, 'арга');
        const beforeEl = document.getElementById('hum-before');
        const afterEl = document.getElementById('hum-after');
        const resultEl = document.getElementById('hum-result');
        if (beforeEl) beforeEl.textContent = text;
        if (afterEl) afterEl.textContent = humanized;
        if (resultEl) resultEl.style.display = 'grid';
        showToast('✅ Хүмүүнжүүлэлт амжилттай!', 'success');
    } catch (error) {
        console.error('Humanizer error:', error);
        showToast('❌ Алдаа гарлаа.', 'error');
    }
    if (btn) { btn.disabled = false; btn.textContent = '✨ Хүмүүнжүүлэх'; }
}

// ============================================================
// STT (Дуу → Текст)
// ============================================================
async function runSTT() {
    const fileInput = document.getElementById('stt-file');
    if (!fileInput?.files || fileInput.files.length === 0) {
        showToast('⚠️ Аудио файл оруулна уу!', 'error');
        return;
    }
    const btn = event.target;
    if (btn) { btn.disabled = true; btn.textContent = '⏳ Боловсруулж байна...'; }
    try {
        const file = fileInput.files[0];
        const audioUrl = URL.createObjectURL(file);
        const resultDiv = document.getElementById('stt-result');
        if (resultDiv) {
            resultDiv.classList.add('show');
            resultDiv.innerHTML = `<div class="result-label">🎙️ Аудио боловсруулагдлаа</div>
            <audio controls style="width:100%;border-radius:8px;margin-bottom:10px;">
                <source src="${audioUrl}">
            </audio>
            <div style="font-size:13px;color:rgba(255,255,255,0.4);padding:12px;background:rgba(255,255,255,0.03);border-radius:8px;">
                🎤 Доорх товчоор микрофоноор ярьж болно:
            </div>
            <button onclick="startSpeechRecognition()" style="padding:10px 20px;border-radius:10px;background:rgba(74,222,128,0.15);border:1px solid rgba(74,222,128,0.3);color:#4ade80;font-size:13px;font-weight:600;cursor:pointer;margin-top:8px;">🎤 Микрофоноор ярих</button>
            <div id="stt-text-result" style="margin-top:10px;padding:12px;background:rgba(255,255,255,0.03);border-radius:8px;color:rgba(255,255,255,0.8);font-size:14px;min-height:40px;"></div>`;
        }
        showToast('✅ Аудио боловсруулагдлаа!', 'success');
    } catch (error) {
        console.error('STT error:', error);
        showToast('❌ Алдаа гарлаа.', 'error');
    }
    if (btn) { btn.disabled = false; btn.textContent = '🎙️ Текст болгох'; }
}

// ===== SPEECH RECOGNITION =====
function startSpeechRecognition() {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
        showToast('❌ Таны браузер дуу танихыг дэмжихгүй байна.', 'error');
        return;
    }
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = 'mn-MN';
    recognition.continuous = false;
    recognition.interimResults = true;
    const resultEl = document.getElementById('stt-text-result');
    if (resultEl) resultEl.textContent = '🎤 Ярьж байна...';
    recognition.onresult = function(event) {
        let transcript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
            transcript += event.results[i][0].transcript;
        }
        if (resultEl) resultEl.textContent = transcript;
    };
    recognition.onerror = function(event) {
        if (resultEl) resultEl.textContent = '❌ Алдаа: ' + event.error;
    };
    recognition.start();
}

// ============================================================
// ТЕКСТ ЗАСАГЧ
// ============================================================
// ШИНЭ runTextEdit() — /api/textedit руу бодитоор fetch хийнэ.
// services.js доторх ХУУЧИН runTextEdit() функцийг ЭНЭ
// ФУНКЦЭЭР бүхэлд нь СОЛИХ.
// ============================================================
async function runTextEdit() {
    const text = document.getElementById('textedit-input')?.value.trim();
    if (!text) { showToast('⚠️ Текст оруулна уу!', 'error'); return; }
    const btn = event.target;
    if (btn) { btn.disabled = true; btn.textContent = '⏳ Засаж байна...'; }
    try {
        const fixGrammar = document.getElementById('fix-grammar')?.checked ?? true;
        const fixPunctuation = document.getElementById('fix-punctuation')?.checked ?? true;
        const fixStyle = document.getElementById('fix-style')?.checked ?? false;

        const response = await fetch('/api/textedit', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text, fixGrammar, fixPunctuation, fixStyle })
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
    } catch (error) {
        console.error('TextEdit error:', error);
        showToast('❌ ' + error.message, 'error');
    }
    if (btn) { btn.disabled = false; btn.textContent = '📝 Засах'; }
}
// ============================================================
// КИНО ТОЙМЧ
// ============================================================
async function runMovieReview() {
    const movieName = document.getElementById('movie-review-input')?.value.trim();
    if (!movieName) { showToast('⚠️ Кино нэр оруулна уу!', 'error'); return; }

    const btn = event.target;
    if (btn) { btn.disabled = true; btn.textContent = '⏳ Тойм бичиж байна...'; }

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
            <div style="font-size:14px;line-height:1.8;color:rgba(255,255,255,0.85);white-space:pre-wrap;">${data.review}</div>`;
        }
        showToast('✅ Тойм амжилттай!', 'success');
    } catch (error) {
        console.error('MovieReview error:', error);
        showToast('❌ ' + error.message, 'error');
    }

    if (btn) { btn.disabled = false; btn.textContent = '🎬 Тойм бичих'; }
}

// ============================================================
// СУБТИТР НИЙЛҮҮЛЭГЧ
// ============================================================
function runMergeSubtitle() {
    const videoFile = document.getElementById('merge-video-file')?.files[0];
    const srtFile = document.getElementById('merge-srt-file')?.files[0];
    if (!videoFile) { showToast('⚠️ Видео файл оруулна уу!', 'error'); return; }
    if (!srtFile) { showToast('⚠️ SRT файл оруулна уу!', 'error'); return; }
    const btn = event.target;
    if (btn) { btn.disabled = true; btn.textContent = '⏳ Боловсруулж байна...'; }
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
// ВИДЕО ХУВААГЧ
// ============================================================
function runVideoSplit() {
    const file = document.getElementById('vsplit-file')?.files[0];
    if (!file) { showToast('⚠️ Видео файл оруулна уу!', 'error'); return; }
    const btn = event.target;
    if (btn) { btn.disabled = true; btn.textContent = '⏳ Хувааж байна...'; }
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
        if (btn) { btn.disabled = false; btn.textContent = '✂️ Хуваах'; }
    }, 1500);
}

// ============================================================
// ДҮРИЙН НЭР ОРЧУУЛАГЧ
// ============================================================
// ШИНЭ runNameTranslate() — /api/name-translate руу бодитоор
// fetch хийнэ. services.js доторх ХУУЧИН runNameTranslate()
// функцийг ЭНЭ ФУНКЦЭЭР бүхэлд нь СОЛИХ.
//
// АНХААР: HTML дотор "name-translate-lang" select-д "Монгол"
// сонголт нэмэх, мөн "name-translate-target-row" гэдэг шинэ
// div нэмэх ёстой (доорхи HTML snippet-ийг үз).
// ============================================================

// Эх хэл солих үед target хэлний сонголтыг харуулах/нуух
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
    if (btn) { btn.disabled = true; btn.textContent = '⏳ Орчуулж байна...'; }
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
    } catch (error) {
        console.error('NameTranslate error:', error);
        showToast('❌ ' + error.message, 'error');
    }
    if (btn) { btn.disabled = false; btn.textContent = '🎭 Орчуулах'; }
}
// ============================================================
// ПОСТ ҮҮСГЭГЧ
// ============================================================
// ШИНЭ runPostGen() — /api/post-gen руу бодитоор fetch хийнэ.
// services.js доторх ХУУЧИН runPostGen() функцийг ЭНЭ ФУНКЦЭЭР
// бүхэлд нь СОЛИХ.
// ============================================================
async function runPostGen() {
    const text = document.getElementById('post-gen-input')?.value.trim();
    if (!text) { showToast('⚠️ Агуулга оруулна уу!', 'error'); return; }
    const btn = event.target;
    if (btn) { btn.disabled = true; btn.textContent = '⏳ Үүсгэж байна...'; }
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
    } catch (error) {
        console.error('PostGen error:', error);
        showToast('❌ ' + error.message, 'error');
    }
    if (btn) { btn.disabled = false; btn.textContent = '📱 Пост үүсгэх'; }
}
// ============================================================
// THUMBNAIL ГАРЧИГ
// ============================================================
// ШИНЭ runThumbnail() — /api/thumbnail руу бодитоор fetch хийнэ.
// services.js доторх ХУУЧИН runThumbnail() функцийг ЭНЭ ФУНКЦЭЭР
// бүхэлд нь СОЛИХ.
// ============================================================
async function runThumbnail() {
    const text = document.getElementById('thumbnail-input')?.value.trim();
    if (!text) { showToast('⚠️ Агуулга оруулна уу!', 'error'); return; }
    const btn = event.target;
    if (btn) { btn.disabled = true; btn.textContent = '⏳ Үүсгэж байна...'; }
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
    } catch (error) {
        console.error('Thumbnail error:', error);
        showToast('❌ ' + error.message, 'error');
    }
    if (btn) { btn.disabled = false; btn.textContent = '🖼️ Гарчиг үүсгэх'; }
}
// ============================================================
// ТРАНСКРИПТ ЗАСАГЧ
// ============================================================
// ШИНЭ runTranscriptClean() — /api/transcript-clean руу бодитоор
// fetch хийнэ. services.js доторх ХУУЧИН runTranscriptClean()
// функцийг ЭНЭ ФУНКЦЭЭР бүхэлд нь СОЛИХ.
//
// АНХААР: HTML-д "transcript-clean-input" textarea-ийн дараа
// тэмдэгтийн тоолуур (span id="transcript-clean-count") нэмэх
// ёстой — доорхи updateTranscriptCleanCount() үүнийг шинэчилнэ.
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
    if (btn) { btn.disabled = true; btn.textContent = '⏳ Цэвэрлэж байна...'; }
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
    } catch (error) {
        console.error('TranscriptClean error:', error);
        showToast('❌ ' + error.message, 'error');
    }
    if (btn) { btn.disabled = false; btn.textContent = '🧹 Цэвэрлэх'; }
}

// ============================================================
// SEO ГАРЧИГ
// ============================================================
// ШИНЭ runSeoTitle() — /api/seo-title руу бодитоор fetch хийнэ.
// services.js доторх ХУУЧИН runSeoTitle() функцийг ЭНЭ
// ФУНКЦЭЭР бүхэлд нь СОЛИХ.
// ============================================================
async function runSeoTitle() {
    const text = document.getElementById('seo-title-input')?.value.trim();
    if (!text) { showToast('⚠️ Агуулга оруулна уу!', 'error'); return; }
    const btn = event.target;
    if (btn) { btn.disabled = true; btn.textContent = '⏳ Үүсгэж байна...'; }
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
    } catch (error) {
        console.error('SeoTitle error:', error);
        showToast('❌ ' + error.message, 'error');
    }
    if (btn) { btn.disabled = false; btn.textContent = '🔍 SEO үүсгэх'; }
}

// ============================================================
// PLAGIARISM ШАЛГАГЧ
// ============================================================
// ШИНЭ runPlagiarism() — /api/plagiarism руу бодитоор fetch хийнэ.
// services.js доторх ХУУЧИН runPlagiarism() функцийг ЭНЭ
// ФУНКЦЭЭР бүхэлд нь СОЛИХ.
// ============================================================
async function runPlagiarism() {
    const text = document.getElementById('plagiarism-input')?.value.trim();
    if (!text) { showToast('⚠️ Текст оруулна уу!', 'error'); return; }
    const btn = event.target;
    if (btn) { btn.disabled = true; btn.textContent = '⏳ Шалгаж байна...'; }
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
    } catch (error) {
        console.error('Plagiarism error:', error);
        showToast('❌ ' + error.message, 'error');
    }
    if (btn) { btn.disabled = false; btn.textContent = '🔎 Шалгах'; }
}

// ============================================================
// PDF → ТЕКСТ (OCR)
// ============================================================
function runPdfOcr() {
    const file = document.getElementById('pdf-ocr-file')?.files[0];
    if (!file) { showToast('⚠️ PDF файл оруулна уу!', 'error'); return; }
    const btn = event.target;
    if (btn) { btn.disabled = true; btn.textContent = '⏳ Боловсруулж байна...'; }
    setTimeout(() => {
        const resultDiv = document.getElementById('pdf-ocr-result');
        if (resultDiv) {
            resultDiv.classList.add('show');
            resultDiv.innerHTML = `<div class="result-label">📑 OCR үр дүн</div>
            <div style="font-size:14px;color:rgba(255,255,255,0.7);line-height:1.7;padding:12px;background:rgba(255,255,255,0.03);border-radius:8px;">
                📄 Файлын нэр: ${file.name}<br>
                📁 Хэмжээ: ${(file.size / 1024 / 1024).toFixed(1)} MB<br>
                <span style="color:#4ade80;">✅ OCR амжилттай!</span><br>
                <div style="margin-top:8px;padding:10px;background:rgba(74,222,128,0.06);border-radius:6px;border:1px solid rgba(74,222,128,0.1);">
                    "Энэ бол таны PDF-ээс гаргаж авсан текст юм."
                </div>
            </div>
            <button onclick="copyText(this)" style="margin-top:8px;padding:6px 14px;border-radius:6px;background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.1);color:rgba(255,255,255,0.5);font-size:11px;cursor:pointer;">📋 Текст хуулах</button>`;
        }
        showToast('✅ PDF боловсруулагдлаа!', 'success');
        if (btn) { btn.disabled = false; btn.textContent = '📑 Текст гаргах'; }
    }, 1500);
}

// ============================================================
// AI ИЛРҮҮЛЭГЧ
// ============================================================
async function runAiDetect() {
    const text = document.getElementById('ai-detect-input')?.value.trim();
    if (!text) { showToast('⚠️ Текст оруулна уу!', 'error'); return; }
    const btn = event.target;
    if (btn) { btn.disabled = true; btn.textContent = '⏳ Шалгаж байна...'; }
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
    } catch (error) {
        console.error('AiDetect error:', error);
        showToast('❌ ' + error.message, 'error');
    }
    if (btn) { btn.disabled = false; btn.textContent = '🤖 Шалгах'; }
}

// ============================================================
// CHATBOT
// ============================================================

// Chat history-г санах (browser session-доо, page refresh хүртэл)
let chatbotHistory = [];

async function runChatbot() {
    const input = document.getElementById('chatbot-input');
    if (!input) { showToast('⚠️ Chatbot олдсонгүй', 'error'); return; }
    const question = input.value.trim();
    if (!question) { showToast('⚠️ Асуулт бичнэ үү!', 'error'); return; }

    const btn = event?.target || document.querySelector('#chatbot-box .run-btn');
    if (btn) { btn.disabled = true; btn.textContent = '⏳'; }

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
// INIT
// ============================================================
document.addEventListener('DOMContentLoaded', function() {
    updateCreditUI();
    console.log('✅ services.js ачаалагдлаа! Бүх үйлчилгээ үнэгүй ажиллана.');
});
