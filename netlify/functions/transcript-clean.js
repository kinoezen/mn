const Anthropic = require('@anthropic-ai/sdk');

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  try {
    const { text, cleanFillers, cleanRepeat, format } = JSON.parse(event.body);
    if (!text) return { statusCode: 400, body: JSON.stringify({ error: 'Текст оруулна уу' }) };

    const tasks = [];
    if (cleanFillers) tasks.push('"ааа", "ммм", "тэгээд", "тиймээ", "тэгж байгаад" зэрэг дүүргэгч үгсийг арил');
    if (cleanRepeat) tasks.push('давтагдсан үг, хэллэгийг арил');
    if (format) tasks.push('зөв өгүүлбэр болгож, цэг таслал тавь');

    if (!tasks.length) {
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cleaned: text })
      };
    }

    const message = await client.messages.create({
      model: 'claude-opus-4-5',
      max_tokens: 2048,
      messages: [{
        role: 'user',
        content: `Дараах монгол транскрипт текстийг цэвэрлэ:
${tasks.map((t, i) => `${i + 1}. ${t}`).join('\n')}

Зөвхөн цэвэрлэсэн текстийг буц, тайлбар нэмж болохгүй.

Транскрипт:
${text}`
      }]
    });

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cleaned: message.content[0].text })
    };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};
