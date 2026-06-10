exports.handler = async function(event) {
  if(event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method Not Allowed' };
  
  const { text, voice } = JSON.parse(event.body);
  const HF_URL = "https://kinosait-mongol.hf.space";

  try {
    // HuggingFace API дуудах
    const r1 = await fetch(`${HF_URL}/run/predict`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        data: [text, "Edge TTS (Батаа / Есүй)", voice, "Charon", 15, -8, 0],
        api_name: "/generate_audio"
      })
    });
    const j = await r1.json();
    if(j.error) return { statusCode: 500, body: JSON.stringify({ error: j.error }) };
    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ data: j.data })
    };
  } catch(e) {
    return { statusCode: 500, body: JSON.stringify({ error: e.message }) };
  }
};
