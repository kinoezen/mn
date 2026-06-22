// ============================================================
// functions/_shared/ai.js
// ============================================================
// Бүх AI үйлчилгээний хэрэглэдэг НИЙТЛЭГ дуудлага.
// Зарчим: ЭХЛЭЭД Gemini-ээр оролдоно. Gemini амжилтгүй бол
// (жишээ нь "User location is not supported" алдаа), АВТОМАТААР
// Groq руу шилжиж дахин оролдоно. Хэрэглэгч ямар ч алдаа мэдрэхгүй.
//
// Ашиглах жишээ (бусад /api/*.js файлд):
//   import { callAI } from '../_shared/ai.js';
//   const text = await callAI(env, "Чи орчуулагч...", "Сайн байна уу");
// ============================================================

/**
 * Gemini-г оролдоно, амжилтгүй бол Groq руу шилжинэ.
 * @param {object} env - Cloudflare env объект (GEMINI_API_KEY, GROQ_API_KEY агуулсан)
 * @param {string} systemPrompt - AI-д өгөх үүрэг/заавар
 * @param {string} userText - хэрэглэгчийн текст
 * @param {object} options - { temperature, maxOutputTokens }
 * @returns {Promise<{text: string, provider: 'gemini'|'groq'}>}
 */
export async function callAI(env, systemPrompt, userText, options = {}) {
  const temperature = options.temperature ?? 0.7;
  const maxTokens = options.maxOutputTokens ?? 1024;

  // 1-р оролдлого: Gemini
  if (env.GEMINI_API_KEY) {
    try {
      const text = await callGemini(env.GEMINI_API_KEY, systemPrompt, userText, temperature, maxTokens);
      return { text, provider: 'gemini' };
    } catch (err) {
      console.error('Gemini амжилтгүй, Groq руу шилжинэ:', err.message);
      // Gemini алдаатай бол доош үргэлжилнэ — Groq-ийг оролдоно
    }
  }

  // 2-р оролдлого: Groq (fallback)
  if (env.GROQ_API_KEY) {
    const text = await callGroq(env.GROQ_API_KEY, systemPrompt, userText, temperature, maxTokens);
    return { text, provider: 'groq' };
  }

  throw new Error('Ямар нэг AI key тохируулагдаагүй байна (GEMINI_API_KEY, GROQ_API_KEY хоёул алга)');
}

async function callGemini(apiKey, systemPrompt, userText, temperature, maxTokens) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ role: 'user', parts: [{ text: userText }] }],
      systemInstruction: { parts: [{ text: systemPrompt }] },
      generationConfig: { temperature, maxOutputTokens: maxTokens }
    })
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Gemini API error (${response.status}): ${errText}`);
  }

  const data = await response.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error('Gemini-ээс хариу ирсэн ч текст олдсонгүй');
  return text.trim();
}

async function callGroq(apiKey, systemPrompt, userText, temperature, maxTokens) {
  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userText }
      ],
      temperature,
      max_tokens: maxTokens
    })
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Groq API error (${response.status}): ${errText}`);
  }

  const data = await response.json();
  const text = data?.choices?.[0]?.message?.content;
  if (!text) throw new Error('Groq-ээс хариу ирсэн ч текст олдсонгүй');
  return text.trim();
}

/** Бүх /api/*.js файлд адил CORS header нэмэхэд хэрэглэгдэнэ. */
export function corsJson(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    }
  });
}

/** OPTIONS preflight хүсэлтэд зориулсан стандарт хариу. */
export function corsOptions() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    }
  });
}
