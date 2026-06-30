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
1. ЗӨВХӨН орчуулсан текстийг буцаа. Өөр юу ч бичих хориотой.
2. "Тайлбар:", "Нэмэлт тайлбар:", "Тэмдэглэл:", "Энэ нь...гэсэн утгатай" мэт ямар ч нэмэлт өгүүлбэр, үг тайлбар БИЧИХГҮЙ.
3. Үг бүрийн утгыг задлан тайлбарлахгүй. Зөвхөн бүхэл өгүүлбэрийг байгалийн орчуулгаар буцаа.
4. Эх текстийг давтахгүй, эх хэлээр юу ч битгий бич.
5. Орчуулгын өмнө, дараа хоосон мөр, тайлбар, ишлэл тэмдэгт ("...") бүү нэм.

ЖИШЭЭ:
Оролт: "This movie was great."
Гаралт: Энэ кино гайхалтай байсан.

(Зөвхөн ийм маягаар, шууд орчуулга л буцаа — жишээнд байгаа шиг нэмэлт юу ч бүү бич.)`;

    const { text: translatedRaw } = await callAI(env, systemPrompt, text.trim(), {
      temperature: 0.2,
      maxOutputTokens: 4000
    });

    const translated = cleanTranslation(translatedRaw);

    return corsJson({ translatedText: translated });
  } catch (err) {
    return corsJson({ error: err.message }, 500);
  }
}

// Загвар зааврыг үл тоомсорлож нэмэлт тайлбар бичсэн ч гэсэн
// тэдгээрийг таслаж, цэвэр орчуулгыг л үлдээх нөөц цэвэрлэгээ
function cleanTranslation(raw) {
  let result = raw.trim();

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

  // Эхлэл дэх "Орчуулга:" гэх мэт label-ийг арилгах
  result = result.replace(/^(Орчуулга|Translation)\s*[:\-]\s*/i, '');

  // Эхлэл/төгсгөл дэх давхар ишлэл тэмдэгтийг арилгах
  result = result.replace(/^["""]|["""]$/g, '').trim();

  return result;
}
