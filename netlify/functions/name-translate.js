const Anthropic = require('@anthropic-ai/sdk');

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  try {
    const { names, fromLang } = JSON.parse(event.body);
    if (!names || !names.length) return { statusCode: 400, body: JSON.stringify({ error: 'Нэрс оруулна уу' }) };

    const langMap = { en: 'Англи', ru: 'Орос', zh: 'Хятад', ja: 'Япон', ko: 'Солонгос' };
    const langName = langMap[fromLang] || 'Англи';

    const message = await client.messages.create({
      model: 'claude-opus-4-5',
      max_tokens: 1024,
      messages: [{
        role: 'user',
        content: `Дараах ${langName} хэлний нэрсийг монгол дуудлагаар бич. 
        Зөвхөн JSON форматаар хариул, өөр текст нэмж болохгүй.
        Формат: {"results": [{"original": "...", "translated": "..."}, ...]}
        
        Нэрс:
        ${names.join('\n')}`
      }]
    });

    let results;
    try {
      const clean = message.content[0].text.replace(/```json|```/g, '').trim();
      results = JSON.parse(clean);
    } catch {
      results = { results: names.map(n => ({ original: n, translated: n })) };
    }

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(results)
    };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};
