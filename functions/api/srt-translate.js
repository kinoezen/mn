// ============================================================
// functions/api/srt-translate.js
// URL: POST /api/srt-translate
// Body: { srtContent: string, targetLang: string }
//
// SRT файлын форматыг хадгалж (тоо, цаг тэмдэг), зөвхөн
// текстийг орчуулна. _shared/ai.js-ийн callAI() ашигладаг.
// ============================================================
import { callAI, corsJson, corsOptions } from '../_shared/ai.js';

const LANG_NAMES = { en: 'Англи', mn: 'Монгол', ru: 'Орос', zh: 'Хятад', ja: 'Япон', ko: 'Солонгос' };

export async function onRequestOptions() {
  return corsOptions();
}

export async function onRequestPost({ request, env }) {
  try {
    const { srtContent, targetLang } = await request.json();

    if (!srtContent || !srtContent.trim()) {
      return corsJson({ error: 'SRT файлын агуулга хоосон байна' }, 400);
    }

    if (srtContent.length > 30000) {
      return corsJson({ error: 'SRT файл хэт том байна (30,000 тэмдэгтээс ихгуй байх ёстой)' }, 400);
    }

    const targetLangName = LANG_NAMES[targetLang] || 'Монгол';

    // SRT блокуудыг задлах: тоо, цаг тэмдэг, текст
    const blocks = parseSrt(srtContent);
    if (blocks.length === 0) {
      return corsJson({ error: 'SRT файл зөв форматтай биш байна' }, 400);
    }

    // Зөвхөн текстийг нэгтгэж, AI-д орчуулахаар явуулна (тоо, цаг хэвээрээ)
    const textsToTranslate = blocks.map((b, i) => `[${i}] ${b.text}`).join('\n');

    const systemPrompt = `Чи кино/видео субтитрийн орчуулагч. Доорх нь "[дугаар] текст" хэлбэрээр өгсөн субтитрийн мөрууд. Тус бугдийг ${targetLangName} хэл рууорчуулна. ЯГ ӖӖР ФОРМАТААР ("[дугаар] орчуулга") хариул, дугаарын дараалал, тоог ӖӖРЧЛӖХГҲЙ. Зөвхөн орчуулсан мөрууд буцаа, нэмэлт тайлбар бичих хэрэггуй.`;

    const { text: translatedRaw } = await callAI(env, systemPrompt, textsToTranslate, {
      temperature: 0.3,
      maxOutputTokens: 8000
    });

    // Орчуулагдсан текстийг буцааж SRT блокуудад угсарна
    const translatedLines = translatedRaw.split('\n').filter(l => l.trim());
    const translatedMap = {};
    for (const line of translatedLines) {
      const match = line.match(/^\[(\d+)\]\s*(.*)$/);
      if (match) translatedMap[match[1]] = match[2];
    }

    let outputSrt = '';
    blocks.forEach((b, i) => {
      const translated = translatedMap[i] || b.text; // орчуулга олдсонгуй бол анхны текст
      outputSrt += `${b.index}\n${b.timing}\n${translated}\n\n`;
    });

    return corsJson({ translatedSrt: outputSrt.trim() });
  } catch (err) {
    return corsJson({ error: err.message }, 500);
  }
}

// SRT файлыг блок болгон задлах: { index, timing, text }
function parseSrt(content) {
  const blocks = [];
  const rawBlocks = content.trim().split(/\n\s*\n/);
  for (const raw of rawBlocks) {
    const lines = raw.trim().split('\n');
    if (lines.length < 3) continue;
    const index = lines[0].trim();
    const timing = lines[1].trim();
    const text = lines.slice(2).join('\n').trim();
    if (index && timing && text) {
      blocks.push({ index, timing, text });
    }
  }
  return blocks;
}
