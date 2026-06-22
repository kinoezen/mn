// ============================================================
// functions/api/movie-review.js
// URL: POST /api/movie-review
// Body: { title: string, length: "short" | "medium" | "long" }
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
    const { title, length } = await request.json();

    if (!title) {
      return corsJson({ error: 'Кино нэр оруулна уу' }, 400);
    }

    const lengthMap = { short: '150-200 үг', medium: '300-400 үг', long: '500-700 үг' };
    const wordCount = lengthMap[length] || '300-400 үг';

    const systemPrompt = `Чи кино шинжээч. Монгол хэлээр кино тойм бичнэ.`;
    const userText = `"${title}" киноны монгол тойм бич. Урт: ${wordCount}.
Дараах бүтцээр бич:
- Товч танилцуулга
- Үйл явдал (spoiler-гүй)
- Найруулагч болон жүжигчид
- Онцлог тал
- Үнэлгээ (10-аас)
Уншихад сонирхолтой байдлаар бич.`;

    const { text } = await callAI(env, systemPrompt, userText, {
      temperature: 0.8,
      maxOutputTokens: 6000
    });

    return corsJson({ review: text });
  } catch (err) {
    return corsJson({ error: err.message }, 500);
  }
}
