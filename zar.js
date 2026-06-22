/* ============================================================
   КИНО ЭЗЭН — "ЗАР МЭДЭЭ" МОДУЛЬ — JAVASCRIPT
   Бие даасан файл. script.js, navbar.js доторх юу ч өөрчлөхгүй.
   Бүх нэрс "Zar" / "zar" угтвартай — давтагдахгүй.
   ============================================================ */

(function () {
  'use strict';

  // Repo дотор script.js дээр аль хэдийн зарлагдсан тул дахин ашиглана.
  // Хэрэв ямар нэг шалтгаанаар олдохгүй бол fallback утга ашиглана.
  const ZAR_SUPABASE_URL = (typeof SUPABASE_URL !== 'undefined' && SUPABASE_URL)
    ? SUPABASE_URL
    : 'https://smncsxlbyyhowfarxxlz.supabase.co';
  const ZAR_SUPABASE_KEY = (typeof SUPABASE_KEY !== 'undefined' && SUPABASE_KEY)
    ? SUPABASE_KEY
    : 'sb_publishable_Zjr9q57fQ5ZV-BF0StnvJA_Z1U_7qHO';

  const ZAR_PAGE_SIZE = 12;
  const ZAR_MAX_IMAGES = 5;
  const ZAR_MAX_IMG_DIMENSION = 1280; // px — шахахдаа дээд хэмжээ
  const ZAR_JPEG_QUALITY = 0.72;

  let zarCategories = [];
  let zarActiveCategoryId = '';
  let zarCurrentPage = 0;
  let zarSelectedFiles = []; // { file: Blob, dataUrl: string }[]
  let zarCurrentListing = null;

  // ---------- Util ----------
  function zarSanitize(str) {
    if (!str) return '';
    const d = document.createElement('div');
    d.textContent = String(str);
    return d.innerHTML;
  }

  function zarGetToken() {
    return localStorage.getItem('sb_token') || '';
  }

  function zarGetUser() {
    try {
      return JSON.parse(localStorage.getItem('sb_user') || 'null');
    } catch (e) {
      return null;
    }
  }

  function zarIsLoggedIn() {
    return !!(zarGetToken() && zarGetUser());
  }

  function zarFormatPrice(listing) {
    if (listing.price_type === 'free') return 'Хайхдалаа';
    if (listing.price_type === 'negotiable' || !listing.price) return 'Үнэ тохирно';
    return Number(listing.price).toLocaleString('mn-MN') + '₮';
  }

  function zarTimeAgo(dateStr) {
    const diffMs = Date.now() - new Date(dateStr).getTime();
    const min = Math.floor(diffMs / 60000);
    if (min < 1) return 'Дөнгөж сая';
    if (min < 60) return min + ' мин өмнө';
    const hr = Math.floor(min / 60);
    if (hr < 24) return hr + ' цагийн өмнө';
    const day = Math.floor(hr / 24);
    if (day < 30) return day + ' өдрийн өмнө';
    return new Date(dateStr).toLocaleDateString('mn-MN');
  }

  // ---------- REST helpers (Supabase) ----------
  async function zarRestGet(table, params) {
    const headers = {
      apikey: ZAR_SUPABASE_KEY,
      Authorization: 'Bearer ' + (zarGetToken() || ZAR_SUPABASE_KEY)
    };
    const res = await fetch(ZAR_SUPABASE_URL + '/rest/v1/' + table + '?' + params, { headers });
    if (!res.ok) throw new Error('Хүсэлт амжилтгүй (' + res.status + ')');
    return res.json();
  }

  async function zarRestPost(table, body, opts) {
    const headers = {
      apikey: ZAR_SUPABASE_KEY,
      Authorization: 'Bearer ' + (zarGetToken() || ZAR_SUPABASE_KEY),
      'Content-Type': 'application/json',
      Prefer: 'return=representation'
    };
    const res = await fetch(ZAR_SUPABASE_URL + '/rest/v1/' + table, {
      method: 'POST',
      headers,
      body: JSON.stringify(body)
    });
    if (!res.ok) {
      const errBody = await res.text();
      throw new Error('Хадгалахад алдаа гарлаа: ' + errBody);
    }
    return res.json();
  }

  async function zarRestRpc(fnName, body) {
    const headers = {
      apikey: ZAR_SUPABASE_KEY,
      Authorization: 'Bearer ' + (zarGetToken() || ZAR_SUPABASE_KEY),
      'Content-Type': 'application/json'
    };
    return fetch(ZAR_SUPABASE_URL + '/rest/v1/rpc/' + fnName, {
      method: 'POST',
      headers,
      body: JSON.stringify(body || {})
    });
  }

  // ---------- Modal open/close ----------
  function zarOpenModal() {
    const overlay = document.getElementById('zar-overlay');
    if (!overlay) return;
    overlay.classList.add('zar-open');
    zarShowListView();
    if (zarCategories.length === 0) {
      zarLoadCategories();
    } else {
      zarLoadListings();
    }
  }

  function zarCloseModal() {
    const overlay = document.getElementById('zar-overlay');
    if (overlay) overlay.classList.remove('zar-open');
  }

  function zarShowListView() {
    document.getElementById('zar-list-view').style.display = '';
    document.getElementById('zar-form-wrap').classList.remove('zar-open');
    document.getElementById('zar-detail-wrap').classList.remove('zar-open');
  }

  function zarShowFormView() {
    if (!zarIsLoggedIn()) {
      zarShowLoginPrompt();
      return;
    }
    document.getElementById('zar-list-view').style.display = 'none';
    document.getElementById('zar-detail-wrap').classList.remove('zar-open');
    document.getElementById('zar-form-wrap').classList.add('zar-open');
    zarResetForm();
  }

  function zarShowDetailView(listing) {
    zarCurrentListing = listing;
    document.getElementById('zar-list-view').style.display = 'none';
    document.getElementById('zar-form-wrap').classList.remove('zar-open');
    document.getElementById('zar-detail-wrap').classList.add('zar-open');
    zarRenderDetail(listing);
    zarRestRpc('increment_listing_views', { listing_id: listing.id }).catch(function () {});
  }

  function zarShowLoginPrompt() {
    const body = document.getElementById('zar-body');
    const existing = document.getElementById('zar-login-toast');
    if (existing) return;
    const el = document.createElement('div');
    el.id = 'zar-login-toast';
    el.className = 'zar-login-prompt';
    el.innerHTML = 'Зар нийтлэхийн тулд эхлээд <a href="login.html">нэвтрэх</a> шаардлагатай.';
    body.prepend(el);
    setTimeout(function () {
      const t = document.getElementById('zar-login-toast');
      if (t) t.remove();
    }, 4000);
  }

  // ---------- Categories ----------
  async function zarLoadCategories() {
    const catsEl = document.getElementById('zar-cats');
    try {
      const data = await zarRestGet(
        'zar_categories',
        'is_active=eq.true&order=sort_order.asc&select=id,name,slug,icon'
      );
      zarCategories = data || [];
      zarRenderCategoryPills();
      zarLoadListings();
    } catch (e) {
      catsEl.innerHTML = '';
      zarLoadListings();
    }
  }

  function zarRenderCategoryPills() {
    const catsEl = document.getElementById('zar-cats');
    let html = '<button type="button" class="zar-cat-pill zar-active" data-cat-id="">Бүгд</button>';
    zarCategories.forEach(function (c) {
      html +=
        '<button type="button" class="zar-cat-pill" data-cat-id="' +
        zarSanitize(c.id) +
        '">' +
        zarSanitize(c.name) +
        '</button>';
    });
    catsEl.innerHTML = html;
    catsEl.querySelectorAll('.zar-cat-pill').forEach(function (btn) {
      btn.addEventListener('click', function () {
        catsEl.querySelectorAll('.zar-cat-pill').forEach(function (b) {
          b.classList.remove('zar-active');
        });
        btn.classList.add('zar-active');
        zarActiveCategoryId = btn.getAttribute('data-cat-id') || '';
        zarCurrentPage = 0;
        zarLoadListings();
      });
    });
  }

  function zarPopulateCategorySelect() {
    const sel = document.getElementById('zar-f-category');
    sel.innerHTML = zarCategories
      .map(function (c) {
        return '<option value="' + zarSanitize(c.id) + '">' + zarSanitize(c.name) + '</option>';
      })
      .join('');
  }

  // ---------- Listings ----------
  async function zarLoadListings() {
    const grid = document.getElementById('zar-grid');
    grid.innerHTML = '<div class="zar-loading">Ачааллаж байна...</div>';
    try {
      let params =
        'status=eq.active&order=is_featured.desc,created_at.desc&limit=' +
        ZAR_PAGE_SIZE +
        '&select=id,title,price,price_type,images,location,created_at,is_featured,category_id,zar_categories(name)';
      if (zarActiveCategoryId) {
        params += '&category_id=eq.' + encodeURIComponent(zarActiveCategoryId);
      }
      const listings = await zarRestGet('listings', params);
      zarRenderGrid(listings || []);
    } catch (e) {
      grid.innerHTML = '<div class="zar-empty">Зар ачааллахад алдаа гарлаа. Дахин оролдоно уу.</div>';
    }
  }

  function zarRenderGrid(listings) {
    const grid = document.getElementById('zar-grid');
    if (!listings || listings.length === 0) {
      grid.innerHTML = '<div class="zar-empty">Энэ ангилалд одоогоор зар байхгүй байна.<br>Хамгийн түрүүнд та нийтлээрэй!</div>';
      return;
    }
    grid.innerHTML = listings.map(zarBuildCardHtml).join('');
    grid.querySelectorAll('.zar-card').forEach(function (card, idx) {
      card.addEventListener('click', function () {
        zarShowDetailView(listings[idx]);
      });
    });
  }

  function zarBuildCardHtml(item) {
    const img = item.images && item.images[0];
    const catName = item.zar_categories ? item.zar_categories.name : '';
    const vipClass = item.is_featured ? ' zar-vip' : '';
    const vipBadge = item.is_featured ? '<span class="zar-vip-badge">VIP</span>' : '';
    const imgHtml = img
      ? '<img src="' + zarSanitize(img) + '" loading="lazy" alt="">'
      : '📷';
    return (
      '<div class="zar-card' +
      vipClass +
      '">' +
      vipBadge +
      '<div class="zar-card-img">' +
      imgHtml +
      '</div>' +
      '<div class="zar-card-body">' +
      (catName ? '<span class="zar-card-cat">' + zarSanitize(catName) + '</span>' : '') +
      '<p class="zar-card-title">' +
      zarSanitize(item.title) +
      '</p>' +
      '<p class="zar-card-price">' +
      zarFormatPrice(item) +
      '</p>' +
      '<div class="zar-card-foot">' +
      '<span>' +
      zarSanitize(item.location || '') +
      '</span>' +
      '<span>' +
      zarTimeAgo(item.created_at) +
      '</span>' +
      '</div>' +
      '</div>' +
      '</div>'
    );
  }

  // ---------- Detail view ----------
  function zarRenderDetail(item) {
    const wrap = document.getElementById('zar-detail-wrap');
    const catName = item.zar_categories ? item.zar_categories.name : '';
    const imgs = (item.images && item.images.length ? item.images : [])
      .map(function (src) {
        return '<img src="' + zarSanitize(src) + '" alt="">';
      })
      .join('');
    wrap.innerHTML =
      '<button type="button" class="zar-back-btn" id="zar-detail-back">← Буцах</button>' +
      (imgs ? '<div class="zar-detail-imgs">' + imgs + '</div>' : '') +
      '<h3 class="zar-detail-title">' +
      zarSanitize(item.title) +
      '</h3>' +
      '<p class="zar-detail-price">' +
      zarFormatPrice(item) +
      '</p>' +
      '<div class="zar-detail-meta">' +
      (catName ? '<span>🏷 ' + zarSanitize(catName) + '</span>' : '') +
      (item.location ? '<span>📍 ' + zarSanitize(item.location) + '</span>' : '') +
      '<span>🕐 ' +
      zarTimeAgo(item.created_at) +
      '</span>' +
      '<span>👁 ' +
      (item.views || 0) +
      '</span>' +
      '</div>' +
      '<p class="zar-detail-desc">' +
      zarSanitize(item.description || '') +
      '</p>' +
      '<div class="zar-detail-contact">' +
      '<span class="zar-detail-contact-phone">' +
      zarSanitize(item.phone || '') +
      '</span>' +
      '<a class="zar-call-btn" href="tel:' +
      zarSanitize(item.phone || '') +
      '">📞 Залгах</a>' +
      '</div>';
    const backBtn = document.getElementById('zar-detail-back');
    if (backBtn) backBtn.addEventListener('click', zarShowListView);
  }

  // ---------- Form: reset / images ----------
  function zarResetForm() {
    document.getElementById('zar-form').reset();
    zarSelectedFiles = [];
    zarPopulateCategorySelect();
    zarRenderImageSlots();
    const msg = document.getElementById('zar-form-msg');
    msg.classList.remove('zar-show', 'zar-success', 'zar-error');
  }

  function zarRenderImageSlots() {
    const wrap = document.getElementById('zar-img-upload');
    let html = '';
    zarSelectedFiles.forEach(function (item, i) {
      html +=
        '<div class="zar-img-slot">' +
        '<img src="' +
        item.dataUrl +
        '" alt="">' +
        '<button type="button" class="zar-img-remove" data-idx="' +
        i +
        '">✕</button>' +
        '</div>';
    });
    if (zarSelectedFiles.length < ZAR_MAX_IMAGES) {
      html +=
        '<label class="zar-img-slot" id="zar-img-add-slot">' +
        '+' +
        '<input type="file" accept="image/*" id="zar-img-input" style="display:none" multiple>' +
        '</label>';
    }
    wrap.innerHTML = html;

    wrap.querySelectorAll('.zar-img-remove').forEach(function (btn) {
      btn.addEventListener('click', function (e) {
        e.preventDefault();
        const idx = parseInt(btn.getAttribute('data-idx'), 10);
        zarSelectedFiles.splice(idx, 1);
        zarRenderImageSlots();
      });
    });

    const input = document.getElementById('zar-img-input');
    if (input) {
      input.addEventListener('change', zarHandleFileSelect);
    }
  }

  async function zarHandleFileSelect(e) {
    const files = Array.from(e.target.files || []);
    const remaining = ZAR_MAX_IMAGES - zarSelectedFiles.length;
    const toProcess = files.slice(0, remaining);
    for (const file of toProcess) {
      try {
        const compressed = await zarCompressImage(file);
        zarSelectedFiles.push(compressed);
      } catch (err) {
        console.error('Зураг боловсруулахад алдаа:', err);
      }
    }
    zarRenderImageSlots();
  }

  // Зургийг canvas ашиглан шахаж, JPEG болгон хувиргана — sait дээр бага зай эзэлнэ
  function zarCompressImage(file) {
    return new Promise(function (resolve, reject) {
      const reader = new FileReader();
      reader.onload = function (ev) {
        const img = new Image();
        img.onload = function () {
          let w = img.width;
          let h = img.height;
          if (w > ZAR_MAX_IMG_DIMENSION || h > ZAR_MAX_IMG_DIMENSION) {
            if (w > h) {
              h = Math.round((h * ZAR_MAX_IMG_DIMENSION) / w);
              w = ZAR_MAX_IMG_DIMENSION;
            } else {
              w = Math.round((w * ZAR_MAX_IMG_DIMENSION) / h);
              h = ZAR_MAX_IMG_DIMENSION;
            }
          }
          const canvas = document.createElement('canvas');
          canvas.width = w;
          canvas.height = h;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, w, h);
          const dataUrl = canvas.toDataURL('image/jpeg', ZAR_JPEG_QUALITY);
          canvas.toBlob(
            function (blob) {
              resolve({ file: blob, dataUrl: dataUrl, name: 'zar_' + Date.now() + '_' + Math.random().toString(36).slice(2) + '.jpg' });
            },
            'image/jpeg',
            ZAR_JPEG_QUALITY
          );
        };
        img.onerror = reject;
        img.src = ev.target.result;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  async function zarUploadImages() {
    const user = zarGetUser();
    const urls = [];
    for (const item of zarSelectedFiles) {
      const path = (user && user.id ? user.id : 'anon') + '/' + item.name;
      const res = await fetch(
        ZAR_SUPABASE_URL + '/storage/v1/object/listing-images/' + path,
        {
          method: 'POST',
          headers: {
            apikey: ZAR_SUPABASE_KEY,
            Authorization: 'Bearer ' + zarGetToken(),
            'Content-Type': 'image/jpeg'
          },
          body: item.file
        }
      );
      if (!res.ok) {
        throw new Error('Зураг хадгалахад алдаа гарлаа');
      }
      urls.push(ZAR_SUPABASE_URL + '/storage/v1/object/public/listing-images/' + path);
    }
    return urls;
  }

  // ---------- Form submit ----------
  async function zarHandleSubmit(e) {
    e.preventDefault();
    if (!zarIsLoggedIn()) {
      zarShowLoginPrompt();
      return;
    }

    const submitBtn = document.getElementById('zar-submit-btn');
    const msg = document.getElementById('zar-form-msg');
    msg.classList.remove('zar-show', 'zar-success', 'zar-error');

    const title = document.getElementById('zar-f-title').value.trim();
    const description = document.getElementById('zar-f-desc').value.trim();
    const categoryId = document.getElementById('zar-f-category').value;
    const priceType = document.getElementById('zar-f-price-type').value;
    const priceRaw = document.getElementById('zar-f-price').value;
    const phone = document.getElementById('zar-f-phone').value.trim();
    const location = document.getElementById('zar-f-location').value.trim();

    if (!title || !description || !phone || !categoryId) {
      msg.textContent = 'Гарчиг, тайлбар, утас, ангилал заавал бөглөнө үү.';
      msg.classList.add('zar-show', 'zar-error');
      return;
    }

    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span class="zar-spin"></span> Нийтэлж байна...';

    try {
      let imageUrls = [];
      if (zarSelectedFiles.length > 0) {
        imageUrls = await zarUploadImages();
      }

      const user = zarGetUser();
      const payload = {
        user_id: user.id,
        title: title,
        description: description,
        category_id: categoryId,
        price: priceType === 'fixed' && priceRaw ? Number(priceRaw) : null,
        price_type: priceType,
        phone: phone,
        location: location || null,
        images: imageUrls,
        status: 'active'
      };

      await zarRestPost('listings', payload);

      msg.textContent = 'Зар амжилттай нийтлэгдлээ!';
      msg.classList.add('zar-show', 'zar-success');
      zarSelectedFiles = [];

      setTimeout(function () {
        zarShowListView();
        zarLoadListings();
      }, 1200);
    } catch (err) {
      msg.textContent = 'Алдаа гарлаа: ' + (err && err.message ? err.message : 'Дахин оролдоно уу.');
      msg.classList.add('zar-show', 'zar-error');
    } finally {
      submitBtn.disabled = false;
      submitBtn.innerHTML = 'Нийтлэх';
    }
  }

  // ---------- DOM injection ----------
  function zarBuildModalHtml() {
    return (
      '<div class="zar-modal">' +
      '<div class="zar-header">' +
      '<div class="zar-header-title">📢 Зар мэдээ</div>' +
      '<button type="button" class="zar-close-btn" id="zar-close-btn" aria-label="Хаах">✕</button>' +
      '</div>' +
      '<div class="zar-body" id="zar-body">' +
      '<div id="zar-list-view">' +
      '<div class="zar-cats" id="zar-cats"></div>' +
      '<button type="button" class="zar-post-btn" id="zar-open-form-btn">+ Зар нийтлэх</button>' +
      '<div class="zar-grid" id="zar-grid"></div>' +
      '</div>' +
      '<div class="zar-form-wrap" id="zar-form-wrap">' +
      '<button type="button" class="zar-back-btn" id="zar-form-back">← Буцах</button>' +
      '<div class="zar-form-msg" id="zar-form-msg"></div>' +
      '<form id="zar-form">' +
      '<div class="zar-field">' +
      '<label>Гарчиг *</label>' +
      '<input type="text" id="zar-f-title" maxlength="120" placeholder="Жишээ: 2 өрөө байр зарна" required>' +
      '</div>' +
      '<div class="zar-field">' +
      '<label>Ангилал *</label>' +
      '<select id="zar-f-category" required></select>' +
      '</div>' +
      '<div class="zar-field">' +
      '<label>Тайлбар *</label>' +
      '<textarea id="zar-f-desc" maxlength="2000" placeholder="Дэлгэрэнгүй мэдээлэл бичнэ үү..." required></textarea>' +
      '</div>' +
      '<div class="zar-field-row">' +
      '<div class="zar-field">' +
      '<label>Үнийн төрөл</label>' +
      '<select id="zar-f-price-type">' +
      '<option value="fixed">Тогтсон үнэ</option>' +
      '<option value="negotiable">Үнэ тохирно</option>' +
      '<option value="free">Хайхдалаа</option>' +
      '</select>' +
      '</div>' +
      '<div class="zar-field">' +
      '<label>Үнэ (₮)</label>' +
      '<input type="number" id="zar-f-price" min="0" placeholder="0">' +
      '</div>' +
      '</div>' +
      '<div class="zar-field-row">' +
      '<div class="zar-field">' +
      '<label>Утасны дугаар *</label>' +
      '<input type="tel" id="zar-f-phone" maxlength="20" placeholder="9911XXXX" required>' +
      '</div>' +
      '<div class="zar-field">' +
      '<label>Байршил</label>' +
      '<input type="text" id="zar-f-location" maxlength="100" placeholder="Улаанбаатар, СБД">' +
      '</div>' +
      '</div>' +
      '<div class="zar-field">' +
      '<label>Зураг (' +
      ZAR_MAX_IMAGES +
      ' хүртэл)</label>' +
      '<div class="zar-img-upload" id="zar-img-upload"></div>' +
      '</div>' +
      '<button type="submit" class="zar-submit-btn" id="zar-submit-btn">Нийтлэх</button>' +
      '</form>' +
      '</div>' +
      '<div class="zar-detail-wrap" id="zar-detail-wrap"></div>' +
      '</div>' +
      '</div>'
    );
  }

  function zarInit() {
    const root = document.getElementById('zar-modal-root');
    if (!root) return;

    const overlay = document.createElement('div');
    overlay.id = 'zar-overlay';
    overlay.className = 'zar-overlay';
    overlay.innerHTML = zarBuildModalHtml();
    root.appendChild(overlay);

    document.getElementById('zar-close-btn').addEventListener('click', zarCloseModal);
    overlay.addEventListener('click', function (e) {
      if (e.target === overlay) zarCloseModal();
    });

    document.getElementById('zar-open-form-btn').addEventListener('click', zarShowFormView);
    document.getElementById('zar-form-back').addEventListener('click', zarShowListView);
    document.getElementById('zar-form').addEventListener('submit', zarHandleSubmit);

    zarRenderImageSlots();

    // Глобал функц — index.html-ийн "Зар мэдээ" товч үүнийг дуудна
    window.zarOpenModal = zarOpenModal;
  }

  document.addEventListener('DOMContentLoaded', zarInit);
})();
