// ============================================================
// functions/api/movie-review.js
// URL: POST /api/movie-review
// Body: { title: string, length: "short" | "medium" | "long" }
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
    const { title, length } = await request.json();

    if (!title) {
      return new Response(JSON.stringify({ error: 'Кино нэр оруулна уу' }), {
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

    const lengthMap = { short: '150-200 үг', medium: '300-400 үг', long: '500-700 үг' };
    const wordCount = lengthMap[length] || '300-400 үг';

    const prompt = `"${title}" киноны монгол тойм бич. Урт: ${wordCount}.
Дараах бүтцээр бич:
- Товч танилцуулга
- Үйл явдал (spoiler-гүй)
- Найруулагч болон жүжигчид
- Онцлог тал
- Үнэлгээ (10-аас)
Монгол хэлээр, уншихад сонирхолтой байдлаар бич.`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${env.GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.8, maxOutputTokens: 1500 }
        })
      }
    );

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Gemini API error (${response.status}): ${errText}`);
    }

    const data = await response.json();
    const review = data?.candidates?.[0]?.content?.parts?.[0]?.text || 'Тойм үүсгэхэд алдаа гарлаа.';

    return new Response(JSON.stringify({ review }), {
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
