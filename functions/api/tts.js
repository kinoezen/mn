// ============================================================
// functions/api/tts.js
// URL: POST /api/tts
// Body: { text, engine, voice, geminiVoice, rate, pitch, volume }
//
// Энэ файл Hugging Face Gradio Space (kinosait/mongol) -тэй
// шууд HTTP fetch-ээр холбогддог (@gradio/client package
// Cloudflare Edge runtime дээр ажилладаггүй тул ашиглахгүй).
//
// Gradio-ийн HTTP API ажиллах зарчим:
//   1. POST /call/<endpoint> -> { event_id } буцаана
//   2. GET  /call/<endpoint>/<event_id> -> Server-Sent Events урсгал,
//      "event: complete" мөрийн дараах "data:" мөрөнд үр дүн ирнэ
// ============================================================
import { corsJson, corsOptions } from '../_shared/ai.js';

const HF_SPACE = 'kinoezen-mn.hf.space'; // Kinoezen/mn Space-ийн bodit domain
const VALID_VOICES = ['Charon', 'Fenrir', 'Puck', 'Orbit', 'Zephyr', 'Schedar', 'Aoede'];

export async function onRequestOptions() {
  return corsOptions();
}

export async function onRequestPost({ request }) {
  try {
    const { text, engine, voice, geminiVoice, rate, pitch, volume } = await request.json();

    if (!text || !text.trim()) {
      return corsJson({ error: 'Текст оруулна уу' }, 400);
    }

    const isGemini = engine === 'gemini';
    const cleanVoice = (geminiVoice || 'Charon').trim();
    const hfVoice = VALID_VOICES.includes(cleanVoice) ? cleanVoice : 'Charon';

    const payload = {
      data: [
        text,
        isGemini ? 'Gemini TTS (хамгийн байгалийн)' : 'Edge TTS (Батаа / Есүй)',
        voice || 'Батаа (эрэгтэй)',
        hfVoice,
        rate ?? 15,
        pitch ?? -8,
        volume ?? 0
      ]
    };

    // 1-р алхам: ажил эхлүүлэх хүсэлт явуулна
    const startRes = await fetch(`https://${HF_SPACE}/call/generate_audio`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!startRes.ok) {
      const errText = await startRes.text();
      throw new Error(`HF Space эхлэх алдаа (${startRes.status}): ${errText}`);
    }

    const { event_id } = await startRes.json();
    if (!event_id) throw new Error('HF Space event_id буцаасангуй');

    // 2-р алхам: үр дүнг тэвчээртэй хүлээж авна (SSE урсгал)
    const resultRes = await fetch(`https://${HF_SPACE}/call/generate_audio/${event_id}`);
    const resultText = await resultRes.text();

    // SSE формат: "event: complete\ndata: [...]\n\n" мөрүүдээс өгөгдлийг олно
    const dataLine = resultText
      .split('\n')
      .find(line => line.startsWith('data:'));

    if (!dataLine) throw new Error('HF Space-ээс үр дүн ирсэнгүй');

    const resultData = JSON.parse(dataLine.replace('data:', '').trim());
    const htmlStr = resultData[0];

    let audioUrl = null;
    if (typeof htmlStr === 'string') {
      const srcMatch = htmlStr.match(/src="([^"]+)"/);
      if (srcMatch) audioUrl = srcMatch[1];
      const b64Match = htmlStr.match(/(data:audio\/mpeg;base64,[^"]+)/);
      if (b64Match) audioUrl = b64Match[1];
    } else if (htmlStr?.url) {
      audioUrl = htmlStr.url;
    } else if (htmlStr?.path) {
      audioUrl = `https://${HF_SPACE}/file=` + htmlStr.path;
    }

    if (!audioUrl) throw new Error('Дуу URL олдсонгүй');

    return corsJson({ audioUrl });
  } catch (err) {
    return corsJson({ error: err.message }, 500);
  }
}
