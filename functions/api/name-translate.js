// ============================================================
// functions/api/name-translate.js
// URL: POST /api/name-translate
// Body: { names: string, sourceLang: string }
// (names - мөр тус бүрт нэг нэр)
//
// _shared/ai.js-ийн callAI()-г ашигладаг: Gemini->Groq fallback.
// ============================================================
import { callAI, corsJson, corsOptions } from '../_shared/ai.js';

const LANG_NAMES = { en: 'Англи', ru: 'Орос', zh: 'Хятад', ja: 'Япон' };

export async function onRequestOptions() {
  return corsOptions();
}

export async function onRequestPost({ request, env }) {
  try {
    const { names, sourceLang } = await request.json();

    if (!names || !names.trim()) {
      return corsJson({ error: 'Нэрс оруулна уу' }, 400);
    }

    const nameList = names.split('\n').map(n => n.trim()).filter(Boolean);
    if (nameList.length === 0) {
      return corsJson({ error: 'Хэвийн нэр олдсонгуй' }, 400);
    }

    const langName = LANG_NAMES[sourceLang] || sourceLang || 'Англи';

    const systemPrompt = `Чи кино/телевизийн дүрийн нэр орчуулагч. Доорх ${langName} хэлний хувь хүний нэрсийг Монгол хэлний стандарт дуудлагын дүрмээр (кириллээр) орчуул. Бодит дуудлагад ойртуулж бич, шууд үсэг хөрвүүлэлт хийхгуй.

Зөвхөн JSON форматаар хариул, markdown code fence ашиглах хэрэггуй:
{"translations": [{"original": "эх нэр", "translated": "монгол орчуулга"}, ...]}`;

    const { text: rawText } = await callAI(env, systemPrompt, nameList.join('\n'), {
      temperature: 0.3,
      maxOutputTokens: 2000
    });

    let result;
    try {
      const clean = rawText.replace(/```json|```/g, '').trim();
      result = JSON.parse(clean);
    } catch {
      result = { translations: nameList.map(n => ({ original: n, translated: '(алдаа)' })) };
    }

    return corsJson(result);
  } catch (err) {
    return corsJson({ error: err.message }, 500);
  }
}
