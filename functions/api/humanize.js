// ============================================================
// functions/api/humanize.js
// URL: POST /api/humanize
// Body: { text: string }
//
// Энэ хувилбар @gradio/client-ийг ОРХИЖ, _shared/ai.js-ийн
// callAI()-г ашигладаг: ЭХЛЭЭД Gemini, амжилтгуй бол Groq.
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

    const systemPrompt = `Чи монгол хэлний редактор. AI-ээр орчуулсан эсвэл хатуу, "машин" мэт сонсогдох монгол текстийг байгалийн, амьд, хүний бичсэн мэт болгож хувиргана. Утга өөрчлөгдөхгуй, зөвхөн өгүүлбэрийн зохион байгуулалт, үг сонголтыг сайжруул. Зөвхөн хувиргасан текстийг буцаа, нэмэлт тайлбар бичих хэрэггуй.`;

    const { text: humanized } = await callAI(env, systemPrompt, text, {
      temperature: 0.7,
      maxOutputTokens: 2048
    });

    return corsJson({ original: text, humanized });
  } catch (err) {
    return corsJson({ error: err.message }, 500);
  }
}
