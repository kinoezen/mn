export async function onRequestPost({ request, env }) {
  try {
    const { transcript, language } = await request.json();
    if (!transcript) {
      return new Response(JSON.stringify({ error: "Транскрипт оруулна уу" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const apiKey = env.GEMINI_API_KEY;
    const lang = language || "mn"; // mn | en

    const prompt =
      lang === "mn"
        ? `Дараах Монгол хэлний автомат транскриптийг цэвэрлэж, засаж тохиол. Дуу таних алдаа, давтагдсан үг, утгагүй хэсгийг засна уу.

Транскрипт:
"""
${transcript}
"""

Зөвхөн JSON форматаар хариул:
{
  "cleaned": "цэвэрлэсэн бүрэн текст",
  "summary": "агуулгын товч тайлбар",
  "corrections": <засварын тоо>,
  "key_points": ["үндсэн санаа 1", "үндсэн санаа 2"]
}`
        : `Clean and fix the following auto-generated transcript. Fix recognition errors, remove filler words, and improve readability.

Transcript:
"""
${transcript}
"""

Reply in JSON only:
{
  "cleaned": "full cleaned text",
  "summary": "brief content summary",
  "corrections": <number of corrections>,
  "key_points": ["key point 1", "key point 2"]
}`;

    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.2 },
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
