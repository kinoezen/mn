// ============================================================
// functions/api/chatbot.js
// URL: POST /api/chatbot
// Body: { message: string, history: [{role, content}, ...] }
//
// ҲНЭГҲ хувилбар — Anthropic Claude-ийн оронд GEMINI ашиглана.
// ============================================================

export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    }
  });
}

export async function onRequestPost({ request, env }) {
  const corsHeaders = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*'
  };

  try {
    const { message, history } = await request.json();

    if (!message) {
      return new Response(JSON.stringify({ error: 'Мессеж оруулна уу' }), {
        status: 400,
        headers: corsHeaders
      });
    }

    if (!env.GEMINI_API_KEY) {
      return new Response(JSON.stringify({ error: 'Серверийн тохиргоо дутуу (GEMINI_API_KEY алга)' }), {
        status: 500,
        headers: corsHeaders
      });
    }

    const systemPrompt = `Чи КиноЭзэн платформын AI туслах. Монгол хэлээр хариулна.
КиноЭзэн бол Монголын кино платформ бөгөөд дараах үйлчилгээнүүдтэй:
- Монгол TTS (дуу үүсгэгч)
- Humanizer (AI текст хүмүүнжүүлэгч)
- SRT орчуулагч
- Script бичигч
- Орчуулагч
- Дуу→Текст (STT)
- Текст засагч
- Кино тоймч
- Субтитр нийлүүлэгч
- Видео хуваагч
- Дүрийн нэр орчуулагч
- Пост үүсгэгч
- Thumbnail гарчиг
- Транскрипт засагч
- SEO гарчиг
- Plagiarism шалгагч
- PDF OCR
- AI илрүүлэгч

Кредит систем: Үнэгүй=100, Стандарт=1000, Про=5000 кредит/сар
Богино, тодорхой, найрсаг хариул. Emoji ашиглаж болно.`;

    // Gemini-ийн "contents" массив руу history-г хөрвүүлнэ.
    // Gemini-ийн role нэрс: "user" болон "model" (Claude-ийн "assistant" биш).
    const contents = (history || []).slice(-10).map(h => ({
      role: h.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: h.content }]
    }));
    contents.push({ role: 'user', parts: [{ text: message }] });

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${env.GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents,
          systemInstruction: { parts: [{ text: systemPrompt }] },
          generationConfig: { temperature: 0.7, maxOutputTokens: 1024 }
        })
      }
    );

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Gemini API error (${response.status}): ${errText}`);
    }

    const data = await response.json();
    const reply = data?.candidates?.[0]?.content?.parts?.[0]?.text || 'Хариу олдсонгүй.';

    return new Response(JSON.stringify({ reply }), {
      status: 200,
      headers: corsHeaders
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: corsHeaders
    });
  }
}
