// ============================================================
// functions/api/ai-detect.js
// URL: POST /api/ai-detect
// Body: { text: string }
//
// Энэ файл нь GitHub дээрх netlify/functions/ai-detect.js-ийн
// Cloudflare Pages хувилбар. Логик яг хэвээрээ, зөвхөн:
//   - exports.handler = async (event) => {...}
//     болсон
//   - onRequestPost({ request, env }) => {...}
//   - event.body -> await request.json()
//   - process.env.ANTHROPIC_API_KEY -> env.ANTHROPIC_API_KEY
//   - { statusCode, body } буцаах -> Response объект буцаах
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
    const { text } = await request.json();

    if (!text) {
      return new Response(JSON.stringify({ error: 'Текст оруулна уу' }), {
        status: 400,
        headers: corsHeaders
      });
    }

    if (!env.ANTHROPIC_API_KEY) {
      return new Response(JSON.stringify({ error: 'Серверийн тохиргоо дутуу (ANTHROPIC_API_KEY алга)' }), {
        status: 500,
        headers: corsHeaders
      });
    }

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5',
        max_tokens: 1024,
        messages: [{
          role: 'user',
          content: `Дараах монгол текстийг AI-р бичигдсэн эсэхийг шинжил. Үг сонголт, өгүүлбэрийн бүтэц, давталт, "хиймэл" хэллэг зэргийг харгал.

Текст: ${text}

Зөвхөн JSON форматаар хариул, нэмэлт тайлбар бичих хэрэггүй:
{"score": <0-100 тоо, AI-р бичигдсэн магадлал>, "verdict": "AI-р бичигдсэн / Хүн бичсэн", "reasons": ["шалтгаан 1", "шалтгаан 2"]}`
        }]
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Anthropic API error (${response.status}): ${errText}`);
    }

    const data = await response.json();
    const rawText = data.content[0].text;

    let result;
    try {
      const clean = rawText.replace(/```json|```/g, '').trim();
      result = JSON.parse(clean);
    } catch {
      result = { score: 50, verdict: 'Тодорхойгүй', reasons: [rawText] };
    }

    return new Response(JSON.stringify(result), {
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
