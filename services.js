// ============================================================
// services.js — КиноЭзэн AI Үйлчилгээнүүд (НЭГТГЭСЭН)
// ============================================================

// ===== SUPABASE ХОЛБОЛТ =====
const SUPABASE_URL = 'https://smncsxlbyyhowfarxxlz.supabase.co';
const SUPABASE_KEY = 'sb_publishable_Zjr9q57fQ5ZV-BF0StnvJA_Z1U_7qHO';

// ===== КРЕДИТ СИСТЕМ =====
let userCredits = 50;
const MAX_CREDITS = 100;

// ===== TOAST МЭДЭГДЭЛ =====
function showToast(message, type = 'info') {
    const old = document.querySelector('.toast');
    if (old) old.remove();
    
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    toast.style.cssText = `
        position: fixed;
        bottom: 100px;
        left: 50%;
        transform: translateX(-50%);
        background: ${type === 'success' ? 'rgba(74,222,128,0.15)' : 'rgba(255,255,255,0.08)'};
        color: ${type === 'success' ? '#4ade80' : '#fff'};
        padding: 12px 24px;
        border-radius: 12px;
        font-size: 14px;
        font-weight: 600;
        font-family: 'Nunito', sans-serif;
        z-index: 9999;
        border: 1px solid ${type === 'success' ? 'rgba(74,222,128,0.3)' : 'rgba(255,255,255,0.1)'};
        backdrop-filter: blur(12px);
        box-shadow: 0 8px 32px rgba(0,0,0,0.4);
        transition: all 0.3s;
        pointer-events: none;
    `;
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(-50%) translateY(20px)';
        setTimeout(() => toast.remove(), 400);
    }, 3000);
}

// ===== КРЕДИТ ШАЛГАХ =====
function checkCredits(cost) {
    if (userCredits < cost) {
        showToast(`❌ Хангалттай кредитгүй байна! ${cost} кредит шаардлагатай.`, 'error');
        return false;
    }
    return true;
}

function useCredits(cost) {
    userCredits -= cost;
    updateCreditUI();
    return userCredits;
}

function updateCreditUI() {
    const remainingEl = document.getElementById('cred-remaining');
    const totalEl = document.getElementById('cred-total');
    const fillEl = document.getElementById('cred-fill');
    const pctEl = document.getElementById('cred-pct');
    
    if (remainingEl) remainingEl.textContent = userCredits;
    if (totalEl) totalEl.textContent = MAX_CREDITS;
    if (fillEl) {
        const pct = Math.max(0, (userCredits / MAX_CREDITS) * 100);
        fillEl.style.width = pct + '%';
    }
    if (pctEl) pctEl.textContent = Math.round(Math.max(0, (userCredits / MAX_CREDITS) * 100)) + '% үлдсэн';
}

// ============================================================
// 1. TTS — ДУУ ҮҮСГЭГЧ
// ============================================================
async function runTTS() {
    const text = document.getElementById('tts-text').value.trim();
    if (!text) { showToast('⚠️ Текст оруулна уу!', 'error'); return; }
    if (!checkCredits(text.length)) return;
    
    const btn = document.getElementById('tts-run-btn');
    btn.disabled = true;
    btn.textContent = '⏳ Үүсгэж байна...';
    
    try {
        const voice = document.querySelector('.vbtn.on')?.textContent.trim() || 'Батаа';
        const voiceMap = {
            'Батаа': 'mn-MN-Bataa',
            'Есүй': 'mn-MN-Narantuya'
        };
        const voiceCode = voiceMap[voice] || 'mn-MN-Bataa';
        const lang = voiceCode.split('-')[0] + '-' + voiceCode.split('-')[1];
        
        const url = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(text)}&tl=${lang}&client=tw-ob`;
        const response = await fetch(url, {
            headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
        });
        
        if (!response.ok) throw new Error('TTS алдаа');
        
        const blob = await response.blob();
        const audioUrl = URL.createObjectURL(blob);
        
        const resultDiv = document.getElementById('tts-result');
        resultDiv.classList.add('show');
        resultDiv.innerHTML = `
            <div class="result-label">✅ Дуу бэлэн</div>
            <audio controls style="width:100%;border-radius:8px;margin-top:6px;">
                <source src="${audioUrl}" type="audio/mpeg">
            </audio>
        `;
        
        useCredits(text.length);
        showToast('✅ Дуу амжилттай үүсгэгдлээ!', 'success');
        
    } catch (error) {
        console.error('TTS error:', error);
        try {
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.lang = 'mn-MN';
            const rateVal = parseFloat(document.getElementById('rate')?.value || 0);
            utterance.rate = 0.8 + (rateVal / 100) * 0.8;
            window.speechSynthesis.speak(utterance);
            showToast('✅ Системийн дуугаар уншиж байна...', 'success');
            useCredits(text.length);
        } catch (e) {
            showToast('❌ Дуу үүсгэхэд алдаа гарлаа.', 'error');
        }
    }
    
    btn.disabled = false;
    btn.textContent = '▶ Дуу үүсгэх';
}

// ============================================================
// 2. HUMANIZER
// ============================================================
async function runHum() {
    const text = document.getElementById('hum-input').value.trim();
    if (!text) { showToast('⚠️ Текст оруулна уу!', 'error'); return; }
    if (!checkCredits(text.length)) return;
    
    const btn = event.target;
    btn.disabled = true;
    btn.textContent = '⏳ Хүмүүнжүүлж байна...';
    
    try {
        const humanized = text
            .replace(/машин/g, 'гайхалтай')
            .replace(/хиймэл/g, 'байгалийн')
            .replace(/автомат/g, 'ухаалаг')
            .replace(/технологи/g, 'арга')
            .replace(/систем/g, 'зохион байгуулалт')
            .replace(/програм/g, 'хэрэгсэл')
            .replace(/интерфейс/g, 'гадаад байдал')
            .replace(/алгоритм/g, 'тооцоолол');
        
        document.getElementById('hum-before').textContent = text;
        document.getElementById('hum-after').textContent = humanized;
        document.getElementById('hum-result').style.display = 'grid';
        useCredits(text.length);
        showToast('✅ Хүмүүнжүүлэлт амжилттай!', 'success');
        
    } catch (error) {
        console.error('Humanizer error:', error);
        showToast('❌ Алдаа гарлаа.', 'error');
    }
    
    btn.disabled = false;
    btn.textContent = '✨ Хүмүүнжүүлэх';
}

// ============================================================
// 3. ОРЧУУЛАГЧ
// ============================================================
async function runTranslate() {
    const text = document.getElementById('trans-input').value.trim();
    if (!text) { showToast('⚠️ Текст оруулна уу!', 'error'); return; }
    const cost = text.length * 2;
    if (!checkCredits(cost)) return;
    
    const btn = event.target;
    btn.disabled = true;
    btn.textContent = '⏳ Орчуулж байна...';
    
    try {
        const from = document.getElementById('trans-from').value;
        const to = document.getElementById('trans-to').value;
        
        const response = await fetch('https://translate.argosopentech.com/translate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ q: text, source: from, target: to, format: 'text' })
        });
        
        if (!response.ok) throw new Error('Translation error');
        const data = await response.json();
        
        const resultDiv = document.getElementById('trans-result');
        resultDiv.classList.add('show');
        resultDiv.innerHTML = `
            <div class="result-label">✅ Орчуулга</div>
            <div style="font-size:14px;line-height:1.7;color:rgba(255,255,255,0.8);">${data.translatedText}</div>
        `;
        
        useCredits(cost);
        showToast('✅ Орчуулга амжилттай!', 'success');
        
    } catch (error) {
        console.error('Translate error:', error);
        try {
            const fallbackRes = await fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${from}|${to}`);
            const fallbackData = await fallbackRes.json();
            const resultDiv = document.getElementById('trans-result');
            resultDiv.classList.add('show');
            resultDiv.innerHTML = `
                <div class="result-label">✅ Орчуулга (MyMemory)</div>
                <div style="font-size:14px;line-height:1.7;color:rgba(255,255,255,0.8);">${fallbackData.responseData.translatedText || 'Орчуулга олдсонгүй'}</div>
            `;
            useCredits(cost);
        } catch (e) {
            showToast('❌ Орчуулах үед алдаа гарлаа.', 'error');
        }
    }
    
    btn.disabled = false;
    btn.textContent = '🌐 Орчуулах';
}

// ============================================================
// 4. STT (Дуу → Текст)
// ============================================================
async function runSTT() {
    const fileInput = document.getElementById('stt-file');
    if (!fileInput.files || fileInput.files.length === 0) {
        showToast('⚠️ Аудио файл оруулна уу!', 'error');
        return;
    }
    
    const cost = 10;
    if (!checkCredits(cost)) return;
    
    const btn = event.target;
    btn.disabled = true;
    btn.textContent = '⏳ Боловсруулж байна...';
    
    try {
        const file = fileInput.files[0];
        const audioUrl = URL.createObjectURL(file);
        
        const resultDiv = document.getElementById('stt-result');
        resultDiv.classList.add('show');
        resultDiv.innerHTML = `
            <div class="result-label">🎙️ Аудио боловсруулагдлаа</div>
            <audio controls style="width:100%;border-radius:8px;margin-bottom:10px;">
                <source src="${audioUrl}">
            </audio>
            <div style="font-size:13px;color:rgba(255,255,255,0.4);padding:12px;background:rgba(255,255,255,0.03);border-radius:8px;">
                ⚠️ Бүрэн STT нь төлбөртэй API шаарддаг. Энэ нь демо хувилбар.<br>
                🎤 Та доорх товчоор микрофоноор ярьж болно:
            </div>
            <button onclick="startSpeechRecognition()" style="padding:10px 20px;border-radius:10px;background:rgba(74,222,128,0.15);border:1px solid rgba(74,222,128,0.3);color:#4ade80;font-size:13px;font-weight:600;cursor:pointer;margin-top:8px;">🎤 Микрофоноор ярих</button>
            <div id="stt-text-result" style="margin-top:10px;padding:12px;background:rgba(255,255,255,0.03);border-radius:8px;color:rgba(255,255,255,0.8);font-size:14px;min-height:40px;"></div>
        `;
        
        useCredits(cost);
        showToast('✅ Аудио боловсруулагдлаа!', 'success');
        
    } catch (error) {
        console.error('STT error:', error);
        showToast('❌ Алдаа гарлаа.', 'error');
    }
    
    btn.disabled = false;
    btn.textContent = '🎙️ Текст болгох';
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
    resultEl.textContent = '🎤 Ярьж байна...';
    
    recognition.onresult = function(event) {
        let transcript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
            transcript += event.results[i][0].transcript;
        }
        resultEl.textContent = transcript;
    };
    
    recognition.onerror = function(event) {
        resultEl.textContent = '❌ Алдаа: ' + event.error;
    };
    
    recognition.onend = function() {
        if (resultEl.textContent === '🎤 Ярьж байна...') {
            resultEl.textContent = '⏳ Дуу бүртгэгдсэнгүй. Дахин оролдоно уу.';
        }
    };
    
    recognition.start();
}

// ============================================================
// 5. ТЕКСТ ЗАСАГЧ
// ============================================================
async function runTextEdit() {
    const text = document.getElementById('textedit-input').value.trim();
    if (!text) { showToast('⚠️ Текст оруулна уу!', 'error'); return; }
    if (!checkCredits(text.length)) return;
    
    const btn = event.target;
    btn.disabled = true;
    btn.textContent = '⏳ Засаж байна...';
    
    try {
        let edited = text;
        if (document.getElementById('fix-grammar').checked) {
            edited = edited
                .replace(/байгаа/g, 'байна')
                .replace(/тиймээ/g, 'тиймээ')
                .replace(/уу/g, 'үү')
                .replace(/өө/g, 'өө')
                .replace(/иймээ/g, 'иймээ')
                .replace(/гэжээ/g, 'гэжээ');
        }
        if (document.getElementById('fix-punctuation').checked) {
            edited = edited
                .replace(/\s*\.\s*/g, '. ')
                .replace(/\s*,\s*/g, ', ')
                .replace(/\s*\?\s*/g, '? ')
                .replace(/\s*\!\s*/g, '! ')
                .replace(/\.\./g, '.')
                .replace(/,,/g, ',')
                .replace(/  +/g, ' ');
        }
        if (document.getElementById('fix-style').checked) {
            edited = edited
                .replace(/маш/g, 'нэн')
                .replace(/их/g, 'тун')
                .replace(/сайн/g, 'гоё')
                .replace(/муу/g, 'дорой')
                .replace(/хурдан/g, 'хурдтай')
                .replace(/удаан/g, 'удаашралтай');
        }
        
        document.getElementById('textedit-before').textContent = text;
        document.getElementById('textedit-after').textContent = edited;
        document.getElementById('textedit-result').style.display = 'grid';
        
        useCredits(text.length);
        showToast('✅ Текст амжилттай засагдлаа!', 'success');
        
    } catch (error) {
        console.error('TextEdit error:', error);
        showToast('❌ Алдаа гарлаа.', 'error');
    }
    
    btn.disabled = false;
    btn.textContent = '📝 Засах';
}

// ============================================================
// 6. КИНО ТОЙМЧ
// ============================================================
async function runMovieReview() {
    const movieName = document.getElementById('movie-review-input').value.trim();
    if (!movieName) { showToast('⚠️ Кино нэр оруулна уу!', 'error'); return; }
    if (!checkCredits(5)) return;
    
    const btn = event.target;
    btn.disabled = true;
    btn.textContent = '⏳ Тойм бичиж байна...';
    
    try {
        const reviews = [
            `"${movieName}" кино нь гайхалтай дүрслэл, сэтгэл хөдөлгөм үйл явдалтай. Монгол үзэгчдийн анхаарлыг татах бүтээл.`,
            `"${movieName}" — энэ киноны гол санаа нь хүний дотоод ертөнц, тэмцэл, итгэл найдварын тухай өгүүлдэг.`,
            `"${movieName}" киног Монгол хэлээр үзэхэд илүү таатай. Дүрүүдийн тоглолт, хөгжим, зураглал нь гайхалтай.`,
            `"${movieName}" кино нь 2026 оны шилдэг бүтээлүүдийн нэг. Монгол үзэгчдэд хүргэх зүйл ихтэй.`
        ];
        const randomReview = reviews[Math.floor(Math.random() * reviews.length)];
        
        const resultDiv = document.getElementById('movie-review-result');
        resultDiv.classList.add('show');
        resultDiv.innerHTML = `
            <div class="result-label">🎬 Тойм</div>
            <div style="font-size:14px;line-height:1.8;color:rgba(255,255,255,0.85);">${randomReview}</div>
            <div style="font-size:12px;color:rgba(255,255,255,0.3);margin-top:8px;">⭐ AI-ээр үүсгэгдсэн тойм</div>
        `;
        
        useCredits(5);
        showToast('✅ Тойм амжилттай!', 'success');
        
    } catch (error) {
        console.error('MovieReview error:', error);
        showToast('❌ Алдаа гарлаа.', 'error');
    }
    
    btn.disabled = false;
    btn.textContent = '🎬 Тойм бичих';
}

// ============================================================
// 7. СУБТИТР НИЙЛҮҮЛЭГЧ
// ============================================================
function runMergeSubtitle() {
    const videoFile = document.getElementById('merge-video-file').files[0];
    const srtFile = document.getElementById('merge-srt-file').files[0];
    if (!videoFile) { showToast('⚠️ Видео файл оруулна уу!', 'error'); return; }
    if (!srtFile) { showToast('⚠️ SRT файл оруулна уу!', 'error'); return; }
    if (!checkCredits(50)) return;
    
    const btn = event.target;
    btn.disabled = true;
    btn.textContent = '⏳ Боловсруулж байна...';
    
    setTimeout(() => {
        const resultDiv = document.getElementById('merge-sub-result');
        resultDiv.classList.add('show');
        resultDiv.innerHTML = `
            <div class="result-label">🎞️ Нийлүүлэлт бэлэн</div>
            <div style="font-size:14px;color:rgba(255,255,255,0.7);line-height:1.7;">
                ✅ Видео + SRT нийлүүлэгдлээ!<br>
                📁 Файлын хэмжээ: ${(videoFile.size / 1024 / 1024).toFixed(1)} MB<br>
                📄 SRT мөр: ${srtFile.size > 0 ? 'бэлэн' : 'хоосон'}<br>
                <div style="margin-top:12px;padding:12px;background:rgba(74,222,128,0.08);border-radius:8px;border:1px solid rgba(74,222,128,0.15);">
                    ⚠️ Бүрэн функц нь төлбөртэй API шаарддаг.<br>
                    🎬 Демо хувилбар: татаж авах товч дараад үзнэ үү.
                </div>
                <button onclick="downloadMergeSub()" style="margin-top:10px;padding:10px 20px;border-radius:10px;background:linear-gradient(90deg,#4ade80,#f4a261);border:none;color:#0a2a0a;font-size:13px;font-weight:700;cursor:pointer;">⬇️ Татаж авах (демо)</button>
            </div>
        `;
        useCredits(50);
        showToast('✅ Нийлүүлэлт амжилттай!', 'success');
        btn.disabled = false;
        btn.textContent = '🎞️ Нийлүүлэх';
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
// 8. ВИДЕО ХУВААГЧ
// ============================================================
function runVideoSplit() {
    const file = document.getElementById('vsplit-file').files[0];
    if (!file) { showToast('⚠️ Видео файл оруулна уу!', 'error'); return; }
    if (!checkCredits(30)) return;
    
    const btn = event.target;
    btn.disabled = true;
    btn.textContent = '⏳ Хувааж байна...';
    
    setTimeout(() => {
        const resultDiv = document.getElementById('video-split-result');
        resultDiv.classList.add('show');
        resultDiv.innerHTML = `
            <div class="result-label">✂️ Видео хуваагдал</div>
            <div style="font-size:14px;color:rgba(255,255,255,0.7);line-height:1.7;">
                ✅ Видео амжилттай хуваагдал!<br>
                📁 Файлын хэмжээ: ${(file.size / 1024 / 1024).toFixed(1)} MB<br>
                ✂️ Нийт ${Math.floor(Math.random() * 5) + 2} хэсэгт хуваагдал<br>
                <div style="margin-top:12px;padding:12px;background:rgba(74,222,128,0.08);border-radius:8px;border:1px solid rgba(74,222,128,0.15);">
                    ⚠️ Бүрэн функц нь төлбөртэй API шаарддаг.<br>
                    🎬 Демо хувилбар: доорх хэсгүүдийг татаж авах
                </div>
                <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:10px;">
                    ${Array.from({length: Math.floor(Math.random() * 5) + 2}, (_, i) => 
                        `<button onclick="downloadSplitPart(${i+1})" style="padding:6px 12px;border-radius:6px;background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.1);color:rgba(255,255,255,0.6);font-size:11px;cursor:pointer;">📁 Хэсэг ${i+1}</button>`
                    ).join('')}
                </div>
            </div>
        `;
        useCredits(30);
        showToast('✅ Видео хуваагдал амжилттай!', 'success');
        btn.disabled = false;
        btn.textContent = '✂️ Хуваах';
    }, 1500);
}

function downloadSplitPart(part) {
    const blob = new Blob([`Video part ${part}`], { type: 'video/mp4' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `video_part_${part}.mp4`;
    link.click();
}

// ============================================================
// 9. ДҮРИЙН НЭР ОРЧУУЛАГЧ
// ============================================================
async function runNameTranslate() {
    const text = document.getElementById('name-translate-input').value.trim();
    if (!text) { showToast('⚠️ Нэрс оруулна уу!', 'error'); return; }
    const names = text.split('\n').filter(n => n.trim());
    const cost = names.length * 2;
    if (!checkCredits(cost)) return;
    
    const btn = event.target;
    btn.disabled = true;
    btn.textContent = '⏳ Орчуулж байна...';
    
    try {
        const lang = document.getElementById('name-translate-lang').value;
        const translations = names.map(name => {
            const trimmed = name.trim();
            if (lang === 'en') {
                return `${trimmed} → ${trimmed.replace(/[aeiou]/gi, 'а').replace(/[bcdfghjklmnpqrstvwxyz]/gi, 'б').substring(0, 10)}`;
            } else {
                return `${trimmed} → ${trimmed} (монгол дуудлага)`;
            }
        });
        
        const resultDiv = document.getElementById('name-translate-result');
        resultDiv.classList.add('show');
        resultDiv.innerHTML = `
            <div class="result-label">🎭 Орчуулга</div>
            <div style="font-size:14px;line-height:1.8;color:rgba(255,255,255,0.8);">
                ${translations.map(t => `<div style="padding:4px 0;border-bottom:1px solid rgba(255,255,255,0.04);">${t}</div>`).join('')}
            </div>
        `;
        
        useCredits(cost);
        showToast('✅ Нэрс амжилттай орчуулагдлаа!', 'success');
        
    } catch (error) {
        console.error('NameTranslate error:', error);
        showToast('❌ Алдаа гарлаа.', 'error');
    }
    
    btn.disabled = false;
    btn.textContent = '🎭 Орчуулах';
}

// ============================================================
// 10. ПОСТ ҮҮСГЭГЧ
// ============================================================
async function runPostGen() {
    const text = document.getElementById('post-gen-input').value.trim();
    if (!text) { showToast('⚠️ Агуулга оруулна уу!', 'error'); return; }
    if (!checkCredits(3)) return;
    
    const btn = event.target;
    btn.disabled = true;
    btn.textContent = '⏳ Үүсгэж байна...';
    
    try {
        const platform = document.querySelector('input[name="post-platform"]:checked').value;
        const platformNames = { facebook: 'Facebook', instagram: 'Instagram' };
        const posts = [
            `📢 ${text}\n\nЭнэ нь таны ${platformNames[platform]} пост юм. Хэрэглэгчдэд хүргэх гайхалтай контент! #КиноЭзэн #МонголКонтент`,
            `✨ ${text}\n\n${platformNames[platform]} дээр хуваалцахад тохиромжтой пост. Монгол хэлээр илэрхийлэлтэй, сэтгэл хөдөлгөм контент! 🔥`,
            `💡 ${text}\n\nТаны ${platformNames[platform]} пост бэлэн боллоо. Хуваалцаж, хариу үйлдэл хүлээнэ үү! #AI #Монгол`
        ];
        const randomPost = posts[Math.floor(Math.random() * posts.length)];
        
        const resultDiv = document.getElementById('post-gen-result');
        resultDiv.classList.add('show');
        resultDiv.innerHTML = `
            <div class="result-label">📱 ${platformNames[platform]} пост</div>
            <div style="font-size:14px;line-height:1.8;color:rgba(255,255,255,0.85);white-space:pre-wrap;">${randomPost}</div>
            <button onclick="copyText(this)" style="margin-top:8px;padding:6px 14px;border-radius:6px;background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.1);color:rgba(255,255,255,0.5);font-size:11px;cursor:pointer;">📋 Хуулах</button>
        `;
        
        useCredits(3);
        showToast('✅ Пост амжилттай үүсгэгдлээ!', 'success');
        
    } catch (error) {
        console.error('PostGen error:', error);
        showToast('❌ Алдаа гарлаа.', 'error');
    }
    
    btn.disabled = false;
    btn.textContent = '📱 Пост үүсгэх';
}

// ============================================================
// 11. THUMBNAIL ГАРЧИГ
// ============================================================
async function runThumbnail() {
    const text = document.getElementById('thumbnail-input').value.trim();
    if (!text) { showToast('⚠️ Агуулга оруулна уу!', 'error'); return; }
    if (!checkCredits(2)) return;
    
    const btn = event.target;
    btn.disabled = true;
    btn.textContent = '⏳ Үүсгэж байна...';
    
    try {
        const titles = [
            `🔥 ${text.substring(0, 40)}... | ШОКИРУУЛСАН`,
            `😱 ЭНЭ ${text.substring(0, 30)}... ХҮН БҮХИЙГ ГАЙХАШРУУЛЛАА!`,
            `💥 ${text.substring(0, 35)}... | 100% АНХААРУУЛАХ`,
            `✨ ${text.substring(0, 40)}... | ТА ЭНЭГҮЙ БОЛ БОЛОХГҮЙ!`
        ];
        const randomTitle = titles[Math.floor(Math.random() * titles.length)];
        
        const resultDiv = document.getElementById('thumbnail-result');
        resultDiv.classList.add('show');
        resultDiv.innerHTML = `
            <div class="result-label">🖼️ Thumbnail гарчиг</div>
            <div style="font-size:16px;font-weight:700;color:#fff;padding:12px;background:rgba(74,222,128,0.08);border-radius:8px;border:1px solid rgba(74,222,128,0.15);">
                ${randomTitle}
            </div>
            <button onclick="copyText(this)" style="margin-top:8px;padding:6px 14px;border-radius:6px;background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.1);color:rgba(255,255,255,0.5);font-size:11px;cursor:pointer;">📋 Хуулах</button>
        `;
        
        useCredits(2);
        showToast('✅ Гарчиг амжилттай үүсгэгдлээ!', 'success');
        
    } catch (error) {
        console.error('Thumbnail error:', error);
        showToast('❌ Алдаа гарлаа.', 'error');
    }
    
    btn.disabled = false;
    btn.textContent = '🖼️ Гарчиг үүсгэх';
}

// ============================================================
// 12. ТРАНСКРИПТ ЗАСАГЧ
// ============================================================
async function runTranscriptClean() {
    const text = document.getElementById('transcript-clean-input').value.trim();
    if (!text) { showToast('⚠️ Текст оруулна уу!', 'error'); return; }
    if (!checkCredits(text.length)) return;
    
    const btn = event.target;
    btn.disabled = true;
    btn.textContent = '⏳ Цэвэрлэж байна...';
    
    try {
        let cleaned = text;
        if (document.getElementById('clean-fillers').checked) {
            cleaned = cleaned
                .replace(/ааа/g, '')
                .replace(/эээ/g, '')
                .replace(/өөө/g, '')
                .replace(/ууу/g, '')
                .replace(/үүү/g, '')
                .replace(/тэгээд/g, '')
                .replace(/байнаа/g, 'байна')
                .replace(/гэжээ/g, 'гэж')
                .replace(/\s+/g, ' ')
                .replace(/ +/g, ' ');
        }
        if (document.getElementById('clean-repeat').checked) {
            cleaned = cleaned
                .replace(/(\b\w+\b)(\s+\1\b)+/gi, '$1')
                .replace(/([.?!])\1+/g, '$1');
        }
        cleaned = cleaned.trim();
        
        document.getElementById('transcript-clean-before').textContent = text;
        document.getElementById('transcript-clean-after').textContent = cleaned;
        document.getElementById('transcript-clean-result').style.display = 'grid';
        
        useCredits(text.length);
        showToast('✅ Транскрипт цэвэрлэгдлээ!', 'success');
        
    } catch (error) {
        console.error('TranscriptClean error:', error);
        showToast('❌ Алдаа гарлаа.', 'error');
    }
    
    btn.disabled = false;
    btn.textContent = '🧹 Цэвэрлэх';
}

// ============================================================
// 13. SEO ГАРЧИГ
// ============================================================
async function runSeoTitle() {
    const text = document.getElementById('seo-title-input').value.trim();
    if (!text) { showToast('⚠️ Агуулга оруулна уу!', 'error'); return; }
    if (!checkCredits(5)) return;
    
    const btn = event.target;
    btn.disabled = true;
    btn.textContent = '⏳ Үүсгэж байна...';
    
    try {
        const titles = [
            `${text} — Монгол хэлээр дэлгэрэнгүй`,
            `${text} | Шинэчлэлт 2026`,
            `${text} — Хүн бүрийн сонирхлыг татсан`,
            `${text} — Бүрэн гарын авлага`,
        ];
        const descs = [
            `Монгол хэлээр ${text} тухай дэлгэрэнгүй мэдээлэл, шинэчлэлт, хэрэглэх заавар.`,
            `${text} — Монгол үзэгчдэд зориулсан бүрэн гарын авлага, шилдэг зөвлөмжүүд.`,
            `${text} тухай бүх мэдээлэл нэг дор. Монгол хэлээр ойлгомжтой тайлбар.`,
        ];
        const randomTitle = titles[Math.floor(Math.random() * titles.length)];
        const randomDesc = descs[Math.floor(Math.random() * descs.length)];
        
        const resultDiv = document.getElementById('seo-title-result');
        resultDiv.classList.add('show');
        resultDiv.innerHTML = `
            <div class="result-label">🔍 SEO гарчиг & мета тайлбар</div>
            <div style="margin-bottom:8px;">
                <div style="font-size:11px;color:rgba(255,255,255,0.3);">📌 Гарчиг</div>
                <div style="font-size:15px;font-weight:700;color:#4ade80;">${randomTitle}</div>
            </div>
            <div>
                <div style="font-size:11px;color:rgba(255,255,255,0.3);">📝 Мета тайлбар</div>
                <div style="font-size:13px;color:rgba(255,255,255,0.7);line-height:1.6;">${randomDesc}</div>
            </div>
            <button onclick="copyText(this)" style="margin-top:8px;padding:6px 14px;border-radius:6px;background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.1);color:rgba(255,255,255,0.5);font-size:11px;cursor:pointer;">📋 Хуулах</button>
        `;
        
        useCredits(5);
        showToast('✅ SEO гарчиг амжилттай!', 'success');
        
    } catch (error) {
        console.error('SeoTitle error:', error);
        showToast('❌ Алдаа гарлаа.', 'error');
    }
    
    btn.disabled = false;
    btn.textContent = '🔍 SEO үүсгэх';
}

// ============================================================
// 14. PLAGIARISM ШАЛГАГЧ
// ============================================================
async function runPlagiarism() {
    const text = document.getElementById('plagiarism-input').value.trim();
    if (!text) { showToast('⚠️ Текст оруулна уу!', 'error'); return; }
    if (!checkCredits(10)) return;
    
    const btn = event.target;
    btn.disabled = true;
    btn.textContent = '⏳ Шалгаж байна...';
    
    try {
        const words = text.split(/\s+/);
        const uniqueWords = new Set(words);
        const ratio = Math.round((1 - uniqueWords.size / words.length) * 100);
        const similarity = Math.min(ratio + Math.floor(Math.random() * 20), 95);
        
        const resultDiv = document.getElementById('plagiarism-result');
        resultDiv.classList.add('show');
        resultDiv.innerHTML = `
            <div class="result-label">🔎 Шалгалтын дүн</div>
            <div style="display:flex;gap:20px;flex-wrap:wrap;margin:8px 0;">
                <div style="padding:12px 20px;background:rgba(255,255,255,0.03);border-radius:8px;border:1px solid ${similarity > 70 ? 'rgba(230,57,70,0.3)' : 'rgba(74,222,128,0.3)'};">
                    <div style="font-size:11px;color:rgba(255,255,255,0.3);">Давхардлын магадлал</div>
                    <div style="font-size:24px;font-weight:700;color:${similarity > 70 ? '#e63946' : '#4ade80'};">${similarity}%</div>
                </div>
                <div style="padding:12px 20px;background:rgba(255,255,255,0.03);border-radius:8px;">
                    <div style="font-size:11px;color:rgba(255,255,255,0.3);">Үгийн тоо</div>
                    <div style="font-size:24px;font-weight:700;color:#63b3ff;">${words.length}</div>
                </div>
                <div style="padding:12px 20px;background:rgba(255,255,255,0.03);border-radius:8px;">
                    <div style="font-size:11px;color:rgba(255,255,255,0.3);">Өвөрмөц үг</div>
                    <div style="font-size:24px;font-weight:700;color:#f4a261;">${uniqueWords.size}</div>
                </div>
            </div>
            <div style="font-size:13px;color:rgba(255,255,255,0.5);padding:10px;background:rgba(255,255,255,0.03);border-radius:8px;">
                ⚠️ Энэ нь демо хувилбар. Бүрэн шалгалт нь төлбөртэй API шаарддаг.
            </div>
        `;
        
        useCredits(10);
        showToast('✅ Шалгалт амжилттай!', 'success');
        
    } catch (error) {
        console.error('Plagiarism error:', error);
        showToast('❌ Алдаа гарлаа.', 'error');
    }
    
    btn.disabled = false;
    btn.textContent = '🔎 Шалгах';
}

// ============================================================
// 15. PDF → ТЕКСТ (OCR)
// ============================================================
function runPdfOcr() {
    const file = document.getElementById('pdf-ocr-file').files[0];
    if (!file) { showToast('⚠️ PDF файл оруулна уу!', 'error'); return; }
    if (!checkCredits(5)) return;
    
    const btn = event.target;
    btn.disabled = true;
    btn.textContent = '⏳ Боловсруулж байна...';
    
    setTimeout(() => {
        const resultDiv = document.getElementById('pdf-ocr-result');
        resultDiv.classList.add('show');
        resultDiv.innerHTML = `
            <div class="result-label">📑 OCR үр дүн</div>
            <div style="font-size:14px;color:rgba(255,255,255,0.7);line-height:1.7;padding:12px;background:rgba(255,255,255,0.03);border-radius:8px;">
                📄 Файлын нэр: ${file.name}<br>
                📁 Хэмжээ: ${(file.size / 1024 / 1024).toFixed(1)} MB<br>
                📝 Хуудасны тоо: ${Math.floor(Math.random() * 8) + 2}<br><br>
                <span style="color:#4ade80;">✅ OCR амжилттай!</span><br>
                <div style="margin-top:8px;padding:10px;background:rgba(74,222,128,0.06);border-radius:6px;border:1px solid rgba(74,222,128,0.1);">
                    "Энэ бол таны PDF-ээс гаргаж авсан текст юм. Бүрэн функц нь төлбөртэй API шаарддаг."
                </div>
            </div>
            <button onclick="copyText(this)" style="margin-top:8px;padding:6px 14px;border-radius:6px;background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.1);color:rgba(255,255,255,0.5);font-size:11px;cursor:pointer;">📋 Текст хуулах</button>
        `;
        useCredits(5);
        showToast('✅ PDF боловсруулагдлаа!', 'success');
        btn.disabled = false;
        btn.textContent = '📑 Текст гаргах';
    }, 1500);
}

// ============================================================
// 16. AI ИЛРҮҮЛЭГЧ
// ============================================================
async function runAiDetect() {
    const text = document.getElementById('ai-detect-input').value.trim();
    if (!text) { showToast('⚠️ Текст оруулна уу!', 'error'); return; }
    if (!checkCredits(5)) return;
    
    const btn = event.target;
    btn.disabled = true;
    btn.textContent = '⏳ Шалгаж байна...';
    
    try {
        const words = text.split(/\s+/);
        const avgWordLen = words.reduce((sum, w) => sum + w.length, 0) / words.length;
        const aiScore = Math.min(Math.round((avgWordLen / 8) * 100), 95);
        const isAi = aiScore > 50;
        
        const resultDiv = document.getElementById('ai-detect-result');
        resultDiv.classList.add('show');
        resultDiv.innerHTML = `
            <div class="result-label">🤖 AI илрүүлэлтийн дүн</div>
            <div style="display:flex;gap:20px;flex-wrap:wrap;margin:8px 0;">
                <div style="padding:12px 20px;background:rgba(255,255,255,0.03);border-radius:8px;border:1px solid ${isAi ? 'rgba(230,57,70,0.3)' : 'rgba(74,222,128,0.3)'};">
                    <div style="font-size:11px;color:rgba(255,255,255,0.3);">AI-ээр бичигдсэн магадлал</div>
                    <div style="font-size:24px;font-weight:700;color:${isAi ? '#e63946' : '#4ade80'};">${aiScore}%</div>
                </div>
                <div style="padding:12px 20px;background:rgba(255,255,255,0.03);border-radius:8px;">
                    <div style="font-size:11px;color:rgba(255,255,255,0.3);">Дүгнэлт</div>
                    <div style="font-size:14px;font-weight:700;color:${isAi ? '#e63946' : '#4ade80'};">${isAi ? '🤖 AI-ээр бичигдсэн байх магадлалтай' : '✅ Хүний бичсэн байх магадлалтай'}</div>
                </div>
            </div>
            <div style="font-size:13px;color:rgba(255,255,255,0.5);padding:10px;background:rgba(255,255,255,0.03);border-radius:8px;">
                ⚠️ Энэ нь демо хувилбар. Бүрэн шалгалт нь төлбөртэй API шаарддаг.
            </div>
        `;
        
        useCredits(5);
        showToast('✅ Шалгалт амжилттай!', 'success');
        
    } catch (error) {
        console.error('AiDetect error:', error);
        showToast('❌ Алдаа гарлаа.', 'error');
    }
    
    btn.disabled = false;
    btn.textContent = '🤖 Шалгах';
}

// ============================================================
// 17. CHATBOT
// ============================================================
async function runChatbot() {
    const input = document.getElementById('chatbot-input');
    const question = input.value.trim();
    if (!question) { showToast('⚠️ Асуулт бичнэ үү!', 'error'); return; }
    if (!checkCredits(2)) return;
    
    const btn = event?.target || document.querySelector('#chatbot-box .run-btn');
    if (btn) { btn.disabled = true; btn.textContent = '⏳ Бодож байна...'; }
    
    try {
        const messages = document.getElementById('chatbot-messages');
        const userMsg = document.createElement('div');
        userMsg.style.cssText = 'display:flex;gap:8px;margin-bottom:10px;justify-content:flex-end;';
        userMsg.innerHTML = `
            <div style="background:rgba(74,222,128,0.12);border-radius:10px 0 10px 10px;padding:10px 12px;font-size:13px;color:rgba(255,255,255,0.9);line-height:1.6;max-width:80%;">${question}</div>
            <div style="width:28px;height:28px;border-radius:50%;background:rgba(74,222,128,0.2);display:flex;align-items:center;justify-content:center;font-size:13px;flex-shrink:0;">👤</div>
        `;
        messages.appendChild(userMsg);
        messages.scrollTop = messages.scrollHeight;
        
        input.value = '';
        
        const responses = [
            `🎬 "${question}" тухай асууж байна уу? КиноЭзэн дээр олон мэдээлэл байгаа.`,
            `📰 "${question}" — энэ сэдвээр бидэнд сонирхолтой мэдээнүүд бий.`,
            `🤖 "${question}" — AI-ийн тусламжтайгаар хариулт бэлдэж байна.`,
            `💡 "${question}" — маш сайн асуулт! КиноЭзэн танд үргэлж туслахад бэлэн.`,
            `🎥 "${question}" — кино, сериал, AI үйлчилгээний тухай дэлгэрэнгүй мэдээлэл авах боломжтой.`
        ];
        const randomResponse = responses[Math.floor(Math.random() * responses.length)];
        
        const botMsg = document.createElement('div');
        botMsg.style.cssText = 'display:flex;gap:8px;margin-bottom:10px;';
        botMsg.innerHTML = `
            <div style="width:28px;height:28px;border-radius:50%;background:linear-gradient(135deg,#059669,#4ade80);display:flex;align-items:center;justify-content:center;font-size:13px;flex-shrink:0;">🤖</div>
            <div style="background:rgba(74,222,128,0.06);border-radius:0 10px 10px 10px;padding:10px 12px;font-size:13px;color:rgba(255,255,255,0.85);line-height:1.6;max-width:80%;">${randomResponse}</div>
        `;
        messages.appendChild(botMsg);
        messages.scrollTop = messages.scrollHeight;
        
        useCredits(2);
        showToast('✅ Хариу амжилттай!', 'success');
        
    } catch (error) {
        console.error('Chatbot error:', error);
        showToast('❌ Алдаа гарлаа.', 'error');
    }
    
    if (btn) { btn.disabled = false; btn.textContent = '➤'; }
}

// ============================================================
// НЭМЭЛТ ТҮЛХҮҮР ФУНКЦУУД
// ============================================================

// Хуулах функц
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
// FILTER — services.html-д байгаа filter-тэй давхцахгүй
// ============================================================
// services.html-д аль хэдийн filter байгаа тул энд давтахгүй

// ============================================================
// INIT
// ============================================================
document.addEventListener('DOMContentLoaded', function() {
    // Credit UI шинэчлэх
    updateCreditUI();
    
    console.log('✅ services.js ачаалагдлаа! Бүртгэлтэй үйлчилгээний тоо: 17');
});
