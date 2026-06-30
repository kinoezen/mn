// ============================================================
// functions/api/tts.js
// URL: POST /api/tts
// Body: { text, engine: 'gemini'|'edge', voice, geminiVoice, rate, pitch, volume }
//
// ЭНЭ ХУВИЛБАР: Hugging Face Space (Gradio) руу PROXY хийдэг.
// Таны HF Space (ezensait/mng) дотор edge-tts Python package
// АМЖИЛТТАЙ ажиллаж байгаа тул Cloudflare дотор дахин бичихийг
// ОРОЛДОХГуй, харин зӖвхӖн тэр API-г дуудаж, хариуг буцаана.
//
// PACKAGE ШААРДЛАГАГуй (зӖвхӖн native fetch), тиймээс
// Cloudflare Pages-ийн "No deployment available" build алдаа
// ГАРАХГуй.
//
// HF Space-ийн Gradio function: generate_audio
//   api_name="generate_audio" гэж app.py дотор заасан тул
//   Gradio автоматаар дараах endpoint үусгэдэг:
//   POST https://ezensait-mng.hf.space/gradio_api/call/generate_audio
//
// Gradio "call" API нь 2 алхамтай:
//   1) POST .../call/generate_audio  → { event_id } буцаана
//   2) GET  .../call/generate_audio/{event_id} → SSE урсгалаар
//      үр дунг буцаана (текст урсгал, "data: [...]" мор)
// ============================================================
import { corsJson, corsOptions } from '../_shared/ai.js';

const HF_SPACE_BASE = 'https://ezensait-mng.hf.space';
const HF_CALL_URL = `${HF_SPACE_BASE}/gradio_api/call/generate_audio`;

const GEMINI_VOICE_MAP_KEYS = [
  'Лхагваа (эрэгтэй)', 'Доржоо (эрэгтэй)', 'Батбаяр (эрэгтэй)',
  'Мөнхбат (эрэгтэй)', 'Энхбаяр (эрэгтэй)', 'Ганбаатар (эрэгтэй)',
  'Дулмаа (эмэгтэй)', 'Номин (эмэгтэй)', 'Нарантуяа (эмэгтэй)'
];

const EDGE_VOICE_DISPLAY = {
  'Батаа': 'Батаа (эрэгтэй)',
  'Батаа (эрэгтэй)': 'Батаа (эрэгтэй)',
  'Есуй': 'Есүй (эмэгтэй)',
  'Есуй (эмэгтэй)': 'Есүй (эмэгтэй)',
  'Есүй': 'Есүй (эмэгтэй)',
  'Есүй (эмэгтэй)': 'Есүй (эмэгтэй)'
};

// ӖМНӖ: yг таг тааруулга (===) ашигладаг байсан тул frontend-ээс
// emoji/зай нэмэгдсэн товч текст ирвэл (жишээ: "🎙️ Есуй") тааруулга
// амжилтгуй болж, бугд "Батаа"-д унадаг байсан. Одоо ИЛуу НАЙДВАРТАЙ
// includes()-ор шалгана.
function resolveEdgeVoiceLabel(rawVoice) {
  const v = (rawVoice || '').trim();
  if (v.includes('Есуй') || v.includes('Есүй')) return 'Есүй (эмэгтэй)';
  if (v.includes('Батаа')) return 'Батаа (эрэгтэй)';
  if (EDGE_VOICE_DISPLAY[v]) return EDGE_VOICE_DISPLAY[v];
  return 'Батаа (эрэгтэй)';
}

export async function onRequestOptions() {
  return corsOptions();
}

export async function onRequestPost({ request }) {
  try {
    const { text, engine, voice, geminiVoice, rate, pitch, volume } = await request.json();

    if (!text || !text.trim()) {
      return corsJson({ error: 'Текст оруулна уу' }, 400);
    }

    const limit = engine === 'gemini' ? 500 : 5000;
    if (text.length > limit) {
      return corsJson({ error: `Текст ${limit} тэмдэгтээс ихгуй байх ёстой` }, 400);
    }

    // app.py-ийн Gradio Radio утгууд яг ингэж бичигдсэн байх ёстой
    const engineLabel = engine === 'gemini'
      ? 'Gemini TTS (Байгалийн)'
      : 'Edge TTS (Батаа / Есүй)';

    const edgeVoiceLabel = resolveEdgeVoiceLabel(voice);
    const geminiVoiceLabel = GEMINI_VOICE_MAP_KEYS.includes(geminiVoice)
      ? geminiVoice
      : 'Лхагваа (эрэгтэй)';

    // Gradio "generate_audio" функцийн inputs дараалал app.py-тай яг
    // ИЖИЛ байх ёстой:
    // [text, engine_select, voice_select, voice_gemini, rate, pitch, volume]
    const gradioInputs = [
      text,
      engineLabel,
      edgeVoiceLabel,
      geminiVoiceLabel,
      Number(rate ?? 0),
      Number(pitch ?? 0),
      Number(volume ?? 0)
    ];

    const audioUrl = await callGradioAPI(gradioInputs);

    return corsJson({ audioUrl });
  } catch (err) {
    console.error('TTS proxy алдаа:', err);
    const message = (err && err.message) ? err.message : 'TTS-д тодорхойгуй алдаа гарлаа';
    return corsJson({ error: message }, 500);
  }
}

// ============================================================
// Gradio "call" API-г дуудах — 2 алхамт (POST → event_id, дараа нь
// GET-ээр SSE урсгал уншиж үр дунг авна)
// ============================================================
async function callGradioAPI(inputsArray) {
  // 1-р алхам: хүсэлт илгээж event_id авна
  const postRes = await fetch(HF_CALL_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ data: inputsArray })
  });

  if (!postRes.ok) {
    const errText = await postRes.text().catch(() => '');
    throw new Error(`HF Space холбогдоход алдаа гарлаа (${postRes.status}): ${errText.slice(0, 200)}`);
  }

  const postData = await postRes.json();
  const eventId = postData.event_id;
  if (!eventId) {
    throw new Error('HF Space-ээс event_id ирсэнгуй: ' + JSON.stringify(postData).slice(0, 200));
  }

  // 2-р алхам: SSE урсгалаар үр дунг авна
  const getUrl = `${HF_CALL_URL}/${eventId}`;
  const getRes = await fetch(getUrl, {
    method: 'GET',
    headers: { 'Accept': 'text/event-stream' }
  });

  if (!getRes.ok) {
    const errText = await getRes.text().catch(() => '');
    throw new Error(`HF Space-ийн уйлдвэрлэлийг авахад алдаа (${getRes.status}): ${errText.slice(0, 200)}`);
  }

  const rawText = await getRes.text();

  // SSE формат: "event: complete\ndata: [...]\n\n" эсвэл
  // олон event мор зэрэгцсэн байж болно ("event: generating" гэх мэт).
  // "event: complete" мор хайж, дараагийн "data:" мрийг задална.
  const lines = rawText.split('\n');
  let eventType = null;
  let dataLine = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.startsWith('event:')) {
      eventType = line.slice(6).trim();
    } else if (line.startsWith('data:')) {
      if (eventType === 'complete' || eventType === 'error' || !dataLine) {
        dataLine = line.slice(5).trim();
      }
      if (eventType === 'complete') break;
    }
  }

  if (!dataLine) {
    throw new Error('HF Space-ээс хариу задлахад алдаа гарлаа (data мор олдсонгуй)');
  }

  let parsed;
  try {
    parsed = JSON.parse(dataLine);
  } catch (e) {
    throw new Error('HF Space-ийн хариу JSON биш байна: ' + dataLine.slice(0, 200));
  }

  if (eventType === 'error') {
    const errMsg = Array.isArray(parsed) ? parsed.join(', ') : JSON.stringify(parsed);
    throw new Error('HF Space-ээс алдаа ирлээ: ' + errMsg.slice(0, 300));
  }

  // gr.Audio() output нь ихэвчлэн ингэж буцдаг:
  // [{ path, url, ... }] эсвэл [{ name, data (base64 эсвэл url), ... }]
  const audioItem = Array.isArray(parsed) ? parsed[0] : parsed;

  if (!audioItem) {
    throw new Error('HF Space-ээс аудио үр дун ирсэнгуй');
  }

  // Хэрэв шууд URL ирвэл (ихэнхдээ ингэж ирдэг — Gradio file serving)
  if (audioItem.url) {
    return await fetchAndConvertToDataUrl(audioItem.url);
  }
  if (typeof audioItem === 'string' && audioItem.startsWith('http')) {
    return await fetchAndConvertToDataUrl(audioItem);
  }
  // Хэрэв path ирвэл (HF Space-ийн дотоод зам) — бугд URL болгож хувиргана
  if (audioItem.path) {
    const fileUrl = `${HF_SPACE_BASE}/gradio_api/file=${audioItem.path}`;
    return await fetchAndConvertToDataUrl(fileUrl);
  }
  // Хэрэв шууд base64 ирвэл
  if (audioItem.data) {
    return audioItem.data.startsWith('data:') ? audioItem.data : `data:audio/mpeg;base64,${audioItem.data}`;
  }

  throw new Error('HF Space-ийн аудио хариуны бутэц танигдсангуй: ' + JSON.stringify(audioItem).slice(0, 200));
}

// HF Space-аас аудио файлыг татаж, base64 data URL болгож хувиргана
// (Frontend нь data: URL-ийг шууд <audio> tag-д ашигладаг тул)
async function fetchAndConvertToDataUrl(fileUrl) {
  const res = await fetch(fileUrl);
  if (!res.ok) {
    throw new Error(`Аудио файл татахад алдаа гарлаа (${res.status}): ${fileUrl}`);
  }
  const contentType = res.headers.get('content-type') || 'audio/mpeg';
  const buffer = await res.arrayBuffer();

  if (!buffer || buffer.byteLength === 0) {
    throw new Error('Татсан аудио файл хоосон байна (0 byte)');
  }

  const base64 = arrayBufferToBase64(buffer);
  return `data:${contentType};base64,${base64}`;
}

function arrayBufferToBase64(buffer) {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  const chunkSize = 8192;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode.apply(null, bytes.subarray(i, i + chunkSize));
  }
  return btoa(binary);
}
