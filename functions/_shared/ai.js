// ============================================================
// functions/_shared/ai.js
// ============================================================
// Бугд AI уйлчилгээний хэрэглэдэг НИЙТЛЭГ дуудлага.
//
// ЗАРЧИМ: Groq дотор ХЭДЭН ӖӖР model ашигладаг, учир нь
// Groq-ийн хязгаар нь "account-ийн нийт хязгаар" БИШ, харин
// "model тус бугд тусдаа хязгаар" гэдгийг 2026 оны албан ёсны
// баримт бичигт батлагдсан. Тэгэхээр 1 model дуусахад (429
// алдаа) дараагийн model руу автоматаар шилждэг.
//
// Model-ийн ӖДРИЙН хязгаарууд (2026 баталгаажуулсан):
//   llama-3.1-8b-instant:      14,400/ӖДӖР  (хамгийн ӖГӖӖМӖР)
//   llama-3.3-70b-versatile:    1,000/ӖДӖР
//   gemma2-9b-it:               1,000/ӖДӖР
// Нийт боломжит: ~16,400+ хусэлт/ӖДӖР (зӖвхӖн Groq дотор)
//
// Хэрэв БУГД Groq model дуусвал, Gemini fallback болж орлоно.
//
// Ашиглах жишээ (бусад /api/*.js файлд):
//   import { callAI } from '../_shared/ai.js';
//   const text = await callAI(env, "Чи орчуулагч...", "Сайн байна уу");
// ============================================================

// Дараалал: эхлээд хамгийн ӖГӖӖМӖР model, дараа нь бусад
const GROQ_MODELS = [
  'llama-3.1-8b-instant',     // 14,400/ӖДӖР — анхны (primary)
  'llama-3.3-70b-versatile',  // 1,000/ӖДӖР — 2-р оролдлого
  'gemma2-9b-it'              // 1,000/ӖДӖР — 3-р оролдлого
];

/**
 * Groq-ийн хэдэн model-ийг дараалуулан оролдоно, бугд амжилтгуй
 * бол Gemini руу шилжинэ.
 * @param {object} env - Cloudflare env объект (GROQ_API_KEY, GEMINI_API_KEY агуулсан)
 * @param {string} systemPrompt - AI-д ӖГӖХ ҲХРЭГ/заавар
 * @param {string} userText - хэрэглэгчийн текст
 * @param {object} options - { temperature, maxOutputTokens }
 * @returns {Promise<{text: string, provider: string}>}
 */
export async function callAI(env, systemPrompt, userText, options = {}) {
  const temperature = options.temperature ?? 0.7;
  const maxTokens = options.maxOutputTokens ?? 1024;

  // Groq-ийн model бугдийг дараалуулан оролдоно
  if (env.GROQ_API_KEY) {
    for (const model of GROQ_MODELS) {
      try {
        const text = await callGroq(env.GROQ_API_KEY, model, systemPrompt, userText, temperature, maxTokens);
        return { text, provider: `groq:${model}` };
      } catch (err) {
        console.error(`Groq (${model}) амжилтгуй:`, err.message);
        // Доош ургэлжилнэ — дараагийн model-ийг оролдоно
      }
    }
  }

  // Бугд Groq model амжилтгуй бол Gemini fallback
  if (env.GEMINI_API_KEY) {
    try {
      const text = await callGemini(env.GEMINI_API_KEY, systemPrompt, userText, temperature, maxTokens);
      return { text, provider: 'gemini' };
    } catch (err) {
      console.error('Gemini ч амжилтгуй:', err.message);
    }
  }

  throw new Error('Бугд AI provider амжилтгуй (Groq-ийн бугд model + Gemini)');
}

async function callGroq(apiKey, model, systemPrompt, userText, temperature, maxTokens) {
  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model,
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
    throw new Error(`Groq API error (${response.status}) [${model}]: ${errText}`);
  }

  const data = await response.json();
  const text = data?.choices?.[0]?.message?.content;
  if (!text) throw new Error(`Groq (${model})-ээс хариу ирсэн ч текст олдсонгуй`);
  return text.trim();
}

async function callGemini(apiKey, systemPrompt, userText, temperature, maxTokens) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ role: 'user', parts: [{ text: userText }] }],
      systemInstruction: { parts: [{ text: systemPrompt }] },
      generationConfig: {
        temperature,
        maxOutputTokens: maxTokens,
        thinkingConfig: { thinkingBudget: 0 }
      }
    })
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Gemini API error (${response.status}): ${errText}`);
  }

  const data = await response.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error('Gemini-ээс хариу ирсэн ч текст олдсонгуй');
  return text.trim();
}

/** Бугд /api/*.js файлд адил CORS header нэмэхэд хэрэглэгдэнэ. */
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

/** OPTIONS preflight хусэлтэд зориулсан стандарт хариу. */
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
