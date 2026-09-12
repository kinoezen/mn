// ============================================================
// functions/api/face-reading.js
// URL: POST /api/face-reading
// Body: { image_base64, mime_type }
//
// Gemini Vision ашиглаж зурган дээрх хүний "зан чанар, азын
// шинж"-ийг ЗУГАА ЦЭНГЭЭНИЙ зорилготой, ерөнхий шинжтэй
// тайлбарлана. Хэзээ ч арьс өнгө, угсаа гарал, бие бялдар,
// гоо сайхны үнэлгээ, эмнэлгийн шинжилгээ хэлэхгуй.
// ============================================================
import { callVisionAI, corsJson, corsOptions } from '../_shared/ai.js';

export async function onRequestOptions() {
  return corsOptions();
}

export async function onRequestPost({ request, env }) {
  try {
    const { image_base64, mime_type } = await request.json();

    if (!image_base64) {
      return corsJson({ error: 'Зураг оруулна уу' }, 400);
    }
    const mimeType = (mime_type && mime_type.startsWith('image/')) ? mime_type : 'image/jpeg';

    // base64 хэмжээ хэтэрхий их бол татгалзана (~6MB base64 ≈ 4.5MB зураг)
    if (image_base64.length > 6_000_000) {
      return corsJson({ error: 'Зураг хэт том байна. Жижиг зураг оруулна уу.' }, 400);
    }

    const systemPrompt = `Чи хөгжилтэй, эерэг "царай зурхайч". Энэ бол ЗУГАА ЦЭНГЭЭНИЙ зорилготой контент — жинхэнэ шинжлэх ухаан, физиогноми, эмнэлгийн дүгнэлт БИШ.

ХАТУУ, ЗӨРЧИЖ БОЛОХГҮЙ ДҮРЭМ:
1. Монгол хэлээр бич.
2. ХЭЗЭЭ Ч дараах зүйлийг бүу дурд, бүу тайлбарла: арьсны өнгө, угсаа гарал/яс үндэс, нас, хүйс дээр үндэслэсэн шинж, бие бялдрын үнэлгээ, гоо сайхны зэрэглэл (үзэсгэлэнтэй/муухай гэх мэт), эрүүл мэнд, өвчин, сэтгэл зүйн байдал.
3. Зөвхөн МАШ ЕРӨНХИЙ, эерэг зан чанарын шинж дээр анхаарлаа хандуул: инээмсэглэл, нүдний харц (жишээ: "тод, амьдралч харц"), ерөнхий "энерги" — эдгээрийг ЗӨВХӨН эерэг, урам зоригтой шинжээр тайлбарла.
4. Хариултаа доорх форматаар, 2 хэсэгт хуваа, хооронд нь "###DETAIL###" тусгаарлагч тавь:
   [TEASER]: 1-2 өгүүлбэрийн богино, сониуч зан татсан эхлэл.
   ###DETAIL###
   [DETAIL]: 4-5 өгүүлбэрийн дэлгэрэнгүй, зөвхөн эерэг зан чанар, "азын" шинж, урамтай зөвлөгөө.
5. Хэрэв зурган дээр хүний царай тодорхой харагдахгуй бол, эсвэл зураг тохирохгуй бол: TEASER хэсэгт "Зургийг тодорхой харахгуй байна, өөр зураг оруулж үзээрэй 😊" гэж бич, DETAIL хэсгийг хоосон орхи.
6. Дулаан, найрсаг, "чи" гэж хандаж бич.`;

    const userText = `Энэ зурган дээрх хүний хувьд, дээрх дүрмийн дагуу зугаа цэнгээний "царай зурхай" бич.`;

    const { text } = await callVisionAI(env, systemPrompt, userText, image_base64, mimeType, {
      temperature: 0.85,
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
