import { Client } from "@gradio/client";

const VALID_VOICES = ['Charon','Fenrir','Puck','Orbit','Zephyr','Schedar','Aoede'];

export async function onRequestPost({ request }) {
  try {
    const { text, engine, voice, geminiVoice, rate, pitch, volume } = await request.json();

    const isGemini = engine === 'gemini';
    const cleanVoice = (geminiVoice || 'Charon').trim();
    const hfVoice = VALID_VOICES.includes(cleanVoice) ? cleanVoice : 'Charon';

    const client = await Client.connect("ezensait/mgl");
    const result = await client.predict("/generate_audio", {
      text: text,
      engine: isGemini ? "Gemini TTS (хамгийн байгалийн)" : "Edge TTS (Батаа / Есүй)",
      voice_edge: voice || "Батаа (эрэгтэй)",
      voice_gemini: hfVoice,
      rate: rate ?? 15,
      pitch: pitch ?? -8,
      volume: volume ?? 0
    });

    const htmlStr = result.data[0];
    let audioUrl = null;

    if (typeof htmlStr === 'string') {
      const srcMatch = htmlStr.match(/src="([^"]+)"/);
      if (srcMatch) audioUrl = srcMatch[1];
      const b64Match = htmlStr.match(/(data:audio\/mpeg;base64,[^"]+)/);
      if (b64Match) audioUrl = b64Match[1];
    } else if (result.data[0]?.url) {
      audioUrl = result.data[0].url;
    } else if (result.data[0]?.path) {
      audioUrl = "https://ezensait-mgl.hf.space/file=" + result.data[0].path;
    }

    return new Response(JSON.stringify({
      audioUrl,
      debug: typeof htmlStr === 'string' ? htmlStr.slice(0, 300) : JSON.stringify(result.data[0])
    }), {
      headers: { "Content-Type": "application/json" }
    });

  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}
