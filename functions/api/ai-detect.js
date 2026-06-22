// ============================================================
// functions/api/ai-detect.js
// URL: POST /api/ai-detect
// Body: { text: string }
//
// ҮНЭГҲ хувилбар — Anthropic Claude-ийн оронд GEMINI ашиглана.
// Gemini API нь чөлөөт (free) tier-тэй — billing АСААГҺ л бол.
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

    if (!env.GEMINI_API_KEY) {
      return new Response(JSON.stringify({ error: 'Серверийн тохиргоо дутуу (GEMINI_API_KEY алга)' }), {
        status: 500,
        headers: corsHeaders
      });
    }

    const prompt = `Дараах монгол текстийг AI-р бичигдсэн эсэхийг шинжил. Үг сонголт, өгүүлбэрийн бүтэц, давталт, "хиймэл" хэллэг зэргийг харгал.

Текст: ${text}

Зөвхөн JSON форматаар хариул, нэмэлт тайлбар бичих хэрэггүй:
{"score": <0-100 тоо, AI-р бичигдсэн магадлал>, "verdict": "AI-р бичигдсэн / Хүн бичсэн", "reasons": ["шалтгаан 1", "шалтгаан 2"]}`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${env.GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.3, maxOutputTokens: 1024 }
        })
      }
    );

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Gemini API error (${response.status}): ${errText}`);
    }

    const data = await response.json();
    const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';

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
