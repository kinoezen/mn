// ===== NAVBAR.JS — КиноЭзэн навигац, хайлт, цаг агаар =====

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
