import { Client } from "@gradio/client";

export async function onRequestPost({ request }) {
  try {
    const { text } = await request.json();

    const client = await Client.connect("ezensait/mgl");
    const result = await client.predict("/humanize_text", {
      text: text
    });

    return new Response(JSON.stringify({ data: result.data }), {
      headers: { "Content-Type": "application/json" }
    });

  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}
