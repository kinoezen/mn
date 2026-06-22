export async function onRequestPost({ request, env }) {
  try {
    const { name, direction } = await request.json();
    if (!name) {
      return new Response(JSON.stringify({ error: "Нэр оруулна уу" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const apiKey = env.GEMINI_API_KEY;
    const dir = direction || "mn-to-en";

    const prompt =
      dir === "mn-to-en"
        ? `Дараах Монгол кирилл нэрийг латин үсгээр бич мөн Англи утгыг орчуул.\n\nНэр: ${name}\n\nЗөвхөн JSON форматаар хариул, өөр юм бичихгүй:\n{"transliteration": "латин үсгээр", "translation": "англи утга", "alternatives": ["өөр хувилбар"]}`
        : `Дараах латин/англи нэрийг ЗААВАЛ Монгол КИРИЛЛ үсгээр бич. Латин үсгээр бичихийг ХОРИГЛОНО.\n\nНэр: ${name}\n\nЗөвхөн JSON форматаар хариул, өөр юм бичихгүй:\n{"mongolian": "кирилл үсгээр бичсэн нэр", "alternatives": ["өөр кирилл хувилбар"]}`;

    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.3 },
        }),
      }
    );

    const data = await res.json();
    const raw = data.candidates?.[0]?.content?.parts?.[0]?.text || "{}";
    const clean = raw.replace(/```json|```/g, "").trim();

    let result;
    try {
      result = JSON.parse(clean);
    } catch {
      result = { result: clean };
    }

    return new Response(JSON.stringify(result), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
