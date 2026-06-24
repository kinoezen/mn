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
