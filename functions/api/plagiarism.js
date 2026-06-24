// ============================================================
// functions/api/plagiarism.js
// URL: POST /api/plagiarism
// Body: { text: string }
//
// _shared/ai.js-ийн callAI()-г ашигладаг: Gemini->Groq fallback.
//
// АНХААР: AI бол интернет дэх бодит эх сурвалжтай харьцуулж
// чадахгуй (Gemini/Groq нь хайлтын систем биш). Тэгэхээр энэ нь
// "жинхэнэ plagiarism checker" биш, харин ТЕКСТИЙН ХЭВ ШИНЖИЙГ
// шинжилж ("AI-р бичигдсэн магадлал", "ерийн/түгээмэл хэллэг
// их эсэх") дүгнэлт гаргадаг хэрэгсэл.
// ============================================================
import { callAI, corsJson, corsOptions } from '../_shared/ai.js';

export async function onRequestOptions() {
  return corsOptions();
}

export async function onRequestPost({ request, env }) {
  try {
    const { text } = await request.json();

    if (!text || !text.trim()) {
      return corsJson({ error: 'Текст оруулна уу' }, 400);
    }

    const systemPrompt = `Чи текст шинжилгээний шинжээч. Дараах монгол текстийг шинжилж, өвөрмөц бус (generic), маш түгээмэл хэрэглэгддэг хэллэг, клише, "хаа сайгуй харагдсан" мэт өгүүлбэрийн агуулга хэр зэрэг байгааг үнэлнэ. Энэ нь интернет хайлт хийдэг жинхэнэ plagiarism checker биш, зөвхөн текстийн өвөрмөц бус байдлыг үнэлдэг хэрэгсэл гэдгийг анхаар.

Зөвхөн JSON форматаар хариул, markdown code fence ашиглах хэрэггуй:
{"score": <0-100 тоо, өвөрмөц бус/клише байдлын түвшин>, "verdict": "Өвөрмөц / Дунд зэрэг / Клише ихтэй", "reasons": ["шалтгаан 1", "шалтгаан 2"]}`;

    const { text: rawText } = await callAI(env, systemPrompt, text, {
      temperature: 0.3,
      maxOutputTokens: 1024
    });

    let result;
    try {
      const clean = rawText.replace(/```json|```/g, '').trim();
      result = JSON.parse(clean);
    } catch {
      result = { score: 50, verdict: 'Тодорхойгуй', reasons: [rawText] };
    }

    return corsJson(result);
  } catch (err) {
    return corsJson({ error: err.message }, 500);
  }
}
