// ============================================================
// functions/api/stt.js
// URL: POST /api/stt
// Body: FormData { audio: File }
//
// Groq-ийн Whisper (whisper-large-v3-turbo) ашиглаж аудио
// файлыг текст болгоно. Groq нь OpenAI-compatible
// /audio/transcriptions endpoint ашигладаг бөгөөд шууд
// multipart/form-data хэлбэрээр файл хүлээж авдаг (base64 биш!).
// ============================================================
import { corsJson, corsOptions } from '../_shared/ai.js';

export async function onRequestOptions() {
  return corsOptions();
}

export async function onRequestPost({ request, env }) {
  try {
    if (!env.GROQ_API_KEY) {
      return corsJson({ error: 'Серверийн тохиргоо дутуу (GROQ_API_KEY алга)' }, 500);
    }

    const formData = await request.formData();
    const audioFile = formData.get('audio');

    if (!audioFile) {
      return corsJson({ error: 'Аудио файл оруулна уу' }, 400);
    }

    // Groq-ийн хязгаар: free tier ~25MB
    if (audioFile.size > 25 * 1024 * 1024) {
      return corsJson({ error: 'Аудио файл 25MB-ээс ихгуй байх ёстой' }, 400);
    }

    // Groq руу дамжуулах шинэ FormData бэлдэх
    const groqForm = new FormData();
    groqForm.append('file', audioFile, audioFile.name || 'audio.mp3');
    groqForm.append('model', 'whisper-large-v3');
    groqForm.append('response_format', 'json');
    groqForm.append('temperature', '0');

    const response = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${env.GROQ_API_KEY}`
        // АНХААР: Content-Type-ийг ӨӨРӨӨ бүү тавь! fetch нь FormData-г
        // дамжуулахдаа boundary-тэй multipart Content-Type-ийг
        // автоматаар зөв тавьдаг. Гараар тавивал Groq 400 алдаа өгнө.
      },
      body: groqForm
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Groq API error (${response.status}): ${errText}`);
    }

    const data = await response.json();
    const transcript = data?.text;

    if (!transcript) throw new Error('Groq-оос транскрипц ирсэнгуй');

    return corsJson({ transcript: transcript.trim() });
  } catch (err) {
    return corsJson({ error: err.message }, 500);
  }
}
