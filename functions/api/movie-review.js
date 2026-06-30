// ============================================================
// functions/api/movie-review.js
// URL: POST /api/movie-review
// Body: { title: string, length: "short" | "medium" | "long" }
//
// ЗАСВАР: Хуучин хувилбар зөвхөн AI-аас (Gemini/Groq) шууд тойм
// бичүүлдэг байсан тул найруулагч, жүжигчдийн нэр зэргийг
// ЗОХИОМЛООР (hallucination) гаргадаг асуудалтай байсан.
//
// Одоо OMDb API-аас эхлээд БОДИТ мэдээлэл (жил, найруулагч,
// жүжигчид, IMDb үнэлгээ, агуулга) татаж аваад, AI-г ЗӨВХӨН тэр
// бодит мэдээлэл дээр үндэслэн Монгол хэлээр сонирхолтой тойм
// бичихэд ашиглана. Хэрэв OMDb-д кино олдохгүй бол (ялангуяа
// Монгол кино) AI-д нэр зэргийг зохиохгүй байхыг хатуу зааж,
// зөвхөн ерөнхий түвшинд бичихийг шаардана.
//
// ШААРДЛАГА: Cloudflare Environment Variables дотор
// OMDB_API_KEY-г заавал тохируулсан байх ёстой.
// ============================================================
import { callAI, corsJson, corsOptions } from '../_shared/ai.js';

export async function onRequestOptions() {
  return corsOptions();
}

export async function onRequestPost({ request, env }) {
  try {
    const { title, length } = await request.json();
    if (!title || !title.trim()) {
      return corsJson({ error: 'Кино нэр оруулна уу' }, 400);
    }

    const lengthMap = { short: '150-200 үг', medium: '300-400 үг', long: '500-700 үг' };
    const wordCount = lengthMap[length] || '300-400 үг';

    // OMDb-аас бодит мэдээлэл хайх (хэрэв key тохируулаагүй бол алгасна)
    let movieData = null;
    if (env.OMDB_API_KEY) {
      movieData = await fetchOmdbData(env.OMDB_API_KEY, title.trim());
    }

    let systemPrompt, userText;

    if (movieData) {
      // ===== OMDb-д ОЛДСОН ТОХИОЛДОЛ: бодит мэдээлэл дээр тулгуурлана =====
      systemPrompt = `Чи кино шинжээч. Доорх БОДИТ мэдээллийг ашиглан Монгол хэлээр сонирхолтой кино тойм бичнэ.

ХАТУУ ДҮРЭМ:
1. ЗӨВХӨН доор өгөгдсөн бодит мэдээллийг ашигла. Найруулагч, жүжигчин, жил зэрэг баримтыг ӨӨРӨӨ ЗОХИОХГҮЙ, доор байгаагаас өөр нэр бүү дурд.
2. Хэрэв зарим талбар "Мэдээлэл алга" гэж байвал, тэр тухай "тодорхой мэдээлэл олдсонгуй" гэж шударгаар дурд, бүү зохиомол нэр оруул.
3. Зөвхөн тойм текстийг буцаа, "Тайлбар:", "Нэмэлт:" гэх мэт label бичихгүй.`;

      userText = `БОДИТ МЭДЭЭЛЭЛ:
Нэр: ${movieData.title}
Жил: ${movieData.year}
Найруулагч: ${movieData.director}
Жүжигчид: ${movieData.actors}
Төрөл: ${movieData.genre}
IMDb үнэлгээ: ${movieData.rating}
Агуулга (English): ${movieData.plot}

Дээрх бодит мэдээлэл дээр үндэслэн "${movieData.title}" киноны Монгол хэлээр тойм бич. Урт: ${wordCount}.
Дараах бүтцээр бич:
- Товч танилцуулга
- Үйл явдлын ерөнхий агуулга (spoiler-гүй, "Агуулга" талбарыг Монгол хэлээр орчуулж ашигла)
- Найруулагч болон жүжигчид (дээрх бодит мэдээллээс)
- Онцлог тал
- Үнэлгээ (IMDb үнэлгээг дурдаад өөрийн дүгнэлт нэмж болно)
Уншихад сонирхолтой байдлаар бич.`;
    } else {
      // ===== OMDb-д ОЛДООГҮЙ ТОХИОЛДОЛ: зохиомол нэр хориглоно =====
      systemPrompt = `Чи кино шинжээч. Гэхдээ доорх кино тухай чамд найдвартай, баталгаатай мэдээлэл байхгүй байж болзошгүй (ялангуяа Монгол кино, цөөн мэдэгддэг кино бол).

ХАТУУ ДҮРЭМ:
1. Хэрэв энэ кино тухай чи яг таг найруулагч, жүжигчдийн нэрийг МЭДЭХГҮЙ бол тэдгээрийг ХЭЗЭЭ Ч бүү зохио, бүү таамаглаж нэр дурдаарай.
2. Үүний оронд "Найруулагч, жүжигчдийн тухай нарийн мэдээлэл олдсонгүй" гэдгийг шударгаар дурд.
3. Зөвхөн кино нэрнээс ойлгогдох төрөл, сэдвийн талаар ерөнхийд нь бичиж болно, гэхдээ үүнийг "энэ нэрнээс харахад..." гэх мэт болгоомжтой хэллэгээр илэрхийл.
4. Хуурамч баримт мэдээллийг бодит мэт танилцуулахыг ХАТУУ ХОРИГЛОНО.
5. Зөвхөн тойм текстийг буцаа, "Тайлбар:" гэх мэт label бичихгүй.`;

      userText = `"${title.trim()}" гэдэг кино тухай Монгол хэлээр тойм бич. Урт: ${wordCount}.
Хэрэв энэ кино тухай чамд найдвартай мэдээлэл байхгүй бол дээрх дүрмийн дагуу үнэнчээр бич — нэр зохиохгүй.`;
    }

    const { text } = await callAI(env, systemPrompt, userText, {
      temperature: 0.6,
      maxOutputTokens: 6000
    });

    return corsJson({ review: text, sourced: !!movieData });
  } catch (err) {
    return corsJson({ error: err.message }, 500);
  }
}

async function fetchOmdbData(apiKey, title) {
  try {
    const url = `https://www.omdbapi.com/?t=${encodeURIComponent(title)}&apikey=${apiKey}`;
    const response = await fetch(url);
    if (!response.ok) return null;

    const data = await response.json();
    if (data.Response === 'False') return null;

    return {
      title: data.Title || title,
      year: data.Year || 'Мэдээлэл алга',
      director: data.Director && data.Director !== 'N/A' ? data.Director : 'Мэдээлэл алга',
      actors: data.Actors && data.Actors !== 'N/A' ? data.Actors : 'Мэдээлэл алга',
      genre: data.Genre && data.Genre !== 'N/A' ? data.Genre : 'Мэдээлэл алга',
      rating: data.imdbRating && data.imdbRating !== 'N/A' ? data.imdbRating : 'Мэдээлэл алга',
      plot: data.Plot && data.Plot !== 'N/A' ? data.Plot : 'Мэдээлэл алга'
    };
  } catch (e) {
    console.error('OMDb fetch error:', e.message);
    return null;
  }
}
