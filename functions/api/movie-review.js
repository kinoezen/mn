// ============================================================
// ШИНЭ runMovieReview() — /api/movie-review руу бодитоор fetch хийнэ.
// services.js доторх ХУУЧИН runMovieReview() функцийг ҲНЭ ФУНКЦЭЭР
// бүхэлд нь СОЛИХ.
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
