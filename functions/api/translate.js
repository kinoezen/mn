// ============================================================
// functions/api/translate.js
// URL: POST /api/translate
// Body: { text: string, from: string, to: string }
//
// ЗАСВАР: LLM (Gemini/Groq) ашигладаг байсан хуучин хувилбарыг
// Google Cloud Translation API-аар СОЛЬСОН. Учир нь:
// - LLM нь орчуулгад зориулагдаагүй тул hallucination (зохиомол
//   үг, утгагуй гаралт) гаргадаг байсан
// - Google Translation API бол тусгайлан орчуулгад зориулсан
//   модель, чанар тогтвортой, хурдан, өргөн хэмжээний
//   хэрэглээнд тохиромжтой (сард 500,000 тэмдэгт хүртэл үнэгүй)
//
// ШААРДЛАГА: Cloudflare Environment Variables дотор
// GOOGLE_TRANSLATE_API_KEY-г заавал тохируулсан байх ёстой.
// ============================================================
import { corsJson, corsOptions } from '../_shared/ai.js';

export async function onRequestOptions() {
  return corsOptions();
}

export async function onRequestPost({ request, env }) {
  try {
    if (!env.GOOGLE_TRANSLATE_API_KEY) {
      return corsJson({ error: 'Серверийн тохиргоо дутуу (GOOGLE_TRANSLATE_API_KEY алга)' }, 500);
    }

    const { text, from, to } = await request.json();
    if (!text || !text.trim()) {
      return corsJson({ error: 'Текст хоосон байна' }, 400);
    }

    if (text.length > 10000) {
      return corsJson({ error: 'Текст 10,000 тэмдэгтээс ихгуй байх ёстой' }, 400);
    }

    const url = `https://translation.googleapis.com/language/translate/v2?key=${env.GOOGLE_TRANSLATE_API_KEY}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        q: text.trim(),
        source: from,
        target: to,
        format: 'text'
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Google Translate API error (${response.status}): ${errText}`);
    }

    const data = await response.json();
    const translatedText = data?.data?.translations?.[0]?.translatedText;

    if (!translatedText) {
      throw new Error('Орчуулга ирсэн ч текст олдсонгуй');
    }

    // Google Translate заримдаа HTML entity буцаадаг (жишээ: &#39; → ')
    const decoded = decodeHtmlEntities(translatedText);

    return corsJson({ translatedText: decoded });
  } catch (err) {
    return corsJson({ error: err.message }, 500);
  }
}

function decodeHtmlEntities(text) {
  return text
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'");
}
