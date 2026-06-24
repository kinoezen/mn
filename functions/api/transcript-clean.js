// ============================================================
// functions/api/transcript-clean.js
// URL: POST /api/transcript-clean
// Body: { text: string, removeFillers: boolean, removeRepeats: boolean }
//
// _shared/ai.js-ийн callAI()-г ашигладаг: Gemini->Groq fallback.
// ============================================================
import { callAI, corsJson, corsOptions } from '../_shared/ai.js';

export async function onRequestOptions() {
  return corsOptions();
}

export async function onRequestPost({ request, env }) {
  try {
    const { text, removeFillers, removeRepeats } = await request.json();

    if (!text || !text.trim()) {
      return corsJson({ error: 'Текст оруулна уу' }, 400);
    }
    if (text.length > 6000) {
      return corsJson({ error: 'Текст 6000 тэмдэгтээс ихгуй байх ёстой' }, 400);
    }

    const tasks = [];
    if (removeFillers !== false) tasks.push('дүүргэгч үг (ааа, эээ, тэгээд, дээ гэх мэт) арилгах');
    if (removeRepeats !== false) tasks.push('давтагдсан үг, өгүүлбэр цэвэрлэх');

    const systemPrompt = `Чи яриа таниулагч (STT) текстийн редактор. Доорх монгол транскриптийг цэвэрлэнэ: ${tasks.join(', ')}. Утга, агуулга бүрэн хэвээр хадгал, зөвхөн хэлний бохирдол арилга. Зөвхөн цэвэрлэсэн текстийг буцаа, нэмэлт тайлбар бичих хэрэггуй.`;

    const { text: cleaned } = await callAI(env, systemPrompt, text, {
      temperature: 0.3,
      maxOutputTokens: 8000
    });

    return corsJson({ original: text, cleaned });
  } catch (err) {
    return corsJson({ error: err.message }, 500);
  }
}
