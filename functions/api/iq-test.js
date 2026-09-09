// ============================================================
// functions/api/iq-test.js
// URL: POST /api/iq-test
// Body: { score, logic: {correct,total}, math: {correct,total}, verbal: {correct,total} }
//
// Оноог (score) frontend дээр deterministic аргаар (зөв хариултын
// тоогоор) тооцдог тул энд дахин тооцохгүй. Зөвхөн ирсэн мэдээлэл
// дээр үндэслэн хувь хүнд зориулсан ДЭЛГЭРЭНГҮЙ ТАЙЛАН бичнэ.
//
// Энэ бол клиникийн IQ шинжилгээ БИШ, зугаа цэнгээний зорилготой
// оюуны тест гэдгийг AI-д тодорхой зааж өгнө.
// ============================================================
import { callAI, corsJson, corsOptions } from '../_shared/ai.js';

export async function onRequestOptions() {
  return corsOptions();
}

export async function onRequestPost({ request, env }) {
  try {
    const { score, logic, math, verbal } = await request.json();

    const s = Math.max(70, Math.min(160, parseInt(score, 10) || 100));
    const L = logic || { correct: 0, total: 4 };
    const M = math || { correct: 0, total: 5 };
    const V = verbal || { correct: 0, total: 3 };

    const systemPrompt = `Чи урам зоригтой, дэмжлэг өгдөг "оюуны тестийн тайлан бичигч". Энэ бол ЗУГАА ЦЭНГЭЭНИЙ зорилготой тест — жинхэнэ клиникийн IQ шинжилгээ БИШ гэдгийг чи мэднэ.

ХАТУУ ДҮРЭМ:
1. Монгол хэлээр, дулаан, урам зоригтой өнгө аястай бич.
2. Хэзээ ч хүнийг "тэнэг", "муу" гэж бичихгүй — бүх дүнг эерэг өнцгөөс, хөгжүүлэх боломж хэлбэрээр тайлбарла.
3. 3 хэсэгтэй бич, label бүрийг **тод** болго:
   (1) **Ерөнхий дүгнэлт** — 2 өгүүлбэр, оноог тайлбарла.
   (2) **Давуу тал** — аль төрлийн бодлого (логик/тоон/үгийн сан) сайн бодсоныг тэмдэглэ, яагаад сайн болохыг тайлбарла.
   (3) **Хөгжүүлэх зөвлөгөө** — сул талыг сайжруулах 2 практик зөвлөгөө өг.
4. Нийт 150-200 үг орчим бич.
5. "чи" гэж хандаж бич.`;

    const userText = `Хэрэглэгчийн оюуны тестийн дүн:
- Нийт оноо: ${s} (дундаж 100)
- Логик бодлого: ${L.correct}/${L.total} зөв
- Тоон бодлого: ${M.correct}/${M.total} зөв
- Үгийн сан/аналог: ${V.correct}/${V.total} зөв

Дээрх дүрмийн дагуу энэ хүний хувьд дэлгэрэнгүй тайлан бич.`;

    const { text } = await callAI(env, systemPrompt, userText, {
      temperature: 0.8,
      maxOutputTokens: 650
    });

    return corsJson({ report: text });
  } catch (err) {
    return corsJson({ error: err.message }, 500);
  }
}
