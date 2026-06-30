// ============================================================
// functions/api/tts.js
// URL: POST /api/tts
// Body: { text, engine: 'gemini'|'edge', voice, geminiVoice, rate, pitch, volume }
//
// 2 хоолой дэмжигддэг:
//   - Edge TTS (Батаа/Есуй): edge-tts-universal npm package-аар
//   - Gemini TTS: Google Gemini API-аар
//
// ЭНЭ ХУВИЛБАРЫН ШИНЭ ЗУЙЛ:
//   - package.json дотор edge-tts-universal-ийг ^1.6.0 (эсвэл
//     сулийн хувилбар) болгож шинэчлэх ШААРДЛАГАТАЙ — Microsoft
//     2026 онд Edge TTS-ийн authentication-ийг ӖӖРЧИЛСӖН тул
//     хуучин ^1.4.0 хувилбар WebSocket холболтоо MUID cookie
//     дутуугаас алдаатай хаагдаж, "Unexpected end of JSON input"
//     алдаа гаргадаг байсан.
//   - Доорх код алдааг ИЛУУ ТОДОРХОЙ message-тэйгээр буцаадаг
//     болгосон тул deploy амжилтгуй ч (хуучин package хэвээр) —
//     консол дотор яг шалтгааныг харж болно.
// ============================================================
import { EdgeTTS } from 'edge-tts-universal';
import { corsJson, corsOptions } from '../_shared/ai.js';

const GEMINI_VOICE_MAP = {
  'Лхагваа (эрэгтэй)': 'Charon',
  'Доржоо (эрэгтэй)': 'Fenrir',
  'Батбаяр (эрэгтэй)': 'Puck',
  'Мөнхбат (эрэгтэй)': 'Orbit',
  'Энхбаяр (эрэгтэй)': 'Zephyr',
  'Ганбаатар (эрэгтэй)': 'Schedar',
  'Дулмаа (эмэгтэй)': 'Aoede',
  'Номин (эмэгтэй)': 'Kale',
  'Нарантуяа (эмэгтэй)': 'Leda'
};

// Edge TTS-ийн хоолойн нэрс — ОЛОН хэлбэрийг хулеэж авна
const EDGE_VOICE_MAP = {
  'Батаа': 'mn-MN-BataaNeural',
  'Батаа (эрэгтэй)': 'mn-MN-BataaNeural',
  'Есуй': 'mn-MN-YesuiNeural',
  'Есуй (эмэгтэй)': 'mn-MN-YesuiNeural',
  'Есүй': 'mn-MN-YesuiNeural',
  'Есүй (эмэгтэй)': 'mn-MN-YesuiNeural'
};

export async function onRequestOptions() {
  return corsOptions();
}

export async function onRequestPost({ request, env }) {
  try {
    const { text, engine, voice, geminiVoice, rate, pitch, volume } = await request.json();

    if (!text || !text.trim()) {
      return corsJson({ error: 'Текст оруулна уу' }, 400);
    }

    if (engine === 'edge') {
      return await handleEdgeTTS(text, voice, rate, pitch, volume);
    } else {
      return await handleGeminiTTS(env, text, geminiVoice);
    }
  } catch (err) {
    // ӖМНӖ: зӖвхӖн err.message буцаадаг байсан, заримдаа
    // err нь Error объект биш (TypeError stack, plain string,
    // эсвэл undefined) учраас фронтенд "Unexpected end of JSON
    // input" гэж харж байсан. Одоо БУГД тохиолдолд бат бих
    // JSON буцаана.
    console.error('TTS endpoint error:', err);
    const message = (err && err.message) ? err.message : 'TTS-д тодорхойгуй алдаа гарлаа';
    return corsJson({ error: message, debug: String(err) }, 500);
  }
}

// ---- EDGE TTS (Батаа / Есуй) ----
async function handleEdgeTTS(text, voiceName, rate, pitch, volume) {
  if (text.length > 5000) {
    return corsJson({ error: 'Edge TTS-д текст 5000 тэмдэгтээс ихгуй байх ёстой' }, 400);
  }

  const cleanVoiceName = (voiceName || '').trim();
  const voice = EDGE_VOICE_MAP[cleanVoiceName] || 'mn-MN-BataaNeural';

  const rateStr = `${rate >= 0 ? '+' : ''}${rate ?? 0}%`;
  const pitchStr = `${pitch >= 0 ? '+' : ''}${pitch ?? 0}Hz`;
  const volumeStr = `${volume >= 0 ? '+' : ''}${volume ?? 0}%`;

  let tts, result;
  try {
    tts = new EdgeTTS(text, voice, {
      rate: rateStr,
      pitch: pitchStr,
      volume: volumeStr
    });

    result = await tts.synthesize();
  } catch (synthErr) {
    // edge-tts-universal-ийн ХУУЧИН хувилбар Microsoft-ийн шинэ
    // WebSocket authentication-той (MUID cookie) зӖрчилдвӖл ЭНД
    // унана. Тиймээс ИЛҲУ ОЙЛГОМЖТОЙ алдаа буцаана.
    console.error('EdgeTTS synthesize алдаа:', synthErr);
    throw new Error(
      'Edge TTS холболт амжилтгуй (' + (synthErr?.message || synthErr) + '). ' +
      'package.json доторх edge-tts-universal хувилбарыг ^1.6.0 буюу сулийн ' +
      'хувилбар болгож шинэчилж дахин deploy хийх шаардлагатай байж магадгуй.'
    );
  }

  if (!result || !result.audio) {
    throw new Error('Edge TTS-ээс аудио хариу ирсэнгуй (result.audio байхгуй)');
  }

  const audioBuffer = await result.audio.arrayBuffer();
  if (!audioBuffer || audioBuffer.byteLength === 0) {
    throw new Error('Edge TTS-ээс хоосон аудио ирлээ (0 byte)');
  }

  const audioBase64 = arrayBufferToBase64(audioBuffer);

  return corsJson({ audioUrl: `data:audio/mpeg;base64,${audioBase64}`, usedVoice: voice });
}

// ---- GEMINI TTS (Лхагваа, Доржоо, ...) ----
async function handleGeminiTTS(env, text, geminiVoiceName) {
  if (!env.GEMINI_API_KEY) {
    return corsJson({ error: 'Серверийн тохиргоо дутуу (GEMINI_API_KEY алга)' }, 500);
  }
  if (text.length > 500) {
    return corsJson({ error: 'Gemini TTS-д текст 500 тэмдэгтээс ихгуй байх ёстой' }, 400);
  }

  const voiceName = GEMINI_VOICE_MAP[geminiVoiceName] || 'Charon';
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-tts:generateContent?key=${env.GEMINI_API_KEY}`;

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text }] }],
      generationConfig: {
        responseModalities: ['AUDIO'],
        speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName } } }
      }
    })
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Gemini TTS алдаа (${response.status}): ${errText}`);
  }

  const result = await response.json();
  const audioB64 = result?.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
  if (!audioB64) throw new Error('Gemini-ээс аудио мэдээлэл ирсэнгуй');

  const pcmBytes = base64ToUint8Array(audioB64);
  const wavBytes = pcmToWav(pcmBytes, 24000, 1, 16);
  const wavBase64 = uint8ArrayToBase64(wavBytes);

  return corsJson({ audioUrl: `data:audio/wav;base64,${wavBase64}` });
}

// ---- Туслах функцууд ----

function arrayBufferToBase64(buffer) {
  return uint8ArrayToBase64(new Uint8Array(buffer));
}

function base64ToUint8Array(base64) {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

function uint8ArrayToBase64(bytes) {
  let binary = '';
  const chunkSize = 8192;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode.apply(null, bytes.subarray(i, i + chunkSize));
  }
  return btoa(binary);
}

function pcmToWav(pcmBytes, sampleRate, channels, bitsPerSample) {
  const dataSize = pcmBytes.length;
  const byteRate = (sampleRate * channels * bitsPerSample) / 8;
  const blockAlign = (channels * bitsPerSample) / 8;
  const buffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(buffer);

  writeString(view, 0, 'RIFF');
  view.setUint32(4, 36 + dataSize, true);
  writeString(view, 8, 'WAVE');
  writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, channels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitsPerSample, true);
  writeString(view, 36, 'data');
  view.setUint32(40, dataSize, true);

  const wavBytes = new Uint8Array(buffer);
  wavBytes.set(pcmBytes, 44);
  return wavBytes;
}

function writeString(view, offset, str) {
  for (let i = 0; i < str.length; i++) {
    view.setUint8(offset + i, str.charCodeAt(i));
  }
}
