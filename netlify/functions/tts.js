const { Client } = require("@gradio/client");

// Монгол нэр → Gemini voice нэр
const VOICE_MAP = {
  'Дорж': 'Charon',
  'Батаа': 'Fenrir',
  'Баяраа': 'Puck',
  'Лхагваа': 'Orbit',
  'Дулмаа': 'Aoede',
  'Номин': 'Schedar'
};

exports.handler = async function(event) {
  if(event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method Not Allowed' };

  const { text, engine, voice, geminiVoice, rate, pitch, volume } = JSON.parse(event.body);
  const isGemini = engine === 'gemini';

  // Монгол нэрийг HF нэр рүү хөрвүүлэх
  const hfGeminiVoice = VOICE_MAP[geminiVoice] || geminiVoice || 'Charon';

  try {
    const client = await Client.connect("kinosait/mongol");

    const result = await client.predict("/generate_audio", {
      text: text,
      engine: isGemini ? "Gemini TTS (хамгийн байгалийн)" : "Edge TTS (Батаа / Есүй)",
      voice_edge: voice || "Батаа (эрэгтэй)",
      voice_gemini: hfGeminiVoice,
      rate: rate ?? 15,
      pitch: pitch ?? -8,
      volume: volume ?? 0
    });

    const htmlStr = result.data[0];
    let audioUrl = null;
    if(typeof htmlStr === 'string') {
      const srcMatch = htmlStr.match(/src="([^"]+)"/);
      if(srcMatch) audioUrl = srcMatch[1];
      const b64Match = htmlStr.match(/(data:audio\/mpeg;base64,[^"]+)/);
      if(b64Match) audioUrl = b64Match[1];
    } else if(result.data[0]?.url) {
      audioUrl = result.data[0].url;
    } else if(result.data[0]?.path) {
      audioUrl = "https://kinosait-mongol.hf.space/file=" + result.data[0].path;
    }

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ audioUrl, debug: typeof htmlStr==='string' ? htmlStr.slice(0,300) : JSON.stringify(result.data[0]) })
    };
  } catch(e) {
    return { statusCode: 500, body: JSON.stringify({ error: e.message }) };
  }
};
