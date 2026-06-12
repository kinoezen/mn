// ===== NAVBAR.JS — КиноЭзэн навигац, dropdown, хайлт, цаг агаар =====

// DATE
const now = new Date();
const dateEl = document.getElementById('today-date');
if (dateEl) dateEl.textContent = now.getFullYear() + '.' + String(now.getMonth() + 1).padStart(2, '0') + '.' + String(now.getDate()).padStart(2, '0');

// WEATHER
const WMN = {
  'Sunny': 'Нартай', 'Clear': 'Цэлмэг', 'Partly cloudy': 'Үүлэрхэг',
  'Cloudy': 'Бүрхэг', 'Overcast': 'Бүрхэг', 'Mist': 'Манантай',
  'Fog': 'Манантай', 'Light rain': 'Бага бороо', 'Moderate rain': 'Бороо',
  'Heavy rain': 'Их бороо', 'Light snow': 'Бага цас',
  'Moderate snow': 'Цас', 'Heavy snow': 'Их цас'
};
async function loadWeather() {
  const el = document.getElementById('weather-temp');
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 6000);
    const res = await fetch('https://wttr.in/Ulaanbaatar?format=j1', { signal: ctrl.signal });
    clearTimeout(t);
    if (!res.ok) throw new Error();
    const data = await res.json();
    const temp = data.current_condition[0].temp_C;
    const descEn = data.current_condition[0].weatherDesc[0].value;
    if (el) el.textContent = `${temp}°C · ${WMN[descEn] || descEn}`;
  } catch {
    if (el) el.textContent = '—';
  }
}
loadWeather();

// ===== DROPDOWN ЦЭСИЙН БҮТЭЦ =====
const DROPDOWN_MENUS = {
  'Мэдээ': [
    { label: 'Бүгд', cat: '' },
    { label: 'Монголын мэдээ', cat: 'Монголын мэдээ' },
    { label: 'Дэлхийн мэдээ', cat: 'Дэлхийн мэдээ' },
    { label: 'Улс төр', cat: 'Улс төр' },
    { label: 'Эдийн засаг', cat: 'Эдийн засаг' },
    { label: 'Сурвалжилга', cat: 'Сурвалжилга' },
  ],
  'Одод ертөнц': [
    { label: 'Бүгд', cat: '' },
    { label: 'Харь гараг', cat: 'Харь гараг' },
    { label: 'Манай ертөнц', cat: 'Манай ертөнц' },
  ],
  'Аялал': [
    { label: 'Бүгд', cat: '' },
    { label: 'Миний аялал', cat: 'Миний аялал' },
    { label: 'Монгол аялал', cat: 'Монгол аялал' },
    { label: 'Гадаад аялал', cat: 'Гадаад аялал' },
  ],
  'Шинжлэх ухаан': [
    { label: 'Бүгд', cat: '' },
    { label: 'Шинэ нээлт', cat: 'Шинэ нээлт' },
    { label: 'Ирээдүй', cat: 'Ирээдүй' },
    { label: 'Туршилт', cat: 'Туршилт' },
  ],
  'Кино түүх': [
    { label: 'Бүгд', cat: '' },
    { label: 'Монгол кино түүх', cat: 'Монгол кино түүх' },
    { label: 'Гадаад кино түүх', cat: 'Гадаад кино түүх' },
  ],
  'Танин мэдэхүй': [
    { label: 'Бүгд', cat: '' },
    { label: 'Дэлхийг танья', cat: 'Дэлхийг танья' },
    { label: 'Гайхамшиг', cat: 'Гайхамшиг' },
    { label: 'Зөвлөгөө', cat: 'Зөвлөгөө' },
  ],
  'AI': [
    { label: 'Бүгд', cat: '' },
    { label: 'Шинэ мэдээ', cat: 'Шинэ мэдээ' },
    { label: 'Хэрэгсэл', cat: 'Хэрэгсэл' },
    { label: 'Сургалт', cat: 'Сургалт' },
  ],
};

// ===== DROPDOWN ҮҮСГЭХ =====
function buildDropdowns() {
  // Дээд navbar-ийн цэс дээр dropdown нэмэх
  const navLinks = document.getElementById('nav-links');
  if (!navLinks) return;

  // Мэдээ линк дээр dropdown нэмэх
  navLinks.querySelectorAll('a').forEach(link => {
    const text = link.textContent.trim();
    if (DROPDOWN_MENUS[text]) {
      link.classList.add('has-dropdown');
      link.setAttribute('aria-haspopup', 'true');
      link.setAttribute('aria-expanded', 'false');

      const dropdown = document.createElement('div');
      dropdown.className = 'nav-dropdown';
      dropdown.innerHTML = DROPDOWN_MENUS[text].map(item =>
        `<a class="nav-dropdown-item" href="#" onclick="handleDropdownClick(event,'${text}','${item.cat}','${item.label}')">${item.label}</a>`
      ).join('');

      const wrapper = document.createElement('div');
      wrapper.className = 'nav-dropdown-wrap';
      link.parentNode.insertBefore(wrapper, link);
      wrapper.appendChild(link);
      wrapper.appendChild(dropdown);
    }
  });

  // Ангилал grid дээр dropdown нэмэх (mcat cardууд)
  buildMcatDropdowns();
}

// ===== АНГИЛАЛ GRID DROPDOWN =====
function buildMcatDropdowns() {
  const mcatMap = {
    'mcat-news': 'Мэдээ',
    'mcat-travel': 'Аялал',
    'mcat-science': 'Шинжлэх ухаан',
    'mcat-ai': 'AI',
    'mcat-history': 'Кино түүх',
    'mcat-knowledge': 'Танин мэдэхүй',
    'mcat-stars': 'Одод ертөнц',
  };

  Object.entries(mcatMap).forEach(([cls, menuKey]) => {
    const card = document.querySelector('.' + cls);
    if (!card || !DROPDOWN_MENUS[menuKey]) return;

    // Өмнөх onclick-ийг солих
    card.onclick = (e) => {
      e.stopPropagation();
      openMcatDropdown(card, menuKey);
    };
  });
}

// ===== MCAT DROPDOWN PANEL =====
function openMcatDropdown(card, menuKey) {
  // Аль хэдийн нээлттэй бол хааx
  const existing = document.getElementById('mcat-dropdown-panel');
  if (existing) {
    const isOpen = existing.dataset.menu === menuKey && existing.classList.contains('open');
    closeMcatDropdown();
    if (isOpen) return;
  }

  setActiveMcat(card);

  const items = DROPDOWN_MENUS[menuKey];
  const panel = document.createElement('div');
  panel.id = 'mcat-dropdown-panel';
  panel.className = 'mcat-dropdown-panel open';
  panel.dataset.menu = menuKey;

  panel.innerHTML = `
    <div class="mcat-dp-header">
      <span class="mcat-dp-title">${menuKey}</span>
      <button class="mcat-dp-close" onclick="closeMcatDropdown()">✕</button>
    </div>
    <div class="mcat-dp-items">
      ${items.map(item =>
        `<button class="mcat-dp-item" onclick="handleMcatSubClick('${menuKey}','${item.cat}','${item.label}',this)">
          ${item.label}
        </button>`
      ).join('')}
    </div>
  `;

  // Ангилал grid-ийн доор оруулах
  const grid = document.getElementById('main-cats-grid');
  if (grid) grid.insertAdjacentElement('afterend', panel);

  // Гадна дарахад хаах
  setTimeout(() => {
    document.addEventListener('click', closeMcatDropdownOutside);
  }, 100);
}

function closeMcatDropdownOutside(e) {
  if (!e.target.closest('#mcat-dropdown-panel') && !e.target.closest('.mcat-card')) {
    closeMcatDropdown();
  }
}

function closeMcatDropdown() {
  const panel = document.getElementById('mcat-dropdown-panel');
  if (panel) panel.remove();
  document.removeEventListener('click', closeMcatDropdownOutside);
}

// ===== DROPDOWN ТОВЧ ДАРАХ =====
function handleDropdownClick(e, menuName, cat, label) {
  e.preventDefault();
  e.stopPropagation();

  // Мэдээний хэсэг рүү шилжих
  const newsSection = document.getElementById('news');
  const moviesSection = document.getElementById('movies');
  const genreSection = document.getElementById('movie-genre-section');

  if (newsSection) newsSection.style.display = '';
  if (moviesSection) moviesSection.style.display = 'none';
  if (genreSection) genreSection.style.display = 'none';

  // News filter
  if (typeof renderNews === 'function') renderNews(cat);

  // Scroll
  setTimeout(() => {
    if (newsSection) newsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, 100);

  // Dropdown хаах
  closeAllDropdowns();
}

function handleMcatSubClick(menuName, cat, label, btn) {
  // Active болгох
  document.querySelectorAll('.mcat-dp-item').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');

  // Мэдээний хэсэг харуулах
  const newsSection = document.getElementById('news');
  const moviesSection = document.getElementById('movies');
  const genreSection = document.getElementById('movie-genre-section');

  if (newsSection) newsSection.style.display = '';
  if (moviesSection) moviesSection.style.display = 'none';
  if (genreSection) genreSection.style.display = 'none';

  if (typeof renderNews === 'function') renderNews(cat);

  setTimeout(() => {
    if (newsSection) newsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, 150);
}

// ===== DROPDOWN НЭЭХ/ХААХ =====
function closeAllDropdowns() {
  document.querySelectorAll('.nav-dropdown').forEach(d => d.classList.remove('show'));
  document.querySelectorAll('.has-dropdown').forEach(a => a.setAttribute('aria-expanded', 'false'));
}

// Hover болон click хоёуланд ажиллах
document.addEventListener('DOMContentLoaded', () => {
  buildDropdowns();

  // Desktop: hover-оор нээх
  document.querySelectorAll('.nav-dropdown-wrap').forEach(wrap => {
    wrap.addEventListener('mouseenter', () => {
      wrap.querySelector('.nav-dropdown').classList.add('show');
    });
    wrap.addEventListener('mouseleave', () => {
      wrap.querySelector('.nav-dropdown').classList.remove('show');
    });
  });

  // Mobile: click-ээр нээх
  document.querySelectorAll('.has-dropdown').forEach(link => {
    link.addEventListener('click', (e) => {
      if (window.innerWidth <= 768) {
        e.preventDefault();
        const dropdown = link.nextElementSibling;
        const isOpen = dropdown.classList.toggle('show');
        link.setAttribute('aria-expanded', isOpen);
      }
    });
  });

  // Гадна дарахад dropdown хаах
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.nav-dropdown-wrap')) {
      closeAllDropdowns();
    }
  });
});

// NAV TOGGLE (mobile)
let navOpen = false;
function toggleNav() {
  navOpen = !navOpen;
  document.getElementById('nav-links').classList.toggle('open', navOpen);
  document.getElementById('nav-right').classList.toggle('open', navOpen);
  const t = document.getElementById('nav-toggle');
  t.textContent = navOpen ? '✕' : '☰';
  t.setAttribute('aria-expanded', navOpen);
}
document.addEventListener('click', e => {
  if (navOpen && !e.target.closest('.nav')) {
    navOpen = false;
    document.getElementById('nav-links').classList.remove('open');
    document.getElementById('nav-right').classList.remove('open');
    document.getElementById('nav-toggle').textContent = '☰';
  }
});

// MOBILE SEARCH
let mobileSearchOpen = false;
function toggleMobileSearch() {
  mobileSearchOpen = !mobileSearchOpen;
  const bar = document.getElementById('mobile-search-bar');
  bar.classList.toggle('open', mobileSearchOpen);
  if (mobileSearchOpen) setTimeout(() => document.getElementById('mobile-search-input').focus(), 80);
}
document.addEventListener('DOMContentLoaded', () => {
  const msi = document.getElementById('mobile-search-input');
  if (msi) msi.addEventListener('input', () => {
    const dsi = document.getElementById('search-input');
    if (dsi) dsi.value = msi.value;
    if (typeof searchMovies === 'function') searchMovies();
  });
});

// BOTTOM NAV active highlight
(function () {
  const path = location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.mbn-item').forEach(a => {
    a.classList.remove('active');
    const href = a.getAttribute('href');
    if (href === path || (path === '' && href === 'index.html')) a.classList.add('active');
  });
})();
