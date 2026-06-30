// ============================================================
// functions/api/tts.js
// URL: POST /api/tts
// Body: { text, engine: 'gemini'|'edge', voice, geminiVoice, rate, pitch, volume }
//
// ЭНЭ ХУВИЛБАР: edge-tts-universal NPM PACKAGE-ИЙГ БҲХ ШИЛТГЭЭГуй!
// package.json-д ХЭРЭГЦАА БАЙХГуй. Cloudflare Pages-ийн build
// "No deployment available" гэж гацдаг асуудлыг АРИЛГАХЫН тулд
// Microsoft-ийн Edge TTS WebSocket рҲҲ ШУУД холбогддог.
//
// Хэрэв package.json дотор "edge-tts-universal" гэж бичигдсэн
// мор хэвээр байгаа бол арилгахыг зӖвлӖж байна (шаардлагагуй),
// гэхдээ үлдсэн ч энэ файл түунээс хамаарахгуй тул асуудал биш.
// ============================================================
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
    console.error('TTS endpoint error:', err);
    const message = (err && err.message) ? err.message : 'TTS-д тодорхойгуй алдаа гарлаа';
    return corsJson({ error: message }, 500);
  }
}

// ============================================================
// EDGE TTS — ШУУД WebSocket-оор Microsoft-ийн серверт холбогдоно
// (Package шаардахгуй, зӖвхӖн Cloudflare Workers native WebSocket)
// ============================================================

const TRUSTED_CLIENT_TOKEN = '6A5AA1D4EAFF4E9FB37E23D68491D6F4';
const WSS_URL = `wss://speech.platform.bing.com/consumer/speech/synthesize/readaloud/edge/v1?TrustedClientToken=${TRUSTED_CLIENT_TOKEN}`;

function generateUUID() {
  return crypto.randomUUID().replace(/-/g, '');
}

function dateToString() {
  const d = new Date();
  return d.toUTCString().replace('GMT', 'GMT+0000 (Coordinated Universal Time)');
}

function escapeXml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

async function handleEdgeTTS(text, voiceName, rate, pitch, volume) {
  if (text.length > 5000) {
    return corsJson({ error: 'Edge TTS-д текст 5000 тэмдэгтээс ихгуй байх ёстой' }, 400);
  }

  const cleanVoiceName = (voiceName || '').trim();
  const voice = EDGE_VOICE_MAP[cleanVoiceName] || 'mn-MN-BataaNeural';

  const rateStr = `${rate >= 0 ? '+' : ''}${rate ?? 0}%`;
  const pitchStr = `${pitch >= 0 ? '+' : ''}${pitch ?? 0}Hz`;
  const volumeStr = `${volume >= 0 ? '+' : ''}${volume ?? 0}%`;

  let audioBuffer;
  try {
    audioBuffer = await synthesizeEdgeTTS(text, voice, rateStr, pitchStr, volumeStr);
  } catch (synthErr) {
    console.error('EdgeTTS WebSocket алдаа:', synthErr);
    throw new Error('Edge TTS холболт амжилтгуй: ' + (synthErr?.message || synthErr));
  }

  if (!audioBuffer || audioBuffer.byteLength === 0) {
    throw new Error('Edge TTS-ээс хоосон аудио ирлээ (0 byte)');
  }

  const audioBase64 = arrayBufferToBase64(audioBuffer);
  return corsJson({ audioUrl: `data:audio/mpeg;base64,${audioBase64}`, usedVoice: voice });
}

function synthesizeEdgeTTS(text, voice, rateStr, pitchStr, volumeStr) {
  return new Promise((resolve, reject) => {
    let ws;
    try {
      ws = new WebSocket(WSS_URL);
    } catch (e) {
      reject(new Error('WebSocket уусгэх боломжгуй: ' + e.message));
      return;
    }

    const audioChunks = [];
    let settled = false;

    const finish = (fn, val) => {
      if (settled) return;
      settled = true;
      clearTimeout(timeoutId);
      try { ws.close(); } catch (_) {}
      fn(val);
    };

    const timeoutId = setTimeout(() => {
      finish(reject, new Error('TTS хариу 15 секундэд ирсэнгуй (timeout)'));
    }, 15000);

    ws.addEventListener('open', () => {
      const requestId = generateUUID();
      const timestamp = dateToString();

      const configMsg =
        `X-Timestamp:${timestamp}\r\n` +
        `Content-Type:application/json; charset=utf-8\r\n` +
        `Path:speech.config\r\n\r\n` +
        JSON.stringify({
          context: {
            synthesis: {
              audio: {
                metadataoptions: {
                  sentenceBoundaryEnabled: 'false',
                  wordBoundaryEnabled: 'false'
                },
                outputFormat: 'audio-24khz-48kbitrate-mono-mp3'
              }
            }
          }
        });

      const ssml =
        `<speak version='1.0' xmlns='http://www.w3.org/2001/10/synthesis' xml:lang='mn-MN'>` +
        `<voice name='${voice}'>` +
        `<prosody rate='${rateStr}' pitch='${pitchStr}' volume='${volumeStr}'>` +
        `${escapeXml(text)}` +
        `</prosody></voice></speak>`;

      const ssmlMsg =
        `X-RequestId:${requestId}\r\n` +
        `Content-Type:application/ssml+xml\r\n` +
        `X-Timestamp:${timestamp}Z\r\n` +
        `Path:ssml\r\n\r\n` +
        ssml;

      try {
        ws.send(configMsg);
        ws.send(ssmlMsg);
      } catch (e) {
        finish(reject, new Error('Мэдээлэл илгээхэд алдаа гарлаа: ' + e.message));
      }
    });

    ws.addEventListener('message', (event) => {
      const data = event.data;

      if (typeof data === 'string') {
        if (data.includes('Path:turn.end')) {
          if (audioChunks.length === 0) {
            finish(reject, new Error('Аудио дата ирсэнгуй (turn.end ирсэн ч хоосон)'));
            return;
          }
          const totalLen = audioChunks.reduce((sum, c) => sum + c.byteLength, 0);
          const merged = new Uint8Array(totalLen);
          let offset = 0;
          for (const chunk of audioChunks) {
            merged.set(chunk, offset);
            offset += chunk.byteLength;
          }
          finish(resolve, merged.buffer);
        }
      } else {
        let bin;
        if (data instanceof ArrayBuffer) {
          bin = new Uint8Array(data);
        } else if (data && data.buffer) {
          bin = new Uint8Array(data.buffer, data.byteOffset || 0, data.byteLength);
        } else {
          return;
        }

        if (bin.length < 2) return;
        const headerLen = (bin[0] << 8) | bin[1];
        const audioStart = 2 + headerLen;
        if (bin.length > audioStart) {
          audioChunks.push(bin.slice(audioStart));
        }
      }
    });

    ws.addEventListener('error', () => {
      finish(reject, new Error('WebSocket холболтын алдаа (Microsoft-ийн сервер хариу буцаагуй байж магадгуй)'));
    });

    ws.addEventListener('close', (event) => {
      if (!settled) {
        if (audioChunks.length > 0) {
          const totalLen = audioChunks.reduce((sum, c) => sum + c.byteLength, 0);
          const merged = new Uint8Array(totalLen);
          let offset = 0;
          for (const chunk of audioChunks) {
            merged.set(chunk, offset);
            offset += chunk.byteLength;
          }
          finish(resolve, merged.buffer);
        } else {
          finish(reject, new Error(`WebSocket хаагдсан (code: ${event.code}), аудио ирсэнгуй`));
        }
      }
    });
  });
}

// ============================================================
// GEMINI TTS (Лхагваа, Доржоо, ...)
// ============================================================
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
