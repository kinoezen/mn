// ⚠️ Энэ функц FFmpeg шаардана — Netlify-д ажиллахгүй.
// Зөвлөмж: Railway / Render / VPS дээр тусдаа backend үүсгэх.

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      error: null,
      parts: [],
      message: 'Видео хуваах үйлчилгээ тун удахгүй ажиллана. FFmpeg-тэй backend шаардана.'
    })
  };
};
