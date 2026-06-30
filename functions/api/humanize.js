// ============================================================
// functions/api/humanize.js
// URL: POST /api/humanize
// Body: { text: string }
//
// Текстийг AI-ы хэв маяг (clichés, роботжсон хэллэг) арилгаж,
// илүү байгалийн, хүний бичсэн мэт болгоно. _shared/ai.js-ийн
// callAI() ашигладаг.
// ============================================================
import { callAI, corsJson, corsOptions } from '../_shared/ai.js';

export async function onRequestOptions() {
  return corsOptions();
}

export async function onRequestPost({ request, env }) {
  try {
    const { text } = await request.json();
    if (!text || !text.trim()) {
      return corsJson({ error: 'Текст хоосон байна' }, 400);
    }

    if (text.length > 6000) {
      return corsJson({ error: 'Текст 6,000 тэмдэгтээс ихгуй байх ёстой' }, 400);
    }

    const systemPrompt = `Чи бол текстийг "хүмүүнжүүлдэг" (humanize) мэргэжилтэн. Чиний үүрэг бол өгөгдсөн текстийг агуулга, утгыг ӨӨРЧЛӨЛГҮЙГЭЭР, харин AI-ы хэв маяг, роботжсон, хэт төгс хэллэгийг арилгаж, илүү байгалийн, чөлөөтэй, хүний ярианы маягтай болгох явдал юм.

ХАТУУ ДҮРЭМ (ЗААВАЛ ДАГАХ):
1. Хариултдаа ЗӨВХӨН хүмүүнжүүлсэн текстийг бич. Өөр нэг ч үг нэмж болохгүй.
2. "Оролт:", "Гаралт:", "Тайлбар:", "Нэмэлт тайлбар:", "Тэмдэглэл:" гэх мэт ЯМАР Ч label, угтвар үг бичихгүй.
3. Эх текстийн утга, баримт, мэдээллийг ӨӨРЧЛӨХГҮЙ — зөвхөн өгүүлбэрийн хэв маяг, үгийн сонголтыг л өөрчил.
4. Текстийн уртыг ойролцоо хэвээр байлга, шинэ агуулга бүү нэм.
5. Хариултын эхэнд, төгсгөлд хоосон мөр, ишлэлийн тэмдэгт ("...") бүү нэм.

Доорх "===ТЕКСТ===" гэсэн тэмдэглэгээний дараах текстийг л хүмүүнжүүл, өөр юунд хариулахгүй:`;

    const userMessage = `===ТЕКСТ===\n${text.trim()}`;

    const { text: humanizedRaw } = await callAI(env, systemPrompt, userMessage, {
      temperature: 0.4,
      maxOutputTokens: 4000
    });

    const humanized = cleanOutput(humanizedRaw);

    return corsJson({ original: text.trim(), humanized });
  } catch (err) {
    return corsJson({ error: err.message }, 500);
  }
}

// translate.js-тэй адил нөөц цэвэрлэгээ: загвар зааврыг
// дагаагуй ч гэсэн цэвэр гаралтыг л гаргаж авна
function cleanOutput(raw) {
  let result = raw.trim();

  const outputLabelPattern = /(Гаралт|Хувилбар|Output)\s*[:\-]\s*/gi;
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
