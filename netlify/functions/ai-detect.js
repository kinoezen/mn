const Anthropic = require('@anthropic-ai/sdk');

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  try {
    const { text } = JSON.parse(event.body);
    if (!text) return { statusCode: 400, body: JSON.stringify({ error: 'Текст оруулна уу' }) };

    const message = await client.messages.create({
      model: 'claude-opus-4-5',
      max_tokens: 1024,
      messages: [{
        role: 'user',
        content: `Дараах монгол текстийг AI-р бичигдсэн эсэхийг шинжил.
Шинжлэх шалгуурууд:
- Хэт тогтмол өгүүлбэр бүтэц
- Байгалийн бус хэллэг
- Хэт "цэвэр" зохион байгуулалт
- Хувийн туршлага, сэтгэл хөдлөлийн хомс байдал
- Давтагдах загвар

Текст: ${text}

Зөвхөн JSON форматаар хариул:
{
  "aiScore": <0-100, AI магадлалын хувь>,
  "details": "дэлгэрэнгүй тайлбар монголоор"
}`
      }]
    });

    let result;
    try {
      const clean = message.content[0].text.replace(/```json|```/g, '').trim();
      result = JSON.parse(clean);
    } catch {
      result = { aiScore: 0, details: message.content[0].text };
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
