// ============================================================
// functions/api/tts.js
// URL: POST /api/tts
// Body: { text, engine: 'gemini'|'edge', voice, geminiVoice, rate, pitch, volume }
//
// Hugging Face Gradio Space (Kinoezen/mn) -тэй ЗӨВ Gradio HTTP API
// замаар холбогддог: /gradio_api/call/<endpoint>
// ============================================================
import { corsJson, corsOptions } from '../_shared/ai.js';

const HF_SPACE = 'kinoezen-mn.hf.space';
const VALID_VOICES = ['Charon', 'Fenrir', 'Puck', 'Orbit', 'Zephyr', 'Schedar', 'Aoede'];

// Engine тус бүрийн тэмдэгтийн хязгаар (HF Space-ийн UI-д харагдсан)
const CHAR_LIMITS = { edge: 2000, gemini: 1000 };

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
    const limit = isGemini ? CHAR_LIMITS.gemini : CHAR_LIMITS.edge;
    if (text.length > limit) {
      return corsJson({ error: `Текст хэт урт байна (${limit} тэмдэгтээс ихгүй байх ёстой)` }, 400);
    }

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

    // 1-р алхам: ажил эхлүүлэх хүсэлт явуулна (ЗӨВ зам: /gradio_api/call/)
    const startRes = await fetch(`https://${HF_SPACE}/gradio_api/call/generate_audio`, {
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

    // 2-р алхам: үр дүнг хүлээж авна (SSE урсгал, ЗӨВ зам)
    const resultRes = await fetch(`https://${HF_SPACE}/gradio_api/call/generate_audio/${event_id}`);
    const resultText = await resultRes.text();

    const dataLine = resultText
      .split('\n')
      .find(line => line.startsWith('data:'));

    if (!dataLine) throw new Error('HF Space-ээс үр дүн ирсэнгүй: ' + resultText.slice(0, 200));

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

    if (!audioUrl) throw new Error('Дуу URL олдсонгүй: ' + JSON.stringify(resultData).slice(0, 200));

    return corsJson({ audioUrl });
  } catch (err) {
    return corsJson({ error: err.message }, 500);
  }
}
