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
      short: { name: '1-2 минутын', words: '150-250 үг' },
      medium: { name: '3-5 минутын', words: '450-750 үг' },
      long: { name: '7-10 минутын', words: '1000-1500 үг' }
    };
    const lengthInfo = lengthMap[length] || lengthMap.medium;

    const systemPrompt = `Чи контент бичигч. Монгол хэлээр ${typeName}-д зориулсан script бичнэ. Урт: ${lengthInfo.name} ярианы script, ойролцоогоор ${lengthInfo.words} (ЭНЭ ҲГИЙН ТООГ БАРИМТЛАХ ШААРДЛАГАТАЙ, бичвэр богино гарвал зөв биш).
Дараах бүтцээр бич:
- Hook (анхны 5-10 секундэд анхаарал татах)
- Үндсэн агуулга (тодорхой хэсэгт хуваагдсан, дэлгэрэнгуй жишээ, тайлбар орсон байх)
- Дуусгал (call-to-action эсвэл сэтгэл хөдөлгөм төгсгөл)
Ярианы хэллэгээр, байгалийн урсгалтай бич. Шаардлагатай газар [ДУУГАРАХ ЗААВАР] гэх мэт тэмдэглэгээ ашиглаж болно.`;

    const { text } = await callAI(env, systemPrompt, topic, {
      temperature: 0.8,
      maxOutputTokens: 8000
    });

    return corsJson({ script: text });
  } catch (err) {
    return corsJson({ error: err.message }, 500);
  }
}
