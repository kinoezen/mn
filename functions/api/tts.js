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

// ШИНЭ: "Дорж" (Байгалийн Монгол хоолой) — тусдаа GPU Space, удаан
// гэхдээ маш байгалийн жинхэнэ хоолойтой, тиймээс зорьж хязгаарласан
// (300 тэмдэгт хуртэл).
const NATURAL_SPACE_BASE = 'https://kinoezen-hooloi.hf.space';
const NATURAL_CALL_URL = `${NATURAL_SPACE_BASE}/gradio_api/call/generate_speech`;
const NATURAL_CHAR_LIMIT = 300;

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

    // ШИНЭ: "Дорж" (байгалийн, удаан) хоолой — тусдаа Space, өөр
    // дуудлагын логиктой (Gradio streaming, нэг хоолойтой)
    if (engine === 'natural') {
      if (text.length > NATURAL_CHAR_LIMIT) {
        return corsJson({ error: `Энэ хоолойд текст ${NATURAL_CHAR_LIMIT} тэмдэгтээс ихгуй байх ёстой (байгалийн хоолой учир удаан тул хязгаарласан)` }, 400);
      }
      const audioUrl = await callNaturalVoiceAPI(text);
      return corsJson({ audioUrl, slow: true });
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
// "Дорж" (Байгалийн Монгол хоолой) — streaming Gradio Space
// generate_speech нь yield ашиглан олон удаа аудио буцаадаг
// (өгуулбэр тус бугдийг). SSE урсгал дотор ОЛОН "data:" мор
// ирнэ, бугдийг цуглуулж эцсийн (хамгийн сулийн) chunk-ийг авна
// (учир нь Gradio streaming Audio component сулийн утгыг л
// харуулдаг, гэхдээ бугдийг нэгтгэх боломжгуй тул хамгийн сулийн
// бутэн chunk-ийг буцаана — ихэнхдээ энэ хамгийн бутэн дуу байдаг).
// ============================================================
async function callNaturalVoiceAPI(text) {
  const postRes = await fetch(NATURAL_CALL_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      data: [
        text,
        'Дорж',   // HF Space-ийн VOICES жагсаалт ["Дорж"] болж зассаны дараа энэ утга зөв ажиллана
        0.05,     // temperature
        1.0,      // top_p
        3.5,      // repetition_penalty
        1500      // max_new_tokens
      ]
    })
  });

  if (!postRes.ok) {
    const errText = await postRes.text().catch(() => '');
    throw new Error(`Байгалийн хоолойн Space холбогдоход алдаа (${postRes.status}): ${errText.slice(0, 200)}`);
  }

  const postData = await postRes.json();
  const eventId = postData.event_id;
  if (!eventId) {
    throw new Error('Байгалийн хоолойн Space-ээс event_id ирсэнгуй');
  }

  const getUrl = `${NATURAL_CALL_URL}/${eventId}`;
  const getRes = await fetch(getUrl, {
    method: 'GET',
    headers: { 'Accept': 'text/event-stream' }
  });

  if (!getRes.ok) {
    const errText = await getRes.text().catch(() => '');
    throw new Error(`Байгалийн хоолойн уйлдвэрлэлийг авахад алдаа (${getRes.status}): ${errText.slice(0, 200)}`);
  }

  const rawText = await getRes.text();
  const lines = rawText.split('\n');

  // ЗАСВАР: app.py дотор progress=gr.Progress() байгаа тул Gradio
  // "event: heartbeat" эсвэл бусад event тӨрӨл ч буцаадаг. ЗӨВХӨН
  // "event: error" гэдгийг АЛДАА гэж тооцно — бусад бугдийг (тэр
  // тоонд progress, generating, гэх мэт) АЛГАСНА.
  let bestDataLine = null;
  let bestLength = 0;
  let sawError = false;
  let errorData = null;
  const seenEvents = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.startsWith('event:')) {
      const ev = line.slice(6).trim();
      seenEvents.push(ev);
      sawError = (ev === 'error');
    } else if (line.startsWith('data:')) {
      const d = line.slice(5).trim();
      if (sawError) {
        errorData = d;
      } else if (d && d !== 'null' && d.length > bestLength) {
        bestDataLine = d;
        bestLength = d.length;
      }
    }
  }

  console.error('SSE events дараалал:', seenEvents.join(', '));
  console.error('SSE raw (эхний 1500):', rawText.slice(0, 1500));

  const lastDataLine = bestDataLine;

  if (sawError) {
    console.error('Natural voice raw SSE:', rawText.slice(0, 1000));
    throw new Error('Байгалийн хоолойн Space-ээс алдаа ирлээ: ' + (errorData || '(тодорхойгуй)').slice(0, 300) + ' | events: ' + seenEvents.join(','));
  }

  if (!lastDataLine) {
    throw new Error('Аудио ирсэнгуй. SSE events: [' + seenEvents.join(', ') + '] | raw(200): ' + rawText.slice(0, 200));
  }

  let parsed;
  try {
    parsed = JSON.parse(lastDataLine);
  } catch (e) {
    throw new Error('Байгалийн хоолойн хариу JSON биш байна: ' + lastDataLine.slice(0, 200));
  }

  const audioItem = Array.isArray(parsed) ? parsed[0] : parsed;
  if (!audioItem) {
    throw new Error('Байгалийн хоолойн Space-ээс аудио үр дун ирсэнгуй');
  }

  // ЗАСВАР: app.py дотор gr.Audio(type="numpy", ...) гэж заасан тул
  // Gradio заримдаа { value: { sample_rate, data: [...] } } эсвэл
  // шууд RAW numpy WAV массив хэлбэрээр буцаадаг. Энэ тохиолдолд
  // url/path байхгуй тул WAV болгож ӖӖРӖӖ хувиргах ёстой.
  if (audioItem.sample_rate !== undefined && Array.isArray(audioItem.data)) {
    return numpyToWavDataUrl(audioItem.data, audioItem.sample_rate);
  }
  if (audioItem.value && audioItem.value.sample_rate !== undefined) {
    return numpyToWavDataUrl(audioItem.value.data, audioItem.value.sample_rate);
  }

  if (audioItem.url) {
    return await fetchAndConvertToDataUrl(audioItem.url);
  }
  if (typeof audioItem === 'string' && audioItem.startsWith('http')) {
    return await fetchAndConvertToDataUrl(audioItem);
  }
  if (audioItem.path) {
    const fileUrl = `${NATURAL_SPACE_BASE}/gradio_api/file=${audioItem.path}`;
    return await fetchAndConvertToDataUrl(fileUrl);
  }
  if (audioItem.data && typeof audioItem.data === 'string') {
    return audioItem.data.startsWith('data:') ? audioItem.data : `data:audio/mpeg;base64,${audioItem.data}`;
  }

  console.error('Танигдсангуй audioItem бутэц:', JSON.stringify(audioItem).slice(0, 500));
  throw new Error('Байгалийн хоолойн аудио хариуны бутэц танигдсангуй: ' + JSON.stringify(audioItem).slice(0, 200));
}

// Gradio numpy audio [sample_rate, float_array] хэлбэрийг WAV
// файл болгож хувиргана (16-bit PCM)
function numpyToWavDataUrl(floatArray, sampleRate) {
  const numSamples = floatArray.length;
  const buffer = new ArrayBuffer(44 + numSamples * 2);
  const view = new DataView(buffer);

  function writeStr(offset, str) {
    for (let i = 0; i < str.length; i++) view.setUint8(offset + i, str.charCodeAt(i));
  }

  writeStr(0, 'RIFF');
  view.setUint32(4, 36 + numSamples * 2, true);
  writeStr(8, 'WAVE');
  writeStr(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeStr(36, 'data');
  view.setUint32(40, numSamples * 2, true);

  let offset = 44;
  for (let i = 0; i < numSamples; i++) {
    let s = Math.max(-1, Math.min(1, floatArray[i]));
    s = s < 0 ? s * 0x8000 : s * 0x7FFF;
    view.setInt16(offset, s, true);
    offset += 2;
  }

  const base64 = arrayBufferToBase64(buffer);
  return `data:audio/wav;base64,${base64}`;
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
    // ЗАСВАР: ӖМНӖ зӖвхӖн parsed.join() хийдэг байсан, гэхдээ
    // Gradio заримдаа parsed массив дотор null утга буцаадаг
    // (жишээ: [null]), тэгвэл "HF Space-ээс алдаа ирлээ: "
    // гэдэг хоосон шалтгаантай мессеж гарна. Одоо БУГД RAW
    // хариуг (rawText) ӖГНГ нэмж буцаана, тэгвэл консол дотор
    // яг юу болсныг харж болно.
    let errMsg;
    if (Array.isArray(parsed)) {
      errMsg = parsed.filter(x => x !== null && x !== undefined).join(', ') || '(тодорхойгуй, HF Space-ийн raw лог-г шалгана уу)';
    } else if (parsed === null) {
      errMsg = '(HF Space null алдаа буцаалаа — Gradio дотор exception гарсан гэсэн уг, Space-ийн Logs tab-аас шалгана уу)';
    } else {
      errMsg = JSON.stringify(parsed);
    }
    console.error('HF Space raw SSE response:', rawText.slice(0, 1000));
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
