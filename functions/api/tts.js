// ============================================================
// functions/api/tts.js
// URL: POST /api/tts
// Body: { text, engine: 'gemini'|'edge', voice, geminiVoice, rate, pitch, volume }
//
// Hugging Face Gradio Space (ezensait/mng) -тэй ЗӨВ Gradio HTTP API
// замаар холбогддог: /gradio_api/call/<endpoint>
// ============================================================
import { corsJson, corsOptions } from '../_shared/ai.js';

const HF_SPACE = 'ezensait-mng.hf.space';
const ENDPOINT_NAME = 'generate_audio';

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
    const engineLabel = isGemini ? 'Gemini TTS (Байгалийн)' : 'Edge TTS (Батаа / Есүй)';
    const voiceSelect = voice || 'Батаа (эрэгтэй)';
    const voiceGemini = geminiVoice || 'Лхагваа (эрэгтэй)';

    // app.py-ийн generate_audio(text, engine_select, voice_select, voice_gemini, rate, pitch, volume)
    // дараалалтай яг тэнцуу байх ёстой
    const payload = {
      data: [
        text,
        engineLabel,
        voiceSelect,
        voiceGemini,
        rate ?? 0,
        pitch ?? 0,
        volume ?? 0
      ]
    };

    // 1-р алхам: ажил эхлүүлэх хүсэлт явуулна
    const startRes = await fetch(`https://${HF_SPACE}/gradio_api/call/${ENDPOINT_NAME}`, {
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

    // 2-р алхам: үр дүнг хүлээж авна (SSE урсгал)
    const resultRes = await fetch(`https://${HF_SPACE}/gradio_api/call/${ENDPOINT_NAME}/${event_id}`);
    const resultText = await resultRes.text();

    const dataLine = resultText
      .split('\n')
      .find(line => line.startsWith('data:'));

    if (!dataLine) throw new Error('HF Space-ээс үр дүн ирсэнгуй: ' + resultText.slice(0, 300));

    const resultData = JSON.parse(dataLine.replace('data:', '').trim());
    const audioInfo = resultData[0];

    let audioUrl = null;
    if (typeof audioInfo === 'string') {
      audioUrl = audioInfo;
    } else if (audioInfo?.url) {
      audioUrl = audioInfo.url;
    } else if (audioInfo?.path) {
      audioUrl = `https://${HF_SPACE}/file=` + audioInfo.path;
    }

    if (!audioUrl) throw new Error('Дуу URL олдсонгуй: ' + JSON.stringify(resultData).slice(0, 300));

    return corsJson({ audioUrl });
  } catch (err) {
    return corsJson({ error: err.message }, 500);
  }
}
