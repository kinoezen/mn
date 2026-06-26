// ============================================================
// functions/api/script-writer.js
// URL: POST /api/script-writer
// Body: { topic: string, type: string, length: string }
//
// _shared/ai.js-ийн callAI()-г ашигладаг: Gemini->Groq fallback.
// ============================================================
import { callAI, corsJson, corsOptions } from '../_shared/ai.js';

export async function onRequestOptions() {
  return corsOptions();
}

export async function onRequestPost({ request, env }) {
  try {
    const { topic, type, length } = await request.json();

    if (!topic || !topic.trim()) {
      return corsJson({ error: 'Сэдэв оруулна уу' }, 400);
    }

    const typeNames = {
      youtube: 'YouTube видео',
      podcast: 'Подкаст',
      movie: 'Кино тайлбар (review/recap)'
    };
    const typeName = typeNames[type] || 'YouTube видео';

    const lengthMap = {
      short: { name: '1-2 минутын', words: '150-250 үг', min: 150 },
      medium: { name: '3-5 минутын', words: '450-750 үг', min: 450 },
      long: { name: '7-10 минутын', words: '1100-1500 үг', min: 1100 }
    };
    const lengthInfo = lengthMap[length] || lengthMap.medium;

    const systemPrompt = `Чи туршлагатай YouTube/подкаст script бичигч. Монгол хэлээр ${typeName}-д зориулсан script бичнэ.

ЧУХАЛ ШААРДЛАГА: Script нь хамгийн багадаа ${lengthInfo.min} үг байх ёстой (зорилтот хэмжээ: ${lengthInfo.words}). Богино, товч хариулт ХҲЛЕЭЛТЭЙ БИШ. Хэрэв таны эхний хариулт хэт богино бол, илүү дэлгэрэнгуй жишээ, тайлбар, түухи, статистик нэмж бич.

Дараах бүтцээр бич (тус бүрийг сайтар, дэлгэрэнгуй бич):
1. Hook (15-20 секундийн анхаарал татах эхлэл)
2. Танилцуулга (сэдвийг тодорхойлох)
3. Үндсэн агуулга (3-5 дэд сэдэв, тус бүрд дэлгэрэнгуй тайлбар, жишээ, түух орсон байх)
4. Дуусгал (дүгнэлт + call-to-action)

Ярианы хэллэгээр, байгалийн урсгалтай, сонирхолтой дэлгэрэнгуй байдлаар бич. Шаардлагатай газар [ДУУГАРАХ ЗААВАР] гэх мэт тэмдэглэгээ ашиглаж болно.`;

    const { text } = await callAI(env, systemPrompt, topic, {
      temperature: 0.7,
      maxOutputTokens: 8000
    });

    return corsJson({ script: text });
  } catch (err) {
    return corsJson({ error: err.message }, 500);
  }
}
