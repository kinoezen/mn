// ============================================================
// functions/api/chatbot.js
// URL: POST /api/chatbot
// Body: { message: string, history: [{role, content}, ...] }
//
// Энэ хувилбар _shared/ai.js-ийн callAI()-г ашигладаг:
// ЭХЛЭЭД Gemini, амжилтгүй бол АВТОМАТААР Groq.
// ============================================================
import { callAI, corsJson, corsOptions } from '../_shared/ai.js';

export async function onRequestOptions() {
  return corsOptions();
}

export async function onRequestPost({ request, env }) {
  try {
    const { message, history } = await request.json();

    if (!message) {
      return corsJson({ error: 'Мессеж оруулна уу' }, 400);
    }

    const systemPrompt = `Чи КиноЭзэн платформын AI туслах. Монгол хэлээр хариулна.
КиноЭзэн бол Монголын кино платформ бөгөөд дараах үйлчилгээнүүдтэй:
- Монгол TTS (дуу үүсгэгч), Humanizer, SRT орчуулагч, Script бичигч, Орчуулагч,
  Дуу→Текст (STT), Текст засагч, Кино тоймч, Субтитр нийлүүлэгч, Видео хуваагч,
  Дүрийн нэр орчуулагч, Пост үүсгэгч, Thumbnail гарчиг, Транскрипт засагч,
  SEO гарчиг, Plagiarism шалгагч, PDF OCR, AI илрүүлэгч.
Кредит систем: Үнэгүй=100, Стандарт=1000, Про=5000 кредит/сар.
Богино, тодорхой, найрсаг хариул. Emoji ашиглаж болно.

Өмнөх ярианы түүх (хэрэв байгаа бол):
${(history || []).slice(-6).map(h => `${h.role === 'assistant' ? 'Чи' : 'Хэрэглэгч'}: ${h.content}`).join('\n')}`;

    const { text } = await callAI(env, systemPrompt, message, {
      temperature: 0.7,
      maxOutputTokens: 1024
    });

    return corsJson({ reply: text });
  } catch (err) {
    return corsJson({ error: err.message }, 500);
  }
}
