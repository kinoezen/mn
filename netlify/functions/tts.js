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
    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ data: result.data })
    };
  } catch(e) {
    return { statusCode: 500, body: JSON.stringify({ error: e.message }) };
  }
};
