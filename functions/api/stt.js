// ============================================================
// functions/api/stt.js
// URL: POST /api/stt
// Body: FormData { audio: File }
//
// ЗАСВАР: Groq Whisper Монгол хэлийг буруу таньдаг байсан тул
// Google Cloud Speech-to-Text API-аар сольсон. Энэ нь mn-MN
// (Монгол) хэлийг албан ёсоор дэмждэг, чанар маш сайн.
// Lkhagvaa-ийн Google Cloud account-ийн $300 кредит ашиглана.
// ============================================================
import { corsJson, corsOptions } from '../_shared/ai.js';

export async function onRequestOptions() {
  return corsOptions();
}

export async function onRequestPost({ request, env }) {
  try {
    if (!env.GOOGLE_STT_API_KEY) {
      return corsJson({ error: 'Серверийн тохиргоо дутуу (GOOGLE_STT_API_KEY алга)' }, 500);
    }

    const formData = await request.formData();
    const audioFile = formData.get('audio');

    if (!audioFile) {
      return corsJson({ error: 'Аудио файл оруулна уу' }, 400);
    }

    // Google Speech-to-Text хязгаар: ~10MB (inline байтаар дамжуулах тул)
    if (audioFile.size > 10 * 1024 * 1024) {
      return corsJson({ error: 'Аудио файл 10MB-ээс ихгүй байх ёстой' }, 400);
    }

    // Файлыг base64 болгох
    const audioBuffer = await audioFile.arrayBuffer();
    const audioBase64 = arrayBufferToBase64(audioBuffer);

    // Файлын төрлөөс encoding тодорхойлох
    const mimeType = audioFile.type || 'audio/mpeg';
    const encoding = getEncoding(mimeType);

    const url = `https://speech.googleapis.com/v1/speech:recognize?key=${env.GOOGLE_STT_API_KEY}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        config: {
          encoding: encoding,
          sampleRateHertz: 16000,
          languageCode: 'mn-MN',        // Монгол хэл
          alternativeLanguageCodes: [],  // зөвхөн Монгол
          enableAutomaticPunctuation: true,
          model: 'default'
        },
        audio: {
          content: audioBase64
        }
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Google STT API error (${response.status}): ${errText}`);
    }

    const data = await response.json();

    // Бүх хэсгүүдийн транскрипцийг нэгтгэх
    const transcript = data?.results
      ?.map(r => r?.alternatives?.[0]?.transcript || '')
      .join(' ')
      .trim();

    if (!transcript) {
      throw new Error('Дуу таних боломжгүй байсан. Илүү тод, ойрхон аудио оруулна уу.');
    }

    return corsJson({ transcript });
  } catch (err) {
    return corsJson({ error: err.message }, 500);
  }
}

// MIME type-аас Google STT encoding тодорхойлох
function getEncoding(mimeType) {
  if (mimeType.includes('mp3') || mimeType.includes('mpeg')) return 'MP3';
  if (mimeType.includes('wav')) return 'LINEAR16';
  if (mimeType.includes('m4a') || mimeType.includes('mp4')) return 'MP4';
  if (mimeType.includes('ogg')) return 'OGG_OPUS';
  if (mimeType.includes('flac')) return 'FLAC';
  if (mimeType.includes('webm')) return 'WEBM_OPUS';
  return 'MP3'; // default
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
