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

// ===== NAVBAR DROPDOWN — зөвхөн дээд цэс (Мэдээ гэх мэт) =====
const DROPDOWN_MENUS = {
  'Мэдээ': [
    { label: 'Бүгд', cat: '' },
    { label: 'Монголын мэдээ', cat: 'Монголын мэдээ' },
    { label: 'Дэлхийн мэдээ', cat: 'Дэлхийн мэдээ' },
    { label: 'Улс төр', cat: 'Улс төр' },
    { label: 'Эдийн засаг', cat: 'Эдийн засаг' },
    { label: 'Сурвалжилга', cat: 'Сурвалжилга' },
  ],
};

function buildDropdowns() {
  const navLinks = document.getElementById('nav-links');
  if (!navLinks) return;

  navLinks.querySelectorAll('a').forEach(link => {
    const text = link.textContent.trim();
    if (DROPDOWN_MENUS[text]) {
      link.classList.add('has-dropdown');
      link.setAttribute('aria-haspopup', 'true');
      link.setAttribute('aria-expanded', 'false');

      const dropdown = document.createElement('div');
      dropdown.className = 'nav-dropdown';
      dropdown.innerHTML = DROPDOWN_MENUS[text].map(item =>
        `<a class="nav-dropdown-item" href="#" onclick="handleDropdownClick(event,'${text}','${item.cat}')">${item.label}</a>`
      ).join('');

      const wrapper = document.createElement('div');
      wrapper.className = 'nav-dropdown-wrap';
      link.parentNode.insertBefore(wrapper, link);
      wrapper.appendChild(link);
      wrapper.appendChild(dropdown);
    }
  });
}

function handleDropdownClick(e, menuName, cat) {
  e.preventDefault();
  e.stopPropagation();
  if (typeof renderNews === 'function') renderNews(cat);
  const newsSection = document.getElementById('news');
  setTimeout(() => {
    if (newsSection) newsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, 100);
  closeAllDropdowns();
}

function closeAllDropdowns() {
  document.querySelectorAll('.nav-dropdown').forEach(d => d.classList.remove('show'));
  document.querySelectorAll('.has-dropdown').forEach(a => a.setAttribute('aria-expanded', 'false'));
}

document.addEventListener('DOMContentLoaded', () => {
  buildDropdowns();

  // Desktop: hover
  document.querySelectorAll('.nav-dropdown-wrap').forEach(wrap => {
    wrap.addEventListener('mouseenter', () => wrap.querySelector('.nav-dropdown').classList.add('show'));
    wrap.addEventListener('mouseleave', () => wrap.querySelector('.nav-dropdown').classList.remove('show'));
  });

  // Mobile: click
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

  // Гадна дарахад хаах
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.nav-dropdown-wrap')) closeAllDropdowns();
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

// BOTTOM NAV active
(function () {
  const path = location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.mbn-item').forEach(a => {
    a.classList.remove('active');
    const href = a.getAttribute('href');
    if (href === path || (path === '' && href === 'index.html')) a.classList.add('active');
  });
})();
