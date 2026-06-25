// ============================================================
// functions/api/translate.js
// URL: POST /api/translate
// Body: { text: string, from: string, to: string }
//
// _shared/ai.js-ийн callAI()-г ашигладаг: Gemini->Groq fallback.
// ============================================================
import { callAI, corsJson, corsOptions } from '../_shared/ai.js';

const LANG_NAMES = {
  en: 'Англи', mn: 'Монгол', ru: 'Орос',
  zh: 'Хятад', ja: 'Япон', ko: 'Солонгос'
};

export async function onRequestOptions() {
  return corsOptions();
}

export async function onRequestPost({ request, env }) {
  try {
    const { text, from, to } = await request.json();

    if (!text || !text.trim()) {
      return corsJson({ error: 'Текст хоосон байна' }, 400);
    }

    const fromName = LANG_NAMES[from] || from;
    const toName = LANG_NAMES[to] || to;

    const systemPrompt = `Чи мэргэжлийн орчуулагч. Доорх ${fromName} хэлний текстийг ${toName} хэл рүү байгалийн, ойлгомжтой, утга алдалгуй орчуулна уу. Зөвхөн орчуулсан текстийг буцаа, нэмэлт тайлбар бичих хэрэггуй.`;

    const { text: translated } = await callAI(env, systemPrompt, text.trim(), {
      temperature: 0.3,
      maxOutputTokens: 4000
    });

    return corsJson({ translatedText: translated });
  } catch (err) {
    return corsJson({ error: err.message }, 500);
  }
}
