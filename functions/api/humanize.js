// ============================================================
// ШИНЭ runHum() — /api/humanize руу бодитоор fetch хийнэ.
// services.js доторх ХУУЧИН runHum() функцийг ЭНЭ ФУНКЦЭЭР
// бүхэлд нь СОЛИХ.
// ============================================================
async function runHum() {
    const text = document.getElementById('hum-input')?.value.trim();
    if (!text) { showToast('⚠️ Текст оруулна уу!', 'error'); return; }
    const btn = event.target;
    if (btn) { btn.disabled = true; btn.textContent = '⏳ Хүмүүнжүүлж байна...'; }
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
    } catch (error) {
        console.error('Humanizer error:', error);
        showToast('❌ ' + error.message, 'error');
    }
    if (btn) { btn.disabled = false; btn.textContent = '✨ Хүмүүнжүүлэх'; }
}
