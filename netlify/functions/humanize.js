exports.handler = async function(event) {
  if(event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method Not Allowed' };
  
  const { text } = JSON.parse(event.body);
  const HF_URL = "https://kinosait-mongol.hf.space";

  try {
    const r1 = await fetch(`${HF_URL}/run/predict`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ data: [text], api_name: "/humanize_text" })
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
