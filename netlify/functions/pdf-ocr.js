// ⚠️ Энэ функц Tesseract OCR шаардана.
// Netlify-д ажиллахгүй — тусдаа backend шаардана.
// Одоохондоо placeholder хариулт буцаана.

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      error: null,
      text: '',
      pages: 0,
      message: 'PDF OCR үйлчилгээ тун удахгүй ажиллана. Tesseract-тэй backend шаардана.'
    })
  };
};
