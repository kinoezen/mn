// ============================================================
// functions/api/translate.js
// URL: POST /api/translate
// Body: { text: string, from: string, to: string }
//
// _shared/ai.js-ийн callAI()-г ашигладаг: Gemini->Groq fallback.
//
// ЗАСВАР: Groq fallback (Llama гэх мэт) загвар "тайлбар бичих
// хэрэггуй" гэсэн зааврыг үргэлж чанд дагадаггүй тул:
// 1) Prompt-ийг илүү хатуу, жишээтэй болгосон
// 2) Хариуг буцаахын өмнө "Нэмэлт тайлбар:" гэх мэт section-уудыг
//    автоматаар таслаж арилгадаг цэвэрлэгээ нэмсэн (аюулгуйн нөөц)
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

    const systemPrompt = `Чи бол шууд орчуулга хийдэг машин (Google Translate-тэй адил). Чиний цорын ганц үүрэг бол ${fromName} хэлнээс ${toName} хэл рүү байгалийн, ойлгомжтой, утга алдалгүй орчуулга хийх явдал юм.

ХАТУУ ДҮРЭМ (ЗААВАЛ ДАГАХ):
1. Хариултдаа ЗӨВХӨН орчуулсан текстийг бич. Өөр нэг ч үг нэмж болохгүй.
2. "Оролт:", "Гаралт:", "Тайлбар:", "Нэмэлт тайлбар:", "Тэмдэглэл:" гэх мэт ЯМАР Ч label, угтвар үг бичихгүй.
3. Эх текстийг ХЭЗЭЭ Ч давтахгүй, иш татахгүй.
4. Үг бүрийн утгыг задлан тайлбарлахгүй.
5. Хариултын эхэнд, төгсгөлд хоосон мөр, ишлэлийн тэмдэгт ("...") бүү нэм.

Доорх "===ТЕКСТ===" гэсэн тэмдэглэгээний дараах текстийг л орчуул, өөр юунд хариулахгүй:`;

    const userMessage = `===ТЕКСТ===\n${text.trim()}`;

    const { text: translatedRaw } = await callAI(env, systemPrompt, userMessage, {
      temperature: 0.1,
      maxOutputTokens: 4000
    });

    const translated = cleanTranslation(translatedRaw);

    return corsJson({ translatedText: translated });
  } catch (err) {
    return corsJson({ error: err.message }, 500);
  }
}

// Загвар зааврыг үл тоомсорлож "Оролт: ... Гаралт: ..." гэх мэт
// echo хийсэн ч, эсвэл нэмэлт тайлбар бичсэн ч гэсэн цэвэр
// орчуулгыг гаргаж авах нөөц цэвэрлэгээ
function cleanTranslation(raw) {
  let result = raw.trim();

  // Хэрэв загвар "Гаралт:" / "Output:" / "Орчуулга:" гэх мэт
  // label ашиглаж "Оролт/Input" хэсгээ давтсан бол, ХАМГИЙН
  // СҮҮЛИЙН ийм label-ийн ДАРААХ хэсгийг л авна (тэр нь жинхэнэ
  // орчуулга байх магадлал хамгийн өндөр)
  const outputLabelPattern = /(Гаралт|Орчуулга|Output|Translation)\s*[:\-]\s*/gi;
  const matches = [...result.matchAll(outputLabelPattern)];
  if (matches.length > 0) {
    const last = matches[matches.length - 1];
    result = result.slice(last.index + last[0].length).trim();
  } else {
    // Label байхгүй бол "Оролт:"/"Input:" гэх мэт эхлэлийн
    // section-ийг устгаад үлдсэнийг авах
    result = result.replace(/^(Оролт|Input)\s*[:\-]\s*["""]?[^\n]*["""]?\n*/i, '').trim();
  }

  // "Нэмэлт тайлбар:", "Тайлбар:", "Тэмдэглэл:", "Note:" гэх мэт
  // section эхэлсэн цэгээс хойшхи бүгдийг таслах
  const cutPatterns = [
    /\n+\s*(Нэмэлт\s+тайлбар|Тайлбар|Тэмдэглэл|Жич|Note|Explanation)\s*[:\-]/i
  ];
  for (const pattern of cutPatterns) {
    const match = result.match(pattern);
    if (match && match.index !== undefined) {
      result = result.slice(0, match.index).trim();
    }
  }

  // Эхлэл/төгсгөл дэх давхар ишлэл тэмдэгтийг арилгах
  result = result.replace(/^["""]|["""]$/g, '').trim();

  return result;
}
