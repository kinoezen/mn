exports.handler = async function(event) {
  if(event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method Not Allowed' };

  const { text } = JSON.parse(event.body);
  const HF = "https://kinosait-mongol.hf.space";
  const hash = Math.random().toString(36).slice(2);

  const r1 = await fetch(`${HF}/queue/join`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ data: [text], fn_index: 2, session_hash: hash })
  });
  if(!r1.ok) return { statusCode: 500, body: JSON.stringify({ error: "queue/join алдаа: " + r1.status }) };

  const r2 = await fetch(`${HF}/queue/data?session_hash=${hash}`);
  const reader = r2.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let result = null;

  while(true) {
    const { done, value } = await reader.read();
    if(done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop();
    for(const line of lines) {
      if(line.startsWith("data:")) {
        try {
          const msg = JSON.parse(line.slice(5).trim());
          if(msg.msg === "process_completed") { result = msg.output.data; break; }
        } catch(e) {}
      }
    }
    if(result) break;
  }

  if(!result) return { statusCode: 500, body: JSON.stringify({ error: "Хариу ирсэнгүй" }) };

  return {
    statusCode: 200,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ data: result })
  };
};
