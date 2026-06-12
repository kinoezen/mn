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
        content: `Дараах монгол текстийг plagiarism буюу давхардал шалгах шинжилгээ хий.
Текстийн хэв маяг, бүтэц, өгүүлбэр байгуулалтыг шинжлэн давхардлын магадлалыг тодорхойл.

Текст: ${text}

Зөвхөн JSON форматаар хариул:
{
  "score": <0-100 тоо, давхардлын хувь>,
  "matches": ["таарсан хэсэг эсвэл шалтгаан 1", "шалтгаан 2"],
  "summary": "товч дүгнэлт"
}`
      }]
    });

    let result;
    try {
      const clean = message.content[0].text.replace(/```json|```/g, '').trim();
      result = JSON.parse(clean);
    } catch {
      result = { score: 0, matches: [], summary: message.content[0].text };
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
