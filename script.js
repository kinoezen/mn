// ============================================================
// КИНО ЭЗЭН — ҮНДСЭН JAVASCRIPT (ЗАССАН)
// ============================================================

const SUPABASE_URL = 'https://smncsxlbyyhowfarxxlz.supabase.co';
const SUPABASE_KEY = 'sb_publishable_Zjr9q57fQ5ZV-BF0StnvJA_Z1U_7qHO';

function sanitize(str) {
  if (!str) return '';
  const d = document.createElement('div');
  d.textContent = String(str);
  return d.innerHTML;
}

// ===== SUPABASE FETCH =====
async function supaFetch(table, params = '') {
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${params}`, {
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      }
    });
    if (!res.ok) {
      const errText = await res.text();
      console.error(`supaFetch [${table}] HTTP ${res.status}:`, errText);
      return [];
    }
    return await res.json();
  } catch (error) {
    console.error('supaFetch error:', error);
    return [];
  }
}

// ===== GENRE COLORS & GRADIENTS =====
const genreColors = {
  'Фантастик': 'cp-sci',
  'Экшн': 'cp-act',
  'Драм': 'cp-drm',
  'Аймаар': 'cp-act',
  'Романтик': 'cp-drm',
  'Аниме': 'cp-sci',
  'Олон ангит': 'cp-drm'
};
const genreGradients = {
  'Фантастик': 'linear-gradient(135deg,#1a0a2e,#3b1f6b)',
  'Экшн': 'linear-gradient(135deg,#2a0a0a,#6b1f1f)',
  'Драм': 'linear-gradient(135deg,#0a1a0a,#1a3a20)',
  'Аймаар': 'linear-gradient(135deg,#1a0a1a,#3b1f3b)',
  'Романтик': 'linear-gradient(135deg,#1a0a0a,#3b1010)',
  'Аниме': 'linear-gradient(135deg,#0a0a2a,#1f1f6b)',
  'Олон ангит': 'linear-gradient(135deg,#0a1a2a,#1a3050)'
};

// ===== ЦАГ АГААР — МОНГОЛ =====
function translateWeatherCode(code) {
  const map = {
    0:  '☀️ Цэлмэг',
    1:  '🌤️ Хэсэгчлэн үүлтэй',
    2:  '⛅ Үүлэрхэг',
    3:  '☁️ Бүрхэг',
    45: '🌫️ Манантай',
    48: '🌫️ Хяруутай манан',
    51: '🌦️ Хөнгөн шиврэх бороо',
    53: '🌦️ Шиврэх бороо',
    55: '🌧️ Хүчтэй шиврэх бороо',
    56: '🌧️ Хөнгөн мөстөлт бороо',
    57: '🌧️ Мөстөлт бороо',
    61: '🌦️ Хөнгөн бороо',
    63: '🌧️ Дунд зэргийн бороо',
    65: '⛈️ Хүчтэй бороо',
    66: '🌧️ Хөнгөн мөсөн бороо',
    67: '🌧️ Мөсөн бороо',
    71: '🌨️ Хөнгөн цас',
    73: '❄️ Дунд зэргийн цас',
    75: '❄️ Хүчтэй цас',
    77: '🌨️ Цасан ширхэг',
    80: '🌦️ Хөнгөн аадар бороо',
    81: '🌧️ Аадар бороо',
    82: '⛈️ Хүчтэй аадар бороо',
    85: '🌨️ Хөнгөн цасан шуурга',
    86: '❄️ Хүчтэй цасан шуурга',
    95: '⛈️ Аянгатай бороо',
    96: '⛈️ Аянгатай мөндөртэй бороо',
    99: '⛈️ Хүчтэй аянгатай мөндөртэй бороо'
  };
  return map[code] || '🌡️ Улаанбаатар';
}

async function loadWeather() {
  const weatherEl = document.getElementById('weather-temp');
  if (!weatherEl) return;

  try {
    const res = await fetch(
      'https://api.open-meteo.com/v1/forecast?latitude=47.92&longitude=106.92&current_weather=true&timezone=Asia%2FShanghai'
    );
    if (!res.ok) throw new Error('API хариу өгсөнгүй');
    const data = await res.json();
    if (data.current_weather) {
      const temp = data.current_weather.temperature;
      const code = data.current_weather.weathercode;
      const desc = translateWeatherCode(code);
      weatherEl.textContent = `${temp}°C · ${desc}`;
    }
  } catch (err) {
    console.error('Weather error:', err);
    weatherEl.textContent = '—°C';
  }
}

// ===== ОГНОО МОНГОЛООР =====
function setDate() {
  const el = document.getElementById('today-date');
  if (!el) return;
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  const days = ['Ням', 'Даваа', 'Мягмар', 'Лхагва', 'Пүрэв', 'Баасан', 'Бямба'];
  el.textContent = `${y}.${m}.${d} ${days[now.getDay()]}`;
}

// ===== РЕКЛАМ — SUPABASE-ААС ТАТАХ =====
async function loadAd() {
  const slider = document.getElementById('ad-slider');
  if (!slider) return;

  try {
    // Supabase-ийн 'ads' хүснэгтээс татна (is_active=true байгаа рекламуудыг)
    const ads = await supaFetch('ads', 'is_active=eq.true&order=created_at.desc&limit=5');

    if (!ads || ads.length === 0) {
      // Supabase-д реклам байхгүй бол default реклам харуулна
      slider.innerHTML = `
        <div class="ad-slide active">
          <div class="ad-banner">
            <div class="ad-text">
              <strong>🏢 Таны компанийн реклам энд</strong>
              <div>Сарын 50,000₮-өөс эхлэн рекламаа байршуул</div>
            </div>
            <button class="ad-btn" onclick="location.href='#contact'">Холбоо барих</button>
          </div>
        </div>`;
      return;
    }

    // Supabase-ийн рекламуудыг харуулна
    slider.innerHTML = ads.map((ad, i) => `
      <div class="ad-slide${i === 0 ? ' active' : ''}">
        <div class="ad-banner">
          ${ad.image_url ? `<img src="${sanitize(ad.image_url)}" alt="${sanitize(ad.title || 'Реклам')}" style="max-height:60px;border-radius:6px;">` : ''}
          <div class="ad-text">
            <strong>${sanitize(ad.title || '🏢 Реклам')}</strong>
            <div>${sanitize(ad.description || '')}</div>
          </div>
          ${ad.link_url ? `<button class="ad-btn" onclick="window.open('${sanitize(ad.link_url)}','_blank')">
            ${sanitize(ad.btn_text || 'Дэлгэрэнгүй')}
          </button>` : ''}
        </div>
      </div>
    `).join('');

    // Олон реклам байвал автоматаар солино
    if (ads.length > 1) {
      let adIdx = 0;
      setInterval(() => {
        const slides = slider.querySelectorAll('.ad-slide');
        slides[adIdx].classList.remove('active');
        adIdx = (adIdx + 1) % slides.length;
        slides[adIdx].classList.add('active');
      }, 4000);
    }

  } catch (err) {
    console.error('loadAd error:', err);
  }
}

// ===== FEATURED CAROUSEL =====
let carouselIndex = 0;
let carouselAuto;
const AUTO_INTERVAL = 5000;
let featuredMoviesData = [];

function getCardsVisible() {
  return window.innerWidth <= 480 ? 1 : window.innerWidth <= 768 ? 2 : 4;
}

function buildFeaturedCardFromMovie(m) {
  const g1 = genreColors[m.genre] || 'cp-sci';
  const g2 = genreColors[m.genre2] || '';
  const bg = genreGradients[m.genre] || 'linear-gradient(135deg,#1a0a2e,#3b1f6b)';
  const tags = m.featured ? `<span class="ftag ftag-top">✦ Онцлох</span>` : '';

  const thumbHtml = m.thumbnail
    ? `<img src="${sanitize(m.thumbnail)}" alt="${sanitize(m.title)}" loading="lazy" onerror="this.style.display='none'">`
    : `<span class="fallback-emoji">🎬</span>`;

  return `<article class="featured-card" tabindex="0" onclick="location.href='movie.html?id=${sanitize(m.id)}'" aria-label="${sanitize(m.title)}">
    <div class="featured-img" style="background:${bg}">
      ${thumbHtml}
      <div class="featured-overlay"></div>
      <div class="featured-tags">${tags}</div>
    </div>
    <div class="featured-body">
      <div class="featured-cats">
        <span class="cpill ${g1}">${sanitize(m.genre)}</span>
        ${m.genre2 ? `<span class="cpill ${g2}">${sanitize(m.genre2)}</span>` : ''}
      </div>
      <h2 class="featured-title">${sanitize(m.title)}</h2>
      <p class="featured-desc">${sanitize(m.description || 'Киноны тухай...')}</p>
      <div class="featured-foot">
        <div class="author">
          <div class="ava" style="background:linear-gradient(135deg,#4ade80,#fbbf24)">КЭ</div>
          <div class="ava-name">Кино Эзэн</div>
        </div>
        <div class="stats-row">
          <div class="stat-item">👁 ${m.views || 0}</div>
          <div class="stat-item">❤️ ${m.likes || 0}</div>
        </div>
      </div>
      <button class="watch-btn" onclick="event.stopPropagation();location.href='movie.html?id=${sanitize(m.id)}'">▶ Үзэх</button>
    </div>
  </article>`;
}

async function loadFeaturedMovies() {
  const track = document.getElementById('featured-track');
  track.innerHTML = '<div class="loading" style="text-align:center;padding:40px;color:rgba(255,255,255,0.3);">🎬 Онцлох кино ачааллаж байна...</div>';

  try {
    const movies = await supaFetch('movies', 'featured=eq.true&order=created_at.desc&limit=10');

    if (!movies || movies.length === 0) {
      track.innerHTML = `
        <div class="featured-card" style="text-align:center;padding:40px;background:#1a1a2e;border-radius:12px;">
          <div style="font-size:48px;margin-bottom:12px;">🎬</div>
          <h3 style="color:rgba(255,255,255,0.5);">Онцлох кино байхгүй байна</h3>
          <p style="color:rgba(255,255,255,0.3);font-size:13px;">Админ хэсгээр онцлох кино нэмнэ үү</p>
        </div>`;
      featuredMoviesData = [];
      buildDots();
      return;
    }

    featuredMoviesData = movies;
    track.innerHTML = movies.map(m => buildFeaturedCardFromMovie(m)).join('');
    buildDots();
    carouselIndex = 0;
    updateCarousel();
    startAuto();

  } catch (error) {
    console.error('loadFeaturedMovies error:', error);
    track.innerHTML = `
      <div class="featured-card" style="text-align:center;padding:40px;background:#1a1a2e;border-radius:12px;">
        <div style="font-size:48px;margin-bottom:12px;">⚠️</div>
        <h3 style="color:#e63946;">Алдаа гарлаа</h3>
        <p style="color:rgba(255,255,255,0.3);font-size:13px;">Онцлох кино ачаалахад алдаа гарлаа</p>
      </div>`;
  }
}

function buildDots() {
  const total = Math.ceil(featuredMoviesData.length / getCardsVisible()) || 1;
  document.getElementById('carousel-dots').innerHTML = Array.from({ length: total }, (_, i) =>
    `<div class="dot${i === 0 ? ' active' : ''}" onclick="goToPage(${i})"></div>`
  ).join('');
}

function getCardWidth() {
  const c = document.querySelector('.featured-card');
  return c ? c.offsetWidth + 12 : 0;
}

function goToPage(p) {
  const total = Math.ceil(featuredMoviesData.length / getCardsVisible()) || 1;
  carouselIndex = Math.max(0, Math.min(p, total - 1));
  updateCarousel();
}

function nextPage() {
  const total = Math.ceil(featuredMoviesData.length / getCardsVisible()) || 1;
  carouselIndex = (carouselIndex + 1) % total;
  updateCarousel();
}

function prevPage() {
  const total = Math.ceil(featuredMoviesData.length / getCardsVisible()) || 1;
  carouselIndex = (carouselIndex - 1 + total) % total;
  updateCarousel();
}

function updateCarousel() {
  const cv = getCardsVisible();
  const track = document.getElementById('featured-track');
  const width = getCardWidth();
  track.style.transform = `translateX(-${carouselIndex * cv * width}px)`;
  document.querySelectorAll('.dot').forEach((d, i) => d.classList.toggle('active', i === carouselIndex));
  restartBar();
}

function restartBar() {
  const b = document.getElementById('carousel-bar');
  if (!b) return;
  b.classList.remove('running');
  void b.offsetWidth;
  b.classList.add('running');
}

function startAuto() {
  restartBar();
  clearInterval(carouselAuto);
  carouselAuto = setInterval(nextPage, AUTO_INTERVAL);
}

function resetAuto() {
  clearInterval(carouselAuto);
  startAuto();
}

function initCarousel() {
  loadFeaturedMovies();

  document.getElementById('carousel-prev').onclick = () => { prevPage(); resetAuto(); };
  document.getElementById('carousel-next').onclick = () => { nextPage(); resetAuto(); };

  let tx = 0;
  const w = document.getElementById('featured-wrapper');
  w.addEventListener('touchstart', e => { tx = e.touches[0].clientX; }, { passive: true });
  w.addEventListener('touchend', e => {
    const d = tx - e.changedTouches[0].clientX;
    if (Math.abs(d) > 50) { d > 0 ? nextPage() : prevPage(); resetAuto(); }
  }, { passive: true });

  window.addEventListener('resize', () => { buildDots(); updateCarousel(); });
}

// ===== MCAT =====
function setActiveMcat(el) {
  document.querySelectorAll('.mcat-card').forEach(c => c.classList.remove('selected'));
  el.classList.add('selected');
}

function showAll(el) {
  setActiveMcat(el);
  closeMcatDropdown();
  document.getElementById('news-category-label').textContent = 'Бүгд';
  loadMovies('');
  loadNews();
  setTimeout(() => goSection('movies'), 100);
}

function showMoviesOnly(el) {
  setActiveMcat(el);
  closeMcatDropdown();
  document.getElementById('news-category-label').textContent = 'Кино';
  loadMovies('');
  setTimeout(() => goSection('movies'), 100);
}

// ===== MCAT MENUS =====
const MCAT_MENUS = {
  'Сургалт': [
    { label: 'Бүгд', cat: '' },
    { label: 'VN + Capcut сургалт', cat: 'VN Capcut' },
    { label: 'AI Веб хөгжүүлэлт', cat: 'AI Веб' },
    { label: 'YouTube суваг хэрхэн өсгөх вэ?', cat: 'YouTube' },
    { label: 'Дата анализ үндэс', cat: 'Дата анализ' },
    { label: 'AI агент бүтээх', cat: 'AI агент' },
    { label: 'Олон улсын онлайн худалдаа', cat: 'Олон улсын худалдаа' }
  ],
  'Программ': [
    { label: 'Бүгд', cat: '' },
    { label: 'Татаж авах програм', cat: 'Татаж авах' },
    { label: 'Онлайн програм', cat: 'Онлайн програм' },
    { label: 'Mobile app', cat: 'Mobile app' }
  ],
  'Зар мэдээ': [
    { label: 'Бүгд', cat: '' },
    { label: 'Үл хөдлөх', cat: 'Үл хөдлөх' },
    { label: 'Ажлын зар', cat: 'Ажлын зар' },
    { label: 'Тээврийн хэрэгсэл', cat: 'Тээвэр' },
    { label: 'Бараа', cat: 'Бараа' },
    { label: 'Үйлчилгээ', cat: 'Үйлчилгээ' }
  ],
  'Е-Худалдаа': [
    { label: 'Бүгд', cat: '' },
    { label: 'Цахим дэлгүүр', cat: 'Цахим дэлгүүр' },
    { label: 'Бараа', cat: 'Бараа' },
    { label: 'Үйлчилгээ', cat: 'Үйлчилгээ' },
    { label: 'Олон улсын худалдаа', cat: 'Олон улсын худалдаа' }
  ],
  'Аялал': [
    { label: 'Бүгд', cat: '' },
    { label: 'Миний аялал', cat: 'Миний аялал' },
    { label: 'Монгол аялал', cat: 'Монгол аялал' },
    { label: 'Гадаад аялал', cat: 'Гадаад аялал' }
  ],
  'Шинжлэх ухаан': [
    { label: 'Бүгд', cat: '' },
    { label: 'Шинэ нээлт', cat: 'Шинэ нээлт' },
    { label: 'Ирээдүй', cat: 'Ирээдүй' },
    { label: 'Туршилт', cat: 'Туршилт' }
  ],
  'AI мэдлэг': [
    { label: 'Бүгд', cat: '' },
    { label: 'Шинэ мэдээ', cat: 'Шинэ мэдээ' },
    { label: 'Хэрэгсэл', cat: 'Хэрэгсэл' },
    { label: 'Сургалт', cat: 'Сургалт' }
  ],
  'Кино түүх': [
    { label: 'Бүгд', cat: '' },
    { label: 'Монгол кино түүх', cat: 'Монгол кино түүх' },
    { label: 'Гадаад кино түүх', cat: 'Гадаад кино түүх' }
  ],
  'Танин мэдэхүй': [
    { label: 'Бүгд', cat: '' },
    { label: 'Дэлхийг танья', cat: 'Дэлхийг танья' },
    { label: 'Гайхамшиг', cat: 'Гайхамшиг' },
    { label: 'Зөвлөгөө', cat: 'Зөвлөгөө' }
  ],
  'Одод ертөнц': [
    { label: 'Бүгд', cat: '' },
    { label: 'Харь гараг', cat: 'Харь гараг' },
    { label: 'Манай ертөнц', cat: 'Манай ертөнц' }
  ],
  'Мэдээ': [
    { label: 'Бүгд', cat: '' },
    { label: 'Монгол мэдээ', cat: 'Монгол мэдээ' },
    { label: 'Дэлхийн мэдээ', cat: 'Дэлхийн мэдээ' },
    { label: 'Улс төр', cat: 'Улс төр' },
    { label: 'Сурвалжилга', cat: 'Сурвалжилга' }
  ]
};

let currentMainCategory = '';

function openMcatDropdown(card, menuKey) {
  setActiveMcat(card);
  currentMainCategory = menuKey;
  document.getElementById('news-category-label').textContent = menuKey;

  const items = MCAT_MENUS[menuKey] || [];
  document.getElementById('news-filter-tabs').innerHTML = items.map((item, i) =>
    `<button class="news-filter-btn${i === 0 ? ' active' : ''}" onclick="handleMcatSub('${item.cat}', this, '${menuKey}')">${item.label}</button>`
  ).join('');

  // Эхний "Бүгд" товчийг автоматаар дарах
  handleMcatSub('', document.querySelector('.news-filter-btn'), menuKey);
  setTimeout(() => goSection('news'), 150);
}

function closeMcatDropdown() {
  document.getElementById('news-filter-tabs').innerHTML = '';
}

function handleMcatSub(cat, btn, mainKey) {
  document.querySelectorAll('.news-filter-btn').forEach(b => b.classList.remove('active'));
  if (btn) btn.classList.add('active');

  const label = btn ? btn.textContent.trim() : 'Бүгд';
  if (label === 'Бүгд') {
    document.getElementById('news-category-label').textContent = mainKey;
    loadNewsByMainCategory(mainKey);
  } else {
    document.getElementById('news-category-label').textContent = mainKey + ' › ' + label;
    loadNewsBySubCategory(cat);
  }
}

// ===== МЭДЭЭ — SUPABASE =====
// Мэдээний хүснэгтийн баганыг шалгах: category болон sub_category
async function loadNewsByMainCategory(mainCategory) {
  const list = document.getElementById('news-list');
  list.innerHTML = '<div class="loading" style="text-align:center;padding:30px;color:rgba(255,255,255,0.3);">📰 Ачааллаж байна...</div>';

  try {
    const subCats = (MCAT_MENUS[mainCategory] || []).map(item => item.cat).filter(c => c);

    let allNews = [];
    if (subCats.length > 0) {
      // sub_category-д тохирох мэдээнүүдийг татна
      // Supabase-д OR filter ашиглана
      const filterStr = subCats.map(c => `sub_category.eq.${encodeURIComponent(c)}`).join(',');
      allNews = await supaFetch('news', `or=(${filterStr})&order=created_at.desc&limit=100`);

      // Хэрэв sub_category байхгүй бол category баганаар хайна
      if (!allNews || allNews.length === 0) {
        const filterStr2 = subCats.map(c => `category.eq.${encodeURIComponent(c)}`).join(',');
        allNews = await supaFetch('news', `or=(${filterStr2})&order=created_at.desc&limit=100`);
      }
    }

    // Аль нэгэнд ч олдоогүй бол бүх мэдээнаас category-аар хайна
    if (!allNews || allNews.length === 0) {
      const raw = await supaFetch('news', 'order=created_at.desc&limit=100');
      allNews = raw.filter(n =>
        subCats.includes(n.sub_category) ||
        subCats.includes(n.category) ||
        n.category === mainCategory
      );
    }

    if (!allNews || allNews.length === 0) {
      list.innerHTML = `<div class="empty-state"><div class="icon">📰</div><p>"${mainCategory}" ангилалд мэдээ байхгүй байна</p></div>`;
      document.getElementById('news-pagination').innerHTML = '';
      return;
    }
    renderNewsList(allNews);
  } catch (e) {
    console.error('loadNewsByMainCategory error:', e);
    list.innerHTML = '<div class="empty-state"><p>Алдаа гарлаа</p></div>';
  }
}

async function loadNewsBySubCategory(subCategory) {
  const list = document.getElementById('news-list');
  list.innerHTML = '<div class="loading" style="text-align:center;padding:30px;color:rgba(255,255,255,0.3);">📰 Ачааллаж байна...</div>';

  try {
    // Эхлээд sub_category-аар хайна
    let news = await supaFetch('news', `sub_category=eq.${encodeURIComponent(subCategory)}&order=created_at.desc&limit=100`);

    // Байхгүй бол category-аар хайна
    if (!news || news.length === 0) {
      news = await supaFetch('news', `category=eq.${encodeURIComponent(subCategory)}&order=created_at.desc&limit=100`);
    }

    if (!news || news.length === 0) {
      list.innerHTML = `<div class="empty-state"><div class="icon">📰</div><p>"${subCategory}" ангилалд мэдээ байхгүй байна</p></div>`;
      document.getElementById('news-pagination').innerHTML = '';
      return;
    }
    renderNewsList(news);
  } catch (e) {
    console.error('loadNewsBySubCategory error:', e);
    list.innerHTML = '<div class="empty-state"><p>Алдаа гарлаа</p></div>';
  }
}

function renderNewsList(news) {
  const list = document.getElementById('news-list');
  if (!news || news.length === 0) {
    list.innerHTML = '<div class="empty-state"><div class="icon">📰</div><p>Мэдээ байхгүй байна</p></div>';
    return;
  }
  list.innerHTML = news.map(item => `
    <div class="news-card" onclick="location.href='news-detail.html?id=${item.id}'">
      <div class="news-img">
        ${item.thumbnail
          ? `<img src="${sanitize(item.thumbnail)}" alt="${sanitize(item.title || '')}" loading="lazy" onerror="this.style.display='none'">`
          : '<span class="n-emoji">📰</span>'
        }
      </div>
      <div class="news-body">
        <span class="news-cat">${sanitize(item.category || item.sub_category || 'Мэдээ')}</span>
        <h3 class="news-title">${sanitize(item.title || '')}</h3>
        <div class="news-foot">
          <span class="news-date">${item.created_at ? new Date(item.created_at).toLocaleDateString('mn-MN') : ''}</span>
          <span class="news-views">👁 ${item.views || 0}</span>
        </div>
      </div>
    </div>
  `).join('');
}

async function loadNews() {
  const list = document.getElementById('news-list');
  list.innerHTML = '<div class="loading" style="text-align:center;padding:30px;color:rgba(255,255,255,0.3);">📰 Ачааллаж байна...</div>';
  try {
    const news = await supaFetch('news', 'order=created_at.desc&limit=100');
    if (!news || news.length === 0) {
      list.innerHTML = '<div class="empty-state"><div class="icon">📰</div><p>Мэдээ байхгүй байна</p></div>';
      return;
    }
    renderNewsList(news);
  } catch (e) {
    console.error('loadNews error:', e);
    list.innerHTML = '<div class="empty-state"><p>Алдаа гарлаа</p></div>';
  }
}

// ===== MOVIES =====
let allMovies = [];
let moviePage = 1;
const MOVIES_PER_PAGE = 4;

function buildSkeletons(n = 4) {
  return Array(n).fill(0).map(() =>
    `<div class="skel-card skeleton"><div class="skel-img skeleton"></div><div class="skel-body"><div class="skel-line skeleton"></div><div class="skel-line short skeleton"></div></div></div>`
  ).join('');
}

let currentGenre = '';

function selCat(el, genre) {
  document.querySelectorAll('.cat-btn').forEach(b => {
    b.classList.remove('on');
    b.setAttribute('aria-selected', 'false');
  });
  el.classList.add('on');
  el.setAttribute('aria-selected', 'true');
  currentGenre = genre;
  moviePage = 1;
  loadMovies(genre);
}

async function loadMovies(genre = '') {
  const list = document.getElementById('movies-list');
  list.innerHTML = buildSkeletons(4);
  try {
    let params = 'order=created_at.desc&limit=100';
    if (genre) params += `&genre=eq.${encodeURIComponent(genre)}`;
    const movies = await supaFetch('movies', params);
    if (!movies || movies.length === 0) {
      list.innerHTML = `<div class="empty-state"><div class="icon">🎬</div><p>Кино байхгүй байна</p></div>`;
      document.getElementById('movie-pagination').innerHTML = '';
      return;
    }
    allMovies = movies;
    moviePage = 1;
    renderMoviePage();
  } catch (error) {
    console.error('loadMovies error:', error);
    list.innerHTML = `<div class="empty-state"><div class="icon">⚠️</div><p>Алдаа гарлаа</p></div>`;
  }
}

function renderMoviePage() {
  const list = document.getElementById('movies-list');
  const totalPages = Math.ceil(allMovies.length / MOVIES_PER_PAGE) || 1;
  const start = (moviePage - 1) * MOVIES_PER_PAGE;
  const end = start + MOVIES_PER_PAGE;
  const pageMovies = allMovies.slice(start, end);

  if (pageMovies.length === 0) {
    list.innerHTML = `<div class="empty-state"><div class="icon">🎬</div><p>Кино байхгүй байна</p></div>`;
  } else {
    list.innerHTML = pageMovies.map(m => buildMovieCard(m)).join('');
  }
  renderMoviePagination(totalPages);
}

function buildMovieCard(m) {
  const title = sanitize(m.title);
  const g = sanitize(m.genre);
  const id = encodeURIComponent(sanitize(m.id));
  const likes = parseInt(m.likes) || 0;
  const views = parseInt(m.views) || 0;
  const cls = genreColors[m.genre] || 'cp-sci';
  const bg = genreGradients[m.genre] || 'linear-gradient(135deg,#1a0a2e,#3b1f6b)';
  const thumb = m.thumbnail
    ? `<img src="${sanitize(m.thumbnail)}" alt="${title}" loading="lazy" onerror="this.style.display='none'">`
    : '🎬';
  return `<article class="grid-card" role="listitem" tabindex="0" onclick="location.href='movie.html?id=${id}'" aria-label="${title}">
    <div class="grid-img" style="background:${bg}">${thumb}<span class="grid-badge ${cls}">${g || 'Кино'}</span></div>
    <div class="grid-body">
      <h3 class="grid-title">${title}</h3>
      <div class="grid-meta">Кино Эзэн</div>
      <div class="grid-stats">
        <button class="gstat" onclick="event.stopPropagation();toggleLike(this)">❤️ <span>${likes}</span></button>
        <span class="gstat">👁 <span>${views}</span></span>
      </div>
    </div>
  </article>`;
}

function renderMoviePagination(totalPages) {
  const container = document.getElementById('movie-pagination');
  if (totalPages <= 1) { container.innerHTML = ''; return; }
  let html = `<button onclick="moviePage=1;renderMoviePage()" ${moviePage===1?'disabled':''}>«</button>`;
  for (let i = 1; i <= totalPages; i++) {
    html += `<button class="page-num ${i===moviePage?'active':''}" onclick="moviePage=${i};renderMoviePage()">${i}</button>`;
  }
  html += `<button onclick="moviePage=${totalPages};renderMoviePage()" ${moviePage===totalPages?'disabled':''}>»</button>`;
  container.innerHTML = html;
}

// ===== SEARCH =====
function searchMovies() {
  const q = document.getElementById('search-input').value.trim();
  if (!q) { loadMovies(currentGenre); return; }
  const list = document.getElementById('movies-list');
  list.innerHTML = buildSkeletons(4);
  supaFetch('movies', `title=ilike.*${encodeURIComponent(q)}*&limit=100`).then(movies => {
    if (!movies || movies.length === 0) {
      list.innerHTML = `<div class="empty-state"><div class="icon">🔍</div><p>"${sanitize(q)}" олдсонгүй</p></div>`;
      document.getElementById('movie-pagination').innerHTML = '';
      return;
    }
    allMovies = movies;
    moviePage = 1;
    renderMoviePage();
  }).catch(() => {
    list.innerHTML = '<div class="empty-state"><p>Алдаа гарлаа</p></div>';
  });
}

// ===== TOGGLE LIKE =====
function toggleLike(btn) {
  const isLiked = btn.classList.toggle('liked');
  const c = btn.querySelector('span');
  const cur = parseInt(c.textContent) || 0;
  c.textContent = isLiked ? cur + 1 : Math.max(0, cur - 1);
  showToast(isLiked ? '❤️ Дуртай жагсаалтад нэмлээ' : '💔 Дуртай жагсаалтаас хаслаа');
}

function showToast(msg) {
  const old = document.querySelector('.toast');
  if (old) old.remove();
  const t = document.createElement('div');
  t.className = 'toast';
  t.textContent = msg;
  t.setAttribute('role', 'status');
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 2500);
}

function goSection(id) {
  const el = document.getElementById(id);
  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// ===== SECRET ADMIN =====
(function () {
  let clickCount = 0;
  let clickTimer = null;
  const CLICK_TIMEOUT = 2000;
  const SECRET_KEY = 'kinoezen2026';

  document.addEventListener('click', function (e) {
    if (!e.target.closest('#secret-admin-trigger')) return;
    clickCount++;
    clearTimeout(clickTimer);
    clickTimer = setTimeout(() => { clickCount = 0; }, CLICK_TIMEOUT);

    if (clickCount === 3) {
      clickCount = 0;
      clearTimeout(clickTimer);
      showSecretToast('🔐 Админ руу шилжиж байна...');
      setTimeout(() => {
        const pass = prompt('🔑 Админ түлхүүр оруулна уу:');
        if (pass === SECRET_KEY) {
          window.location.href = 'admin.html';
        } else if (pass !== null) {
          showSecretToast('❌ Түлхүүр буруу байна!');
        }
      }, 500);
    }
  });

  function showSecretToast(msg) {
    const old = document.querySelector('.secret-toast');
    if (old) old.remove();
    const t = document.createElement('div');
    t.className = 'secret-toast';
    t.textContent = msg;
    t.style.cssText = `
      position:fixed;bottom:120px;left:50%;transform:translateX(-50%);
      background:rgba(0,0,0,0.85);color:#4ade80;padding:12px 24px;
      border-radius:12px;font-size:14px;font-weight:600;
      font-family:'Nunito',sans-serif;z-index:9999;
      border:1px solid rgba(74,222,128,0.3);
      box-shadow:0 8px 32px rgba(0,0,0,0.5);
      backdrop-filter:blur(12px);transition:all 0.3s;pointer-events:none;
    `;
    document.body.appendChild(t);
    setTimeout(() => {
      t.style.opacity = '0';
      t.style.transform = 'translateX(-50%) translateY(20px)';
      setTimeout(() => t.remove(), 400);
    }, 1500);
  }

  console.log('%c🔐 Кино Эзэн — Footer дээр 3 товшиход админ нээгдэнэ', 'font-size:14px;color:#4ade80;font-weight:bold;');
})();

// ===== NAV TOGGLE =====
function toggleNav() {
  const nav = document.getElementById('nav-links');
  const right = document.getElementById('nav-right');
  if (nav) nav.classList.toggle('open');
  if (right) right.classList.toggle('open');
}

function toggleMobileSearch() {
  const bar = document.getElementById('mobile-search-bar');
  if (bar) bar.classList.toggle('open');
}

// ===== INIT =====
document.addEventListener('DOMContentLoaded', function () {
  setDate();
  initCarousel();
  loadMovies();
  loadNews();
  loadAd();
  loadWeather();
});
