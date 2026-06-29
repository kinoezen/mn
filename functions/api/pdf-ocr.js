// ============================================================
// functions/api/pdf-ocr.js
// URL: POST /api/pdf-ocr
// Body: FormData { pdf: File }
//
// Gemini-ийн multimodal боломжийг ашиглаж, PDF файлыг шууд
// текст болгоно. Tesseract OCR ХЭРЭГЦЭГУЙ — Gemini PDF-ийг
// зураг хэлбэрээр шууд "уншиж" чадна (хуудас бугдийн текст,
// хувиргалт хийдэг). Stt.js-тэй яг адил архитектур.
// ============================================================
import { corsJson, corsOptions } from '../_shared/ai.js';

export async function onRequestOptions() {
  return corsOptions();
}

export async function onRequestPost({ request, env }) {
  try {
    if (!env.GEMINI_API_KEY) {
      return corsJson({ error: 'Серверийн тохиргоо дутуу (GEMINI_API_KEY алга)' }, 500);
    }

    const formData = await request.formData();
    const pdfFile = formData.get('pdf');

    if (!pdfFile) {
      return corsJson({ error: 'PDF файл оруулна уу' }, 400);
    }

    // Файлын хэмжээ шалгах (Gemini inline data ~20MB хязгаартай)
    if (pdfFile.size > 20 * 1024 * 1024) {
      return corsJson({ error: 'PDF файл 20MB-ээс ихгуй байх ёстой' }, 400);
    }

    const pdfBuffer = await pdfFile.arrayBuffer();
    const pdfBase64 = arrayBufferToBase64(pdfBuffer);

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${env.GEMINI_API_KEY}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          role: 'user',
          parts: [
            { text: 'Энэ PDF файлыг сонсож (уншиж) дотор нь байгаа бугд текстийг яг таг гаргаж бич. Хуудас тус бугдийн агуулгыг дараалуулан гарга. Зөвхөн PDF доторх текстийг буцаа, нэмэлт тайлбар бичих хэрэггуй.' },
            { inline_data: { mime_type: 'application/pdf', data: pdfBase64 } }
          ]
        }],
        generationConfig: {
          temperature: 0.1,
          maxOutputTokens: 8000,
          thinkingConfig: { thinkingBudget: 0 }
        }
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Gemini API error (${response.status}): ${errText}`);
    }

    const data = await response.json();
    const extractedText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!extractedText) throw new Error('Gemini-ээс текст ирсэнгуй');

    // Хуудасны тоог тооцоолох (ойролцоо, форм-feed тэмдэгээр)
    const pageCount = (extractedText.match(/\f/g) || []).length + 1;

    return corsJson({ text: extractedText.trim(), pages: pageCount });
  } catch (err) {
    return corsJson({ error: err.message }, 500);
  }
}

function arrayBufferToBase64(buffer) {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  const chunkSize = 8192;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode.apply(null, bytes.subarray(i, i + chunkSize));
  }
  return btoa(binary);
}
