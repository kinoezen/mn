// ============================================================
// functions/api/textedit.js
// URL: POST /api/textedit
// Body: { text: string, fixGrammar: boolean, fixPunctuation: boolean }
//
// Текстийн дүрэм, найруулга, цэг таслалын алдааг засна.
// _shared/ai.js-ийн callAI() ашигладаг.
// ============================================================
import { callAI, corsJson, corsOptions } from '../_shared/ai.js';

export async function onRequestOptions() {
  return corsOptions();
}

export async function onRequestPost({ request, env }) {
  try {
    const { text, fixGrammar, fixPunctuation } = await request.json();
    if (!text || !text.trim()) {
      return corsJson({ error: 'Текст хоосон байна' }, 400);
    }

    if (text.length > 6000) {
      return corsJson({ error: 'Текст 6,000 тэмдэгтээс ихгуй байх ёстой' }, 400);
    }

    const tasks = [];
    if (fixGrammar !== false) tasks.push('дүрмийн (грамматик) болон найруулгын алдааг засах');
    if (fixPunctuation !== false) tasks.push('цэг таслалын (өргүй мөн дутуу зай, таслал, цэг) алдааг засах');
    const taskText = tasks.length ? tasks.join(', ') : 'дүрэм, найруулга, цэг таслалын алдааг засах';

    const systemPrompt = `Чи бол Монгол хэлний мэргэжлийн редактор. Чиний үүрэг бол өгөгдсөн текстийн ${taskText} явдал юм.

ХАТУУ ДҮРЭМ (ЗААВАЛ ДАГАХ):
1. Хариултдаа ЗӨВХӨН засагдсан текстийг бич. Өөр нэг ч үг нэмж болохгүй.
2. "Оролт:", "Гаралт:", "Тайлбар:", "Нэмэлт тайлбар:", "Тэмдэглэл:" гэх мэт ЯМАР Ч label, угтвар үг бичихгүй.
3. Текстийн утга, агуулга, өгүүлбэрийн бүтцийг ӨӨРЧЛӨХГҮЙ — зөвхөн алдааг л засна. Шинэ агуулга бүү нэм, шинэ санаа бүү зохио.
4. Хэрэв алдаа байхгүй бол текстийг өөрчлөлтгүй буцаа.
5. Хариултын эхэнд, төгсгөлд хоосон мөр, ишлэлийн тэмдэгт ("...") бүү нэм.

Доорх "===ТЕКСТ===" гэсэн тэмдэглэгээний дараах текстийг л засаарай, өөр юунд хариулахгүй:`;

    const userMessage = `===ТЕКСТ===\n${text.trim()}`;

    const { text: editedRaw } = await callAI(env, systemPrompt, userMessage, {
      temperature: 0.2,
      maxOutputTokens: 4000
    });

    const edited = cleanOutput(editedRaw);

    return corsJson({ original: text.trim(), edited });
  } catch (err) {
    return corsJson({ error: err.message }, 500);
  }
}

function cleanOutput(raw) {
  let result = raw.trim();

  const outputLabelPattern = /(Гаралт|Засагдсан|Output)\s*[:\-]\s*/gi;
  const matches = [...result.matchAll(outputLabelPattern)];
  if (matches.length > 0) {
    const last = matches[matches.length - 1];
    result = result.slice(last.index + last[0].length).trim();
  } else {
    result = result.replace(/^(Оролт|Input)\s*[:\-]\s*["""]?[^\n]*["""]?\n*/i, '').trim();
  }

  const cutPatterns = [
    /\n+\s*(Нэмэлт\s+тайлбар|Тайлбар|Тэмдэглэл|Жич|Note|Explanation)\s*[:\-]/i
  ];
  for (const pattern of cutPatterns) {
    const match = result.match(pattern);
    if (match && match.index !== undefined) {
      result = result.slice(0, match.index).trim();
    }
  }

  result = result.replace(/^["""]|["""]$/g, '').trim();

  return result;
}
