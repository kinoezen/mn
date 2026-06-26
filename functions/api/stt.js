// ============================================================
// functions/api/stt.js
// URL: POST /api/stt
// Body: FormData { audio: File }
//
// Gemini-ийн multimodal боломжийг ашиглаж, audio файлыг шууд
// текст болгоно. _shared/ai.js-ийн callAI() ашиглахгуй (учир нь
// тэр зөвхөн текст оруулга авдаг), харин шууд Gemini API-г
// дуудна (audio inline_data-аар дамжуулна).
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
    const audioFile = formData.get('audio');

    if (!audioFile) {
      return corsJson({ error: 'Аудио файл оруулна уу' }, 400);
    }

    // Файлын хэмжээ шалгах (Gemini inline data ~20MB хязгаартай)
    if (audioFile.size > 20 * 1024 * 1024) {
      return corsJson({ error: 'Аудио файл 20MB-ээс ихгуй байх ёстой' }, 400);
    }

    const audioBuffer = await audioFile.arrayBuffer();
    const audioBase64 = arrayBufferToBase64(audioBuffer);
    const mimeType = audioFile.type || 'audio/mpeg';

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${env.GEMINI_API_KEY}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          role: 'user',
          parts: [
            { text: 'Энэ аудио файлыг сонсож, дотор нь хэлсэн зүйлийг яг таг (монгол хэлээр) бичиж гарга. Зөвхөн транскрипцийг буцаа, нэмэлт тайлбар бичих хэрэггуй.' },
            { inline_data: { mime_type: mimeType, data: audioBase64 } }
          ]
        }],
        generationConfig: {
          temperature: 0.2,
          maxOutputTokens: 4000,
          thinkingConfig: { thinkingBudget: 0 }
        }
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Gemini API error (${response.status}): ${errText}`);
    }

    const data = await response.json();
    const transcript = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!transcript) throw new Error('Gemini-ээс транскрипц ирсэнгуй');

    return corsJson({ transcript: transcript.trim() });
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
