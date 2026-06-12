const Anthropic = require('@anthropic-ai/sdk');

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  try {
    const { content, platform, tone } = JSON.parse(event.body);
    if (!content) return { statusCode: 400, body: JSON.stringify({ error: 'Агуулга оруулна уу' }) };

    const toneMap = { fun: 'хөгжилтэй, emoji ихтэй', pro: 'мэргэжлийн, ноцтой', info: 'мэдээлэл өгөх, тодорхой' };
    const toneText = toneMap[tone] || 'хөгжилтэй';

    const needFB = platform === 'facebook' || platform === 'both';
    const needIG = platform === 'instagram' || platform === 'both';

    const prompt = `Дараах агуулгаас ${toneText} өнгө аястай монгол пост үүсгэ.
Агуулга: ${content}

${needFB ? 'Facebook пост үүсгэ (300-500 тэмдэгт, hashtag-тэй):' : ''}
${needIG ? 'Instagram пост үүсгэ (150-300 тэмдэгт, hashtag ихтэй):' : ''}

Зөвхөн JSON форматаар хариул:
{"facebook": "...", "instagram": "..."}
Хэрэгцээгүй талбарыг хоосон string болго.`;

    const message = await client.messages.create({
      model: 'claude-opus-4-5',
      max_tokens: 1024,
      messages: [{ role: 'user', content: prompt }]
    });

    let result;
    try {
      const clean = message.content[0].text.replace(/```json|```/g, '').trim();
      result = JSON.parse(clean);
    } catch {
      result = { facebook: message.content[0].text, instagram: '' };
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
