// ============================================================
// ШИНЭ runPdfOcr() — /api/pdf-ocr руу FormData-аар fetch хийнэ,
// progress bar-тай. services.js доторх ХУУЧИН runPdfOcr()
// функцийг ЭНЭ ФУНКЦЭЭР бухэлд нь СОЛИХ.
// ============================================================
async function runPdfOcr() {
    const fileInput = document.getElementById('pdf-ocr-file');
    if (!fileInput?.files || fileInput.files.length === 0) {
        showToast('⚠️ PDF файл оруулна уу!', 'error');
        return;
    }
    const btn = event.target;
    if (btn) { btn.disabled = true; btn.textContent = '⏳ Боловсруулж байна...'; }

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
        const file = fileInput.files[0];

        if (file.size > 20 * 1024 * 1024) {
            throw new Error('PDF файл 20MB-ээс ихгуй байх ёстой');
        }

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
                resultDiv.innerHTML = `<div class="result-label">📑 OCR уур дун</div>
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

        showToast('✅ PDF боловсруулагдлаа!', 'success');
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
