const Anthropic = require('@anthropic-ai/sdk');

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  try {
    const { content, platform } = JSON.parse(event.body);
    if (!content) return { statusCode: 400, body: JSON.stringify({ error: 'Агуулга оруулна уу' }) };

    const platformMap = {
      web: 'вэб хуудас (Google SEO, 60 тэмдэгт хүртэл гарчиг, 160 тэмдэгт тайлбар)',
      youtube: 'YouTube видео (100 тэмдэгт гарчиг, 500 тэмдэгт тайлбар)',
      social: 'нийгмийн сүлжээ (60 тэмдэгт гарчиг, 150 тэмдэгт тайлбар)'
    };
    const platformText = platformMap[platform] || platformMap.web;

    const message = await client.messages.create({
      model: 'claude-opus-4-5',
      max_tokens: 1024,
      messages: [{
        role: 'user',
        content: `Дараах агуулгаас ${platformText}-д зориулсан SEO оновчлосон монгол гарчиг үүсгэ.

Агуулга: ${content}

Зөвхөн JSON форматаар хариул:
{"title": "...", "description": "...", "keywords": "үг1, үг2, үг3, үг4, үг5"}`
      }]
    });

    let result;
    try {
      const clean = message.content[0].text.replace(/```json|```/g, '').trim();
      result = JSON.parse(clean);
    } catch {
      result = { title: '', description: message.content[0].text, keywords: '' };
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
