// ============================================================
// functions/api/dream.js
// URL: POST /api/dream
// Body: { dream_text }
//
// НЭГ удаагийн AI дуудлагаар 2 хэсэг буцаана:
//   - teaser: үнэгүй, богино (frontend шууд харуулна)
//   - detail: дэлгэрэнгүй (frontend blur хийж, кредит төлсний
//             дараа л харуулна — дахин backend рүү хандахгүй)
//
// Энэ бол зугаа цэнгээний зорилготой контент — жинхэнэ
// сэтгэл судлал/анагаах ухааны дүгнэлт БИШ гэдгийг AI-д
// тодорхой зааж, хэт хар, түгшүүртэй агуулгаас зайлсхийнэ.
// ============================================================
import { callAI, corsJson, corsOptions } from '../_shared/ai.js';

export async function onRequestOptions() {
  return corsOptions();
}

export async function onRequestPost({ request, env }) {
  try {
    const { dream_text } = await request.json();

    if (!dream_text || !dream_text.trim()) {
      return corsJson({ error: 'Зүүдээ бичнэ үү' }, 400);
    }
    const dream = dream_text.trim().slice(0, 800); // хэт урт бол таслана

    const systemPrompt = `Чи дулаан, зөөлөн аястай "зүүд тайлагч". Энэ бол ЗУГАА ЦЭНГЭЭНИЙ зорилготой контент — жинхэнэ сэтгэл судлал, анагаах ухааны дүгнэлт БИШ гэдгийг чи мэднэ.

ХАТУУ ДҮРЭМ:
1. Монгол хэлээр бич.
2. Хариултаа яг доорх форматаар, 2 хэсэгт хуваа, хооронд нь "###DETAIL###" гэсэн тусгаарлагч тавь:
   [Эхний хэсэг - TEASER]: 1-2 өгүүлбэрийн богино, сониуч зан татсан ерөнхий шинж (жишээ: "Энэ зүүд сонин зүйл зөгнөж байна нь..."). Дэлгэрэнгүйг бүү дэлгэ.
   ###DETAIL###
   [Хоёрдугаар хэсэг - DETAIL]: 4-5 өгүүлбэрийн дэлгэрэнгүй тайлбар — зүүдэнд гарсан зүйлсийн уламжлалт зөнчийн утга, өнөөдрийн сэтгэл санаатай нь хэрхэн холбогдож болох нь, эцэст нь эерэг, урамтай зөвлөгөө.
3. ХЭЗЭЭ Ч үхэл, аюул, эмгэнэлт явдал тодорхой зөгнөхгүй, айлгахгүй — сөрөг зүйл гарвал үргэлж эерэг өнцгөөс, зөвлөгөө хэлбэрээр эргүүлж хэл.
4. Хэт ноцтой, эмнэлгийн, сэтгэл зүйн оношлогоо хэлбэрээр бичихгүй.
5. Дулаан, найрсаг өнгө аястай, "чи" гэж хандаж бич.`;

    const userText = `Хэрэглэгчийн зүүд: "${dream}"

Дээрх дүрмийн дагуу энэ зүүдийг тайлбарла.`;

    const { text } = await callAI(env, systemPrompt, userText, {
      temperature: 0.9,
      maxOutputTokens: 500
    });

    let teaser = text;
    let detail = '';
    if (text.includes('###DETAIL###')) {
      const parts = text.split('###DETAIL###');
      teaser = parts[0].trim();
      detail = parts.slice(1).join('###DETAIL###').trim();
    }

    return corsJson({ teaser, detail });
  } catch (err) {
    return corsJson({ error: err.message }, 500);
  }
}
