// ============================================================
// functions/api/ai-detect.js
// URL: POST /api/ai-detect
// Body: { text: string }
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
    const { text } = await request.json();

    if (!text) {
      return corsJson({ error: 'Текст оруулна уу' }, 400);
    }

    const systemPrompt = `Чи AI илрүүлэгч. Дараах монгол текстийг AI-р бичигдсэн эсэхийг шинжил. Үг сонголт, өгүүлбэрийн бүтэц, давталт, "хиймэл" хэллэг зэргийг харгал.

Зөвхөн JSON форматаар хариул, нэмэлт тайлбар бичих хэрэггүй, markdown code fence ашиглах хэрэггүй:
{"score": <0-100 тоо, AI-р бичигдсэн магадлал>, "verdict": "AI-р бичигдсэн / Хүн бичсэн", "reasons": ["шалтгаан 1", "шалтгаан 2"]}`;

    const { text: rawText } = await callAI(env, systemPrompt, text, {
      temperature: 0.3,
      maxOutputTokens: 1024
    });

    let result;
    try {
      const clean = rawText.replace(/```json|```/g, '').trim();
      result = JSON.parse(clean);
    } catch {
      result = { score: 50, verdict: 'Тодорхойгүй', reasons: [rawText] };
    }

    return corsJson(result);
  } catch (err) {
    return corsJson({ error: err.message }, 500);
  }
}
