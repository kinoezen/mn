const Anthropic = require('@anthropic-ai/sdk');

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  try {
    const { title, length } = JSON.parse(event.body);
    if (!title) return { statusCode: 400, body: JSON.stringify({ error: 'Кино нэр оруулна уу' }) };

    const lengthMap = { short: '150-200 үг', medium: '300-400 үг', long: '500-700 үг' };
    const wordCount = lengthMap[length] || '300-400 үг';

    const message = await client.messages.create({
      model: 'claude-opus-4-5',
      max_tokens: 1024,
      messages: [{
        role: 'user',
        content: `"${title}" киноны монгол тойм бич. Урт: ${wordCount}. 
        Дараах бүтцээр бич:
        - Товч танилцуулга
        - Үйл явдал (spoiler-гүй)
        - Найруулагч болон жүжигчид
        - Онцлог тал
        - Үнэлгээ (10-аас)
        Монгол хэлээр, уншихад сонирхолтой байдлаар бич.`
      }]
    });

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ review: message.content[0].text })
    };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};
