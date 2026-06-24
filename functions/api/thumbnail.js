// ============================================================
// functions/api/thumbnail.js
// URL: POST /api/thumbnail
// Body: { content: string }
//
// _shared/ai.js-ийн callAI()-г ашигладаг: Gemini->Groq fallback.
// ============================================================
import { callAI, corsJson, corsOptions } from '../_shared/ai.js';

export async function onRequestOptions() {
  return corsOptions();
}

export async function onRequestPost({ request, env }) {
  try {
    const { content } = await request.json();

    if (!content || !content.trim()) {
      return corsJson({ error: 'Видеогийн агуулга оруулна уу' }, 400);
    }

    const systemPrompt = `Чи YouTube thumbnail-д зориулсан гарчиг бичигч. Богино (5-8 үгтэй), сэтгэл татам, "clickbait" мэдрэмжтэй боловч ойлгомжтой монгол гарчиг бичнэ. Шаардлагатай бол 1 emoji ашиглаж болно. Зөвхөн гарчгийг буцаа, нэмэлт тайлбар, хашилт бичих хэрэггуй.`;

    const { text } = await callAI(env, systemPrompt, content, {
      temperature: 0.9,
      maxOutputTokens: 100
    });

    return corsJson({ title: text.trim() });
  } catch (err) {
    return corsJson({ error: err.message }, 500);
  }
}
