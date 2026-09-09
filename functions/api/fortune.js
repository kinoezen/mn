// ============================================================
// functions/api/fortune.js
// URL: POST /api/fortune
// Body: { dob, genre }
//
// Нэг удаагийн AI дуудлагаар teaser (үнэгүй) + detail (5 кредит,
// frontend blur хийж нээнэ) гэсэн 2 хэсэг буцаана.
//
// Copyright-той кино/дүрийн нэрийг ШУУД дурдахгүй — зөвхөн
// төрөл (жанр)-д тохирсон ЕРӨНХИЙ дүрийн шинжийг ашиглана
// (жишээ: "эрэлхэг баатар" гэх мэт, "Джон Уик" гэж нэрлэхгүй).
// ============================================================
import { callAI, corsJson, corsOptions } from '../_shared/ai.js';

export async function onRequestOptions() {
  return corsOptions();
}

const ALLOWED_GENRES = ['Экшн', 'Романтик', 'Аймаар', 'Драм', 'Фантастик', 'Аниме'];

export async function onRequestPost({ request, env }) {
  try {
    const { dob, genre } = await request.json();

    if (!dob) return corsJson({ error: 'Төрсөн огноогоо оруулна уу' }, 400);
    const safeGenre = ALLOWED_GENRES.includes(genre) ? genre : 'Экшн';

    const year = new Date().getFullYear();

    const systemPrompt = `Чи хөгжилтэй, урам зоригтой "кино зөгнөгч". Энэ бол ЗУГАА ЦЭНГЭЭНИЙ контент — жинхэнэ зурхай БИШ гэдгийг чи мэднэ.

ХАТУУ ДҮРЭМ:
1. Монгол хэлээр бич.
2. ХЭЗЭЭ Ч бодит, copyright-той кино нэр, жүжигчний нэр, дүрийн нэр (жишээ нь "Джон Уик", "Rocky", "Batman" гэх мэт) бүү дурд. Зөвхөн ЕРӨНХИЙ дүрийн загвар ашигла (жишээ: "эрэлхэг тулаанч", "эмзэг зүрхт хайрлагч", "мэргэн адал явдалч" гэх мэт өөрөө зохион бүтээсэн дүрийн загвар).
3. Хариултаа яг доорх форматаар, 2 хэсэгт хуваа, хооронд нь "###DETAIL###" тусгаарлагч тавь:
   [TEASER]: 1-2 өгүүлбэрийн богино, сониуч зан татсан зөгнөл эхлэл.
   ###DETAIL###
   [DETAIL]: 4-5 өгүүлбэрийн ${safeGenre} жанрын кино маягийн зөгнөл — ${year} онд юу тохиолдож болох, ямар сорилт, ямар ялалт хүлээж байгаа тухай, эцэст нь урамтай зөвлөгөө.
4. Дулаан, урам зоригтой өнгө аястай бич, "чи" гэж хандаж бич.`;

    const userText = `Хэрэглэгчийн төрсөн огноо: ${dob}. Дуртай кино жанр: ${safeGenre}.
${year} онд энэ хүнд тохиолдох "кино маягийн зөгнөл" бич.`;

    const { text } = await callAI(env, systemPrompt, userText, {
      temperature: 0.95,
      maxOutputTokens: 500
    });

    let teaser = text;
    let detail = '';
    if (text.includes('###DETAIL###')) {
      const parts = text.split('###DETAIL###');
      teaser = parts[0].trim();
      detail = parts.slice(1).join('###DETAIL###').trim();
    }

    return corsJson({ teaser, detail, genre: safeGenre });
  } catch (err) {
    return corsJson({ error: err.message }, 500);
  }
}
