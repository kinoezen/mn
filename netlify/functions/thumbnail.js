const Anthropic = require('@anthropic-ai/sdk');

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  try {
    const { content, style } = JSON.parse(event.body);
    if (!content) return { statusCode: 400, body: JSON.stringify({ error: 'Агуулга оруулна уу' }) };

    const styleMap = {
      shock: 'сонирхол татах, гайхшруулах ("Хэн ч мэдэхгүй...", "Энэ бол...")',
      question: 'асуулт хэлбэртэй ("Яагаад..?", "Хэрхэн..?")',
      list: 'тоон жагсаалт ("5 шалтгаан...", "Топ 10...")'
    };
    const styleText = styleMap[style] || styleMap.shock;

    const message = await client.messages.create({
      model: 'claude-opus-4-5',
      max_tokens: 512,
      messages: [{
        role: 'user',
        content: `YouTube thumbnail-д зориулсан монгол гарчиг үүсгэ.
Агуулга: ${content}
Хэлбэр: ${styleText}
Шаардлага: богино (5-8 үг), анхаарал татах, том үсгээр бичиж болно.

5 өөр гарчиг үүсгэ. Зөвхөн JSON:
{"titles": ["...", "...", "...", "...", "..."]}`
      }]
    });

    let result;
    try {
      const clean = message.content[0].text.replace(/```json|```/g, '').trim();
      result = JSON.parse(clean);
    } catch {
      result = { titles: [message.content[0].text] };
    }

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(result)
    };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};
