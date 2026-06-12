const Anthropic = require('@anthropic-ai/sdk');

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  try {
    const { message, history } = JSON.parse(event.body);
    if (!message) return { statusCode: 400, body: JSON.stringify({ error: 'Мессеж оруулна уу' }) };

    const messages = [
      ...(history || []).slice(-10).map(h => ({ role: h.role, content: h.content })),
      { role: 'user', content: message }
    ];

    const response = await client.messages.create({
      model: 'claude-opus-4-5',
      max_tokens: 1024,
      system: `Чи КиноЭзэн платформын AI туслах. Монгол хэлээр хариулна. 
КиноЭзэн бол Монголын кино платформ бөгөөд дараах үйлчилгээнүүдтэй:
- Монгол TTS (дуу үүсгэгч)
- Humanizer (AI текст хүмүүнжүүлэгч)
- SRT орчуулагч
- Script бичигч
- Орчуулагч
- Дуу→Текст (STT)
- Текст засагч
- Кино тоймч
- Субтитр нийлүүлэгч
- Видео хуваагч
- Дүрийн нэр орчуулагч
- Пост үүсгэгч
- Thumbnail гарчиг
- Транскрипт засагч
- SEO гарчиг
- Plagiarism шалгагч
- PDF OCR
- AI илрүүлэгч

Кредит систем: Үнэгүй=100, Стандарт=1000, Про=5000 кредит/сар
Богино, тодорхой, найрсаг хариул. Emoji ашиглаж болно.`,
      messages
    });

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reply: response.content[0].text })
    };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};
