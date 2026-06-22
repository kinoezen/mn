// ============================================================
// ШИНЭ runTTS() — /api/tts руу бодитоор fetch хийнэ.
// services.js доторх ХУУЧИН runTTS() функцийг ҲНЭ ФУНКЦЭЭР
// бүхэлд нь СОЛИХ.
// ============================================================

async function runTTS() {
    const text = document.getElementById('tts-text')?.value.trim();
    if (!text) { showToast('⚠️ Текст оруулна уу!', 'error'); return; }
    const btn = document.getElementById('tts-run-btn');
    if (btn) { btn.disabled = true; btn.textContent = '⏳ Үүсгэж байна...'; }

    try {
        const voice = document.querySelector('.vbtn.on')?.textContent.trim() || 'Батаа';
        const rate = document.getElementById('rate')?.value || 15;
        const pitch = document.getElementById('pitch')?.value || -8;

        const response = await fetch('/api/tts', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                text,
                engine: 'edge',
                voice: voice === 'Есүй' ? 'Есүй (эмэгтэй)' : 'Батаа (эрэгтэй)',
                rate: Number(rate),
                pitch: Number(pitch),
                volume: 0
            })
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
