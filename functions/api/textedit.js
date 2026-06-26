// ============================================================
// functions/api/textedit.js
// URL: POST /api/textedit
// Body: { text: string, fixGrammar: bool, fixPunctuation: bool, fixStyle: bool }
//
// _shared/ai.js-ийн callAI()-г ашигладаг: Gemini->Groq fallback.
// ============================================================
import { callAI, corsJson, corsOptions } from '../_shared/ai.js';

export async function onRequestOptions() {
  return corsOptions();
}

export async function onRequestPost({ request, env }) {
  try {
    const { text, fixGrammar, fixPunctuation, fixStyle } = await request.json();

    if (!text || !text.trim()) {
      return corsJson({ error: 'Текст оруулна уу' }, 400);
    }

    const tasks = [];
    if (fixGrammar !== false) tasks.push('дүрмийн алдаа (үгийн хэлбэр, тийн ялгал, нийлэмж) засах');
    if (fixPunctuation !== false) tasks.push('цэг таслалын алдаа засах');
    if (fixStyle) tasks.push('найруулгыг сайжруулах (илүү гөлгөр, уншихад хялбар болгох)');

    if (tasks.length === 0) tasks.push('дүрмийн болон цэг таслалын алдаа засах');

    const systemPrompt = `Чи монгол хэлний редактор. Доорх текстийг засна: ${tasks.join(', ')}. Утга, агуулга, өгүүлбэрийн бүтцийг (найруулга сонгогдоогуй бол) хэвээр хадгал. Зөвхөн засагдсан текстийг буцаа, нэмэлт тайлбар бичих хэрэггуй.`;

    const { text: edited } = await callAI(env, systemPrompt, text, {
      temperature: 0.3,
      maxOutputTokens: 4000
    });

    return corsJson({ original: text, edited });
  } catch (err) {
    return corsJson({ error: err.message }, 500);
  }
}
