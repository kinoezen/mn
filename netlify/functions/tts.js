const { Client } = require("@gradio/client");

exports.handler = async function(event) {
  if(event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method Not Allowed' };

  const { text, voice } = JSON.parse(event.body);

  try {
    const client = await Client.connect("kinosait/mongol");
    const result = await client.predict("/generate_audio", {
      text: text,
      engine: "Edge TTS (Батаа / Есүй)",
      voice_edge: voice || "Батаа (эрэгтэй)",
      voice_gemini: "Charon",
      rate: 15,
      pitch: -8,
      volume: 0
    });

    // result.data[0] нь HTML string байна — audio src олно
    const htmlStr = result.data[0];
    let audioUrl = null;

    if(typeof htmlStr === 'string') {
      // <source src="..." байгаа эсэхийг шалгана
      const srcMatch = htmlStr.match(/src="([^"]+)"/);
      if(srcMatch) audioUrl = srcMatch[1];
      // data:audio/mpeg;base64 байгаа эсэхийг шалгана
      const b64Match = htmlStr.match(/(data:audio\/mpeg;base64,[^"]+)/);
      if(b64Match) audioUrl = b64Match[1];
    } else if(result.data[0] && result.data[0].url) {
      audioUrl = result.data[0].url;
    } else if(result.data[0] && result.data[0].path) {
      audioUrl = "https://kinosait-mongol.hf.space/file=" + result.data[0].path;
    }

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ audioUrl, debug: typeof htmlStr === 'string' ? htmlStr.slice(0, 300) : JSON.stringify(result.data[0]) })
    };
  } catch(e) {
    return { statusCode: 500, body: JSON.stringify({ error: e.message }) };
  }
};
