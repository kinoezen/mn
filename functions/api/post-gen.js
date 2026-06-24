// ============================================================
// functions/api/post-gen.js
// URL: POST /api/post-gen
// Body: { content: string, platform: 'facebook'|'instagram' }
//
// _shared/ai.js-ийн callAI()-г ашигладаг: Gemini->Groq fallback.
// ============================================================
import { callAI, corsJson, corsOptions } from '../_shared/ai.js';

export async function onRequestOptions() {
  return corsOptions();
}

export async function onRequestPost({ request, env }) {
  try {
    const { content, platform } = await request.json();

    if (!content || !content.trim()) {
      return corsJson({ error: 'Агуулга оруулна уу' }, 400);
    }

    const platformNames = { facebook: 'Facebook', instagram: 'Instagram' };
    const platformName = platformNames[platform] || 'Facebook';

    const systemPrompt = `Чи сошиал медиа контент бичигч. Монгол хэлээр ${platformName}-д зориулсан таталцалтай, сонирхолтой пост бичнэ. Хэрэв Instagram бол hashtag нэмж, илүү дэгжин байдлаар бич. Хэрэв Facebook бол арай дэлгэрэнгуй, ярианы байдлаар бич. Зөвхөн постын текстийг буцаа, нэмэлт тайлбар бичих хэрэггуй.`;

    const { text } = await callAI(env, systemPrompt, content, {
      temperature: 0.8,
      maxOutputTokens: 2048
    });

    return corsJson({ post: text });
  } catch (err) {
    return corsJson({ error: err.message }, 500);
  }
}
