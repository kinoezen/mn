// ============================================================
// functions/api/seo-title.js
// URL: POST /api/seo-title
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
      return corsJson({ error: 'Агуулга оруулна уу' }, 400);
    }

    const systemPrompt = `Чи SEO мэргэжилтэн. Доорх агуулгад тулгуурлан SEO гарчиг (50-60 тэмдэгт орчим) болон мета тайлбар (140-160 тэмдэгт орчим) бичнэ. Гарчиг түлхуур үг агуулсан, хайлтанд тохирсон байх. Мета тайлбар сонирхол татах, товч байх.

Зөвхөн JSON форматаар хариул, markdown code fence ашиглах хэрэггуй:
{"title": "SEO гарчиг", "description": "Мета тайлбар"}`;

    const { text: rawText } = await callAI(env, systemPrompt, content, {
      temperature: 0.6,
      maxOutputTokens: 500
    });

    let result;
    try {
      const clean = rawText.replace(/```json|```/g, '').trim();
      result = JSON.parse(clean);
    } catch {
      result = { title: content.slice(0, 60), description: rawText.slice(0, 160) };
    }

    return corsJson(result);
  } catch (err) {
    return corsJson({ error: err.message }, 500);
  }
}
