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

    const systemPrompt = `Чи YouTube thumbnail-д зориулсан гарчиг бичигч. Сэтгэл татам, "clickbait" мэдрэмжтэй боловч ойлгомжтой, БҲТЭН өгүүлбэр хэлбэртэй монгол гарчиг бичнэ (10-15 үг орчим). Гарчиг тодорхой санаагаар төгссөн байх ёстой, дундаасаа тасрахгуй. Шаардлагатай бол 1 emoji ашиглаж болно. Зөвхөн гарчгийг буцаа, нэмэлт тайлбар, хашилт бичих хэрэггуй.`;

    const { text } = await callAI(env, systemPrompt, content, {
      temperature: 0.9,
      maxOutputTokens: 500
    });

    return corsJson({ title: text.trim() });
  } catch (err) {
    return corsJson({ error: err.message }, 500);
  }
}
