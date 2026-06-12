<!DOCTYPE html>
<html lang="mn">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Үйлчилгээ — КиноЭзэн</title>
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
<style>
*{margin:0;padding:0;box-sizing:border-box;}
body{background:#12121e;color:#fff;font-family:Arial,sans-serif;min-height:100vh;overflow-x:hidden;}
.nav{display:flex;align-items:center;justify-content:space-between;padding:10px 16px;border-bottom:1px solid rgba(255,255,255,0.08);position:sticky;top:0;background:rgba(18,18,30,0.97);backdrop-filter:blur(16px);-webkit-backdrop-filter:blur(16px);z-index:1000;gap:8px;}
.logo{display:flex;align-items:center;gap:8px;text-decoration:none;flex-shrink:0;}
.logo-icon{width:32px;height:32px;border-radius:8px;background:linear-gradient(135deg,#1a0a2e,#3b1f6b);border:1.5px solid rgba(74,222,128,0.35);display:flex;align-items:center;justify-content:center;flex-shrink:0;}
.logo-icon svg{width:22px;height:22px;}
.logo-text{font-size:18px;font-weight:800;background:linear-gradient(90deg,#4ade80,#f4a261);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;white-space:nowrap;}
.nav-desktop-right{display:flex;gap:8px;align-items:center;}
.btn-login{padding:7px 14px;border-radius:8px;background:transparent;border:1px solid rgba(255,255,255,0.2);color:rgba(255,255,255,0.7);font-size:12px;cursor:pointer;white-space:nowrap;}
.btn-login:hover{border-color:#4ade80;color:#4ade80;}
.btn-join{padding:7px 14px;border-radius:8px;background:linear-gradient(90deg,#e63946,#f4a261);border:none;color:#fff;font-size:12px;font-weight:700;cursor:pointer;white-space:nowrap;}
.nav-toggle{display:none;background:none;border:none;color:#fff;font-size:22px;cursor:pointer;padding:4px 6px;border-radius:8px;flex-shrink:0;line-height:1;}
.nav-drawer{display:none;flex-direction:column;background:rgba(18,18,30,0.99);border-bottom:1px solid rgba(255,255,255,0.08);padding:12px 16px 16px;gap:6px;}
.nav-drawer.open{display:flex;}
.nav-drawer a{color:rgba(255,255,255,0.6);text-decoration:none;font-size:14px;font-weight:600;padding:10px 12px;border-radius:10px;transition:background 0.2s,color 0.2s;}
.nav-drawer a:hover,.nav-drawer a.active{background:rgba(74,222,128,0.08);color:#4ade80;}
.drawer-divider{height:1px;background:rgba(255,255,255,0.07);margin:6px 0;}
.drawer-btns{display:flex;gap:8px;margin-top:4px;}
.drawer-btns .btn-login,.drawer-btns .btn-join{flex:1;text-align:center;}
.nav-links-desktop{display:flex;gap:4px;align-items:center;}
.nav-links-desktop a{color:rgba(255,255,255,0.55);text-decoration:none;font-size:13px;font-weight:600;padding:6px 10px;border-radius:8px;transition:all 0.2s;white-space:nowrap;}
.nav-links-desktop a:hover,.nav-links-desktop a.active{color:#4ade80;background:rgba(74,222,128,0.08);}
@media(max-width:768px){.nav-links-desktop{display:none;}.nav-desktop-right{display:none;}.nav-toggle{display:block;}}

/* ── Credit bar ── */
.credit-bar{background:linear-gradient(135deg,rgba(74,222,128,0.07),rgba(244,162,97,0.07));border:1px solid rgba(74,222,128,0.18);border-radius:14px;padding:14px 18px;max-width:800px;margin:14px auto 0;display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;}
.credit-bar.hidden{display:none;}
.cred-left{display:flex;align-items:center;gap:10px;}
.cred-icon{font-size:22px;}
.cred-info{}
.cred-label{font-size:11px;color:rgba(255,255,255,0.4);margin-bottom:2px;}
.cred-nums{font-size:15px;font-weight:700;color:#4ade80;}
.cred-plan{font-size:10px;padding:2px 8px;border-radius:20px;font-weight:700;margin-left:8px;vertical-align:middle;}
.plan-free{background:rgba(74,222,128,0.15);color:#4ade80;border:1px solid rgba(74,222,128,0.3);}
.plan-standard{background:rgba(99,179,255,0.15);color:#63b3ff;border:1px solid rgba(99,179,255,0.3);}
.plan-pro{background:rgba(244,162,97,0.15);color:#f4a261;border:1px solid rgba(244,162,97,0.3);}
.cred-bar-wrap{flex:1;min-width:120px;max-width:220px;}
.cred-track{height:6px;background:rgba(255,255,255,0.08);border-radius:99px;overflow:hidden;}
.cred-fill{height:100%;background:linear-gradient(90deg,#4ade80,#f4a261);border-radius:99px;transition:width 0.5s;}
.cred-pct{font-size:10px;color:rgba(255,255,255,0.35);margin-top:4px;}
.cred-upgrade{padding:7px 14px;border-radius:8px;background:linear-gradient(90deg,#e63946,#f4a261);border:none;color:#fff;font-size:11px;font-weight:700;cursor:pointer;white-space:nowrap;}
.credit-bar-guest{background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.08);border-radius:14px;padding:12px 18px;max-width:800px;margin:14px auto 0;text-align:center;font-size:12px;color:rgba(255,255,255,0.4);}
.credit-bar-guest a{color:#4ade80;font-weight:700;}

.hero{text-align:center;padding:24px 16px 20px;}
.hero h1{font-size:24px;font-weight:700;margin-bottom:10px;line-height:1.3;}
.hero h1 span{color:#4ade80;}
.hero p{font-size:13px;color:rgba(255,255,255,0.45);line-height:1.7;max-width:500px;margin:0 auto;}
.services{padding:16px 16px;max-width:800px;margin:0 auto;}
.svc-card{background:#1e1e2e;border-radius:16px;padding:18px;margin-bottom:14px;border:1px solid rgba(255,255,255,0.07);cursor:pointer;transition:border-color 0.2s;}
.svc-card:hover{border-color:rgba(74,222,128,0.3);}
.svc-head{display:flex;align-items:flex-start;gap:14px;margin-bottom:14px;}
.svc-ico{width:46px;height:46px;border-radius:13px;display:flex;align-items:center;justify-content:center;font-size:22px;flex-shrink:0;}
.svc-ico.green{background:linear-gradient(135deg,#059669,#4ade80);}
.svc-ico.orange{background:linear-gradient(135deg,#d97706,#f4a261);}
.svc-ico.blue{background:linear-gradient(135deg,#2563eb,#6b7ff7);}
.svc-ico.purple{background:linear-gradient(135deg,#7c3aed,#c084fc);}
.svc-ico.red{background:linear-gradient(135deg,#dc2626,#e63946);}
.svc-ico.teal{background:linear-gradient(135deg,#0891b2,#22d3ee);}
.svc-ico.pink{background:linear-gradient(135deg,#db2777,#f472b6);}
.svc-ico.indigo{background:linear-gradient(135deg,#4338ca,#818cf8);}
.svc-ico.amber{background:linear-gradient(135deg,#b45309,#fbbf24);}
.svc-ico.cyan{background:linear-gradient(135deg,#0e7490,#67e8f9);}
.svc-ico.rose{background:linear-gradient(135deg,#be123c,#fb7185);}
.svc-ico.violet{background:linear-gradient(135deg,#6d28d9,#a78bfa);}
.svc-ico.lime{background:linear-gradient(135deg,#3f6212,#a3e635);}
.svc-ico.sky{background:linear-gradient(135deg,#0369a1,#38bdf8);}
.svc-ico.fuchsia{background:linear-gradient(135deg,#a21caf,#e879f9);}
.svc-ico.slate{background:linear-gradient(135deg,#334155,#94a3b8);}
.svc-info{flex:1;min-width:0;}
.svc-name{font-size:15px;font-weight:600;color:#fff;margin-bottom:4px;}
.svc-desc{font-size:13px;color:rgba(255,255,255,0.45);line-height:1.6;}
.badges{display:flex;gap:6px;margin-top:8px;flex-wrap:wrap;}
.badge{font-size:10px;padding:2px 9px;border-radius:20px;font-weight:600;}
.badge-free{background:rgba(74,222,128,0.15);color:#4ade80;border:1px solid rgba(74,222,128,0.3);}
.badge-pro{background:rgba(244,162,97,0.15);color:#f4a261;border:1px solid rgba(244,162,97,0.3);}
.badge-hot{background:rgba(230,57,70,0.15);color:#e63946;border:1px solid rgba(230,57,70,0.3);}
.badge-credit{background:rgba(99,179,255,0.12);color:#63b3ff;border:1px solid rgba(99,179,255,0.25);}
.badge-new{background:rgba(74,222,128,0.12);color:#4ade80;border:1px solid rgba(74,222,128,0.25);}
.svc-btn{width:100%;padding:11px;border-radius:10px;background:rgba(74,222,128,0.08);border:1px solid rgba(74,222,128,0.2);color:#4ade80;font-size:13px;font-weight:500;cursor:pointer;}
.svc-btn:hover{background:rgba(74,222,128,0.15);}
.svc-btn:disabled{opacity:0.5;cursor:not-allowed;}

/* ── Expand boxes ── */
.svc-box{background:#12121e;border-radius:12px;padding:16px;margin-top:14px;border:1px solid rgba(255,255,255,0.06);display:none;}
.svc-box.show{display:block;}
/* keep old class names for backward compat */
.tts-box,.hum-box,.trans-box,.stt-box,.textedit-box{background:#12121e;border-radius:12px;padding:16px;margin-top:14px;border:1px solid rgba(255,255,255,0.06);display:none;}
.tts-box.show,.hum-box.show,.trans-box.show,.stt-box.show,.textedit-box.show{display:block;}
.form-label{font-size:12px;color:rgba(255,255,255,0.5);margin-bottom:6px;display:block;}
textarea,input[type=text],input[type=email]{width:100%;background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.1);border-radius:10px;padding:12px 14px;color:#fff;font-size:13px;font-family:Arial,sans-serif;}
textarea{height:90px;resize:none;}
textarea:focus,input[type=text]:focus,input[type=email]:focus{outline:none;border-color:#4ade80;}
.voice-row{display:flex;gap:8px;margin:10px 0;}
.vbtn{flex:1;padding:9px;border-radius:9px;border:1px solid rgba(255,255,255,0.15);background:rgba(255,255,255,0.05);color:rgba(255,255,255,0.55);font-size:12px;font-weight:500;cursor:pointer;text-align:center;}
.vbtn.on{border-color:#4ade80;color:#4ade80;background:rgba(74,222,128,0.08);}
.run-btn{width:100%;padding:12px;border-radius:10px;background:linear-gradient(90deg,#4ade80,#f4a261);border:none;color:#0a2a0a;font-size:14px;font-weight:700;cursor:pointer;margin-top:10px;}
.run-btn:disabled{opacity:0.5;cursor:not-allowed;}

/* Credit cost pill */
.cost-pill{display:inline-flex;align-items:center;gap:4px;font-size:11px;padding:4px 10px;border-radius:20px;background:rgba(99,179,255,0.1);border:1px solid rgba(99,179,255,0.25);color:#63b3ff;margin-bottom:10px;}

.result{background:#1e1e2e;border-radius:10px;padding:14px;margin-top:12px;border:1px solid rgba(74,222,128,0.2);display:none;}
.result.show{display:block;}
.result-label{font-size:11px;color:#4ade80;font-weight:600;margin-bottom:10px;}
.split{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:12px;}
.split-card{background:#1e1e2e;border-radius:10px;padding:12px;}
.split-label{font-size:11px;font-weight:600;margin-bottom:8px;}
.split-label.red{color:#e63946;}
.split-label.grn{color:#4ade80;}
.split-text{font-size:12px;color:rgba(255,255,255,0.6);line-height:1.6;}
@media(max-width:480px){.split{grid-template-columns:1fr;}}

/* Upload area */
.upload-area{border:2px dashed rgba(255,255,255,0.12);border-radius:12px;padding:28px;text-align:center;cursor:pointer;transition:border-color 0.2s;margin-bottom:10px;}
.upload-area:hover,.upload-area.drag{border-color:#4ade80;}
.upload-area input{display:none;}
.upload-icon{font-size:30px;margin-bottom:8px;}
.upload-name{font-size:12px;color:#4ade80;margin-top:6px;word-break:break-all;}

/* Lang selects */
.lang-row{display:grid;grid-template-columns:1fr auto 1fr;gap:8px;align-items:center;margin-bottom:12px;}
.lang-select{background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.12);border-radius:9px;padding:8px 10px;color:#fff;font-size:13px;cursor:pointer;}
.lang-swap{background:rgba(74,222,128,0.1);border:1px solid rgba(74,222,128,0.2);border-radius:8px;padding:8px 12px;color:#4ade80;font-size:16px;cursor:pointer;}
.lang-swap:hover{background:rgba(74,222,128,0.2);}

/* Notice */
.notice-box{padding:12px;background:rgba(244,162,97,0.1);border:1px solid rgba(244,162,97,0.3);border-radius:10px;text-align:center;font-size:12px;color:#f4a261;margin-top:10px;display:none;}
.notice-box a{color:#f4a261;font-weight:700;}

.section-title{font-size:11px;font-weight:700;color:rgba(255,255,255,0.3);letter-spacing:1.5px;text-transform:uppercase;margin:20px 0 12px;padding-left:2px;}

.footer{margin-top:30px;padding:16px 18px 80px;border-top:1px solid rgba(255,255,255,0.08);text-align:center;font-size:12px;color:rgba(255,255,255,0.3);}
.mobile-bottom-nav{display:none;position:fixed;bottom:0;left:0;right:0;height:60px;background:rgba(18,18,30,0.97);backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);border-top:1px solid rgba(255,255,255,0.08);z-index:1000;padding-bottom:env(safe-area-inset-bottom);}
.mbn-inner{display:flex;align-items:center;justify-content:space-around;height:100%;}
.mbn-item{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:3px;padding:6px 10px;border-radius:10px;text-decoration:none;color:rgba(255,255,255,0.4);font-size:10px;font-family:Arial,sans-serif;font-weight:600;transition:color 0.2s;cursor:pointer;border:none;background:none;flex:1;}
.mbn-item.active{color:#4ade80;}
.mbn-item svg{width:22px;height:22px;stroke:currentColor;fill:none;stroke-width:2;stroke-linecap:round;stroke-linejoin:round;}
.mbn-item.active svg{stroke:#4ade80;}
@media(max-width:768px){.mobile-bottom-nav{display:flex;}body{padding-bottom:60px;}}
</style>
</head>
<body>

<nav class="nav">
  <a href="index.html" class="logo">
    <div class="logo-icon">
      <svg viewBox="0 0 26 26" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="2" y="6" width="22" height="14" rx="3" fill="none" stroke="#4ade80" stroke-width="1.8"/>
        <line x1="7" y1="6" x2="7" y2="20" stroke="#4ade80" stroke-width="1.4"/>
        <line x1="19" y1="6" x2="19" y2="20" stroke="#4ade80" stroke-width="1.4"/>
        <line x1="2" y1="13" x2="24" y2="13" stroke="#4ade80" stroke-width="1.2"/>
        <circle cx="4.5" cy="8.5" r="1.1" fill="#f4a261"/>
        <circle cx="4.5" cy="17.5" r="1.1" fill="#f4a261"/>
        <circle cx="21.5" cy="8.5" r="1.1" fill="#f4a261"/>
        <circle cx="21.5" cy="17.5" r="1.1" fill="#f4a261"/>
        <path d="M11 10.2l5 2.8-5 2.8V10.2z" fill="#4ade80"/>
      </svg>
    </div>
    <div class="logo-text">КиноЭзэн</div>
  </a>
  <div class="nav-links-desktop">
    <a href="index.html">Нүүр</a>
    <a href="movies.html">Кинонууд</a>
    <a href="news.html">Мэдээ</a>
    <a href="services.html" class="active">Үйлчилгээ</a>
  </div>
  <div class="nav-desktop-right" id="nav-right">
    <button class="btn-login" onclick="location.href='login.html'">Нэвтрэх</button>
    <button class="btn-join" onclick="location.href='login.html'">Бүртгүүлэх</button>
  </div>
  <button class="nav-toggle" id="nav-toggle" onclick="toggleDrawer()" aria-label="Цэс">☰</button>
</nav>

<div class="nav-drawer" id="nav-drawer">
  <a href="index.html">🏠 Нүүр</a>
  <a href="movies.html">🎬 Кинонууд</a>
  <a href="news.html">📰 Мэдээ</a>
  <a href="services.html" class="active">⚡ Үйлчилгээ</a>
  <a href="profile.html">👤 Профайл</a>
  <div class="drawer-divider"></div>
  <div class="drawer-btns" id="drawer-btns">
    <button class="btn-login" onclick="location.href='login.html'">Нэвтрэх</button>
    <button class="btn-join" onclick="location.href='login.html'">Бүртгүүлэх</button>
  </div>
</div>

<!-- ── Credit Bar (logged in) ── -->
<div class="credit-bar hidden" id="credit-bar" style="padding-left:16px;padding-right:16px;">
  <div class="cred-left">
    <div class="cred-icon">⚡</div>
    <div class="cred-info">
      <div class="cred-label">Үлдсэн кредит</div>
      <div class="cred-nums">
        <span id="cred-remaining">—</span>/<span id="cred-total">—</span>
        <span class="cred-plan plan-free" id="cred-plan-badge">Үнэгүй</span>
      </div>
    </div>
  </div>
  <div class="cred-bar-wrap">
    <div class="cred-track"><div class="cred-fill" id="cred-fill" style="width:100%"></div></div>
    <div class="cred-pct" id="cred-pct">100% үлдсэн</div>
  </div>
  <button class="cred-upgrade" onclick="location.href='pricing.html'">⬆ Апгрейд</button>
</div>

<!-- ── Guest notice ── -->
<div class="credit-bar-guest" id="credit-bar-guest">
  💡 <a href="login.html">Нэвтэрч</a> кредит системийг ашиглана уу — Үнэгүй тарифт 100 кредит/сар
</div>

<div class="hero">
  <h1>AI <span>үйлчилгээнүүд</span></h1>
  <p>Монгол хэлний хамгийн дэвшилтэт AI хэрэгслүүд нэг дор</p>
</div>

<div class="services">

  <div class="section-title">Байнгын үйлчилгээ</div>

  <!-- ── 1. TTS ── -->
  <div class="svc-card">
    <div class="svc-head">
      <div class="svc-ico green">🎤</div>
      <div class="svc-info">
        <div class="svc-name">Монгол TTS — Дуу үүсгэгч</div>
        <div class="svc-desc">Текстийг байгалийн Монгол дуугаар уншуулна. Батаа (эрэгтэй) ба Есүй (эмэгтэй) хоёр дуу сонголттой.</div>
        <div class="badges">
          <span class="badge badge-free">Үнэгүй</span>
          <span class="badge badge-hot">Хамгийн алдартай</span>
          <span class="badge badge-credit">⚡ 1 тэмдэгт = 1 кредит</span>
        </div>
      </div>
    </div>
    <button class="svc-btn" onclick="toggleBox('tts-box',this)">▶ Туршиж үзэх</button>
    <div class="tts-box" id="tts-box">
      <div class="cost-pill">⚡ Үнэ: 1 тэмдэгт = 1 кредит</div>
      <label class="form-label">Монгол текст оруулах <span id="char-count" style="color:#4ade80;float:right">0/500</span></label>
      <textarea id="tts-text" placeholder="Энд монгол текстээ бичнэ үү..." oninput="updateTTSCount()"></textarea>
      <label class="form-label" style="margin-top:10px">Дуу сонгох</label>
      <div class="voice-row">
        <div class="vbtn on" onclick="selVoice(this)">🎤 Батаа (эрэгтэй)</div>
        <div class="vbtn" onclick="selVoice(this)">🎤 Есүй (эмэгтэй)</div>
      </div>
      <div style="margin:10px 0">
        <label class="form-label">⚡ Хурд <span id="rate-val">+15%</span></label>
        <input type="range" id="rate" min="-50" max="50" value="15" step="5" oninput="document.getElementById('rate-val').textContent=(this.value>0?'+':'')+this.value+'%'" style="width:100%;accent-color:#4ade80">
        <label class="form-label" style="margin-top:8px">🎵 Бүдүүн/Нарийн <span id="pitch-val">-8Hz</span></label>
        <input type="range" id="pitch" min="-50" max="50" value="-8" step="1" oninput="document.getElementById('pitch-val').textContent=(this.value>0?'+':'')+this.value+'Hz'" style="width:100%;accent-color:#4ade80">
        <label class="form-label" style="margin-top:8px">🔊 Дуу чанга/Сула <span id="vol-val">0%</span></label>
        <input type="range" id="volume" min="-50" max="50" value="0" step="5" oninput="document.getElementById('vol-val').textContent=(this.value>0?'+':'')+this.value+'%'" style="width:100%;accent-color:#4ade80">
      </div>
      <div id="tts-limit-info" style="font-size:11px;color:rgba(255,255,255,0.4);margin-bottom:8px;text-align:center"></div>
      <button class="run-btn" id="tts-run-btn" onclick="runTTS()">▶ Дуу үүсгэх</button>
      <div class="notice-box" id="tts-notice">
        💎 Кредит хүрэлцэхгүй байна — <a href="pricing.html">тариф сонгох →</a>
      </div>
      <div class="result" id="tts-result"></div>
    </div>
  </div>

  <!-- ── 2. Humanizer ── -->
  <div class="svc-card">
    <div class="svc-head">
      <div class="svc-ico orange">✨</div>
      <div class="svc-info">
        <div class="svc-name">Монгол Humanizer</div>
        <div class="svc-desc">AI орчуулгыг байгалийн, жинхэнэ монгол хэлрүү хөрвүүлнэ. Яаж ч мэдэгдэхгүй.</div>
        <div class="badges">
          <span class="badge badge-free">Үнэгүй</span>
          <span class="badge badge-credit">⚡ 1 тэмдэгт = 1 кредит</span>
        </div>
      </div>
    </div>
    <button class="svc-btn" onclick="toggleBox('hum-box',this)">✨ Туршиж үзэх</button>
    <div class="hum-box" id="hum-box">
      <div class="cost-pill">⚡ Үнэ: 1 тэмдэгт = 1 кредит</div>
      <label class="form-label">AI орчуулга / хатуу текст</label>
      <textarea id="hum-input" placeholder="Машинаар орчуулсан монгол текстийг энд оруулна уу..."></textarea>
      <button class="run-btn" onclick="runHum()">✨ Хүмүүнжүүлэх</button>
      <div class="notice-box" id="hum-notice">
        💎 Кредит хүрэлцэхгүй байна — <a href="pricing.html">тариф сонгох →</a>
      </div>
      <div class="split" id="hum-result" style="display:none">
        <div class="split-card">
          <div class="split-label red">Анхны текст</div>
          <div class="split-text" id="hum-before"></div>
        </div>
        <div class="split-card">
          <div class="split-label grn">Засагдсан текст</div>
          <div class="split-text" id="hum-after">Байгалийн монгол хэлээр боловсруулсан текст энд харагдана...</div>
        </div>
      </div>
    </div>
  </div>

  <!-- ── 3. SRT ── -->
  <div class="svc-card">
    <div class="svc-head">
      <div class="svc-ico blue">📄</div>
      <div class="svc-info">
        <div class="svc-name">SRT Субтитр орчуулагч</div>
        <div class="svc-desc">Англи .srt файлыг монгол субтитр болгоно. Видео хийгчдэд зориулсан.</div>
        <div class="badges"><span class="badge badge-pro">Премиум</span></div>
      </div>
    </div>
    <button class="svc-btn" onclick="location.href='login.html'">🔒 Нэвтэрч авах</button>
  </div>

  <!-- ── 4. Script ── -->
  <div class="svc-card">
    <div class="svc-head">
      <div class="svc-ico purple">✍️</div>
      <div class="svc-info">
        <div class="svc-name">Монгол Script бичигч</div>
        <div class="svc-desc">YouTube видео, подкаст, кино тайлбарын script монголоор автоматаар бичнэ.</div>
        <div class="badges"><span class="badge badge-pro">Премиум</span></div>
      </div>
    </div>
    <button class="svc-btn" onclick="location.href='login.html'">🔒 Нэвтэрч авах</button>
  </div>

  <div class="section-title">Шинэ үйлчилгээ</div>

  <!-- ── 5. Орчуулагч ── -->
  <div class="svc-card">
    <div class="svc-head">
      <div class="svc-ico teal">🌐</div>
      <div class="svc-info">
        <div class="svc-name">Орчуулагч</div>
        <div class="svc-desc">20+ хэлнээс монголруу болон монголоос бусад хэлрүү хурдан, нарийвчлалтай орчуулна.</div>
        <div class="badges">
          <span class="badge badge-free">Үнэгүй</span>
          <span class="badge badge-credit">⚡ 1 тэмдэгт = 2 кредит</span>
        </div>
      </div>
    </div>
    <button class="svc-btn" onclick="toggleBox('trans-box',this)">🌐 Туршиж үзэх</button>
    <div class="trans-box" id="trans-box">
      <div class="cost-pill">⚡ Үнэ: 1 тэмдэгт = 2 кредит</div>
      <div class="lang-row">
        <select class="lang-select" id="trans-from">
          <option value="en">🇺🇸 Англи</option>
          <option value="mn" selected>🇲🇳 Монгол</option>
          <option value="ru">🇷🇺 Орос</option>
          <option value="zh">🇨🇳 Хятад</option>
          <option value="ja">🇯🇵 Япон</option>
          <option value="ko">🇰🇷 Солонгос</option>
          <option value="de">🇩🇪 Герман</option>
          <option value="fr">🇫🇷 Франц</option>
        </select>
        <button class="lang-swap" onclick="swapLangs()" title="Солих">⇄</button>
        <select class="lang-select" id="trans-to">
          <option value="mn" selected>🇲🇳 Монгол</option>
          <option value="en">🇺🇸 Англи</option>
          <option value="ru">🇷🇺 Орос</option>
          <option value="zh">🇨🇳 Хятад</option>
          <option value="ja">🇯🇵 Япон</option>
          <option value="ko">🇰🇷 Солонгос</option>
          <option value="de">🇩🇪 Герман</option>
          <option value="fr">🇫🇷 Франц</option>
        </select>
      </div>
      <label class="form-label">Орчуулах текст</label>
      <textarea id="trans-input" placeholder="Орчуулах текстийг энд бичнэ үү..."></textarea>
      <button class="run-btn" onclick="runTranslate()">🌐 Орчуулах</button>
      <div class="notice-box" id="trans-notice">
        💎 Кредит хүрэлцэхгүй байна — <a href="pricing.html">тариф сонгох →</a>
      </div>
      <div class="result" id="trans-result"></div>
    </div>
  </div>

  <!-- ── 6. Дуу→Текст (STT) ── -->
  <div class="svc-card">
    <div class="svc-head">
      <div class="svc-ico pink">🎙️</div>
      <div class="svc-info">
        <div class="svc-name">Дуу → Текст (Speech-to-Text)</div>
        <div class="svc-desc">Монгол ярианы аудио файл (MP3/WAV/M4A) оруулахад автоматаар текст болгож өгнө.</div>
        <div class="badges">
          <span class="badge badge-free">Үнэгүй</span>
          <span class="badge badge-credit">⚡ 1 мин = 10 кредит</span>
        </div>
      </div>
    </div>
    <button class="svc-btn" onclick="toggleBox('stt-box',this)">🎙️ Туршиж үзэх</button>
    <div class="stt-box" id="stt-box">
      <div class="cost-pill">⚡ Үнэ: 1 минут = 10 кредит</div>
      <div class="upload-area" id="stt-upload-area" onclick="document.getElementById('stt-file').click()"
        ondragover="event.preventDefault();this.classList.add('drag')"
        ondragleave="this.classList.remove('drag')"
        ondrop="handleSTTDrop(event)">
        <input type="file" id="stt-file" accept=".mp3,.wav,.m4a,.ogg" onchange="handleSTTFile(event)">
        <div class="upload-icon">🎵</div>
        <div style="font-size:13px;color:rgba(255,255,255,0.5)">MP3, WAV, M4A файл оруулах</div>
        <div style="font-size:11px;color:rgba(255,255,255,0.25);margin-top:4px">эсвэл энд чирж тавих</div>
        <div class="upload-name" id="stt-file-name"></div>
      </div>
      <div id="stt-duration" style="font-size:12px;color:rgba(255,255,255,0.4);margin-bottom:8px;display:none"></div>
      <button class="run-btn" onclick="runSTT()">🎙️ Текст болгох</button>
      <div class="notice-box" id="stt-notice">
        💎 Кредит хүрэлцэхгүй байна — <a href="pricing.html">тариф сонгох →</a>
      </div>
      <div class="result" id="stt-result"></div>
    </div>
  </div>

  <!-- ── 7. Текст засагч ── -->
  <div class="svc-card">
    <div class="svc-head">
      <div class="svc-ico indigo">📝</div>
      <div class="svc-info">
        <div class="svc-name">Текст засагч</div>
        <div class="svc-desc">Монгол текстийн дүрэм, найруулга, цэг таслалын алдааг автоматаар илрүүлж засна.</div>
        <div class="badges">
          <span class="badge badge-free">Үнэгүй</span>
          <span class="badge badge-credit">⚡ 1 тэмдэгт = 1 кредит</span>
        </div>
      </div>
    </div>
    <button class="svc-btn" onclick="toggleBox('textedit-box',this)">📝 Туршиж үзэх</button>
    <div class="textedit-box" id="textedit-box">
      <div class="cost-pill">⚡ Үнэ: 1 тэмдэгт = 1 кредит</div>
      <label class="form-label">Засах текст</label>
      <textarea id="textedit-input" placeholder="Засах монгол текстийг энд оруулна уу..." style="height:110px;"></textarea>
      <div style="display:flex;gap:8px;margin-top:10px;flex-wrap:wrap;">
        <label style="display:flex;align-items:center;gap:6px;font-size:12px;color:rgba(255,255,255,0.5);cursor:pointer;">
          <input type="checkbox" id="fix-grammar" checked style="accent-color:#4ade80;"> Дүрэм
        </label>
        <label style="display:flex;align-items:center;gap:6px;font-size:12px;color:rgba(255,255,255,0.5);cursor:pointer;">
          <input type="checkbox" id="fix-punctuation" checked style="accent-color:#4ade80;"> Цэг таслал
        </label>
        <label style="display:flex;align-items:center;gap:6px;font-size:12px;color:rgba(255,255,255,0.5);cursor:pointer;">
          <input type="checkbox" id="fix-style" style="accent-color:#4ade80;"> Найруулга сайжруулах
        </label>
      </div>
      <button class="run-btn" onclick="runTextEdit()">📝 Засах</button>
      <div class="notice-box" id="textedit-notice">
        💎 Кредит хүрэлцэхгүй байна — <a href="pricing.html">тариф сонгох →</a>
      </div>
      <div class="split" id="textedit-result" style="display:none">
        <div class="split-card">
          <div class="split-label red">Анхны текст</div>
          <div class="split-text" id="textedit-before"></div>
        </div>
        <div class="split-card">
          <div class="split-label grn">Засагдсан текст</div>
          <div class="split-text" id="textedit-after"></div>
        </div>
      </div>
    </div>
  </div>

  <!-- ════════════════════════════════════ -->
  <!-- КИНО ПЛАТФОРМ -->
  <!-- ════════════════════════════════════ -->
  <div class="section-title">Кино платформ</div>

  <!-- ── 8. Кино тоймч ── -->
  <div class="svc-card">
    <div class="svc-head">
      <div class="svc-ico red">🎬</div>
      <div class="svc-info">
        <div class="svc-name">Кино тоймч</div>
        <div class="svc-desc">Кино нэр оруулахад AI монгол хэлээр дэлгэрэнгүй тойм бичиж өгнө.</div>
        <div class="badges">
          <span class="badge badge-free">Үнэгүй</span>
          <span class="badge badge-new">🆕 Шинэ</span>
          <span class="badge badge-credit">⚡ 5 кредит/тойм</span>
        </div>
      </div>
    </div>
    <button class="svc-btn" onclick="toggleBox('movie-review-box',this)">🎬 Туршиж үзэх</button>
    <div class="svc-box" id="movie-review-box">
      <div class="cost-pill">⚡ Үнэ: 5 кредит/тойм</div>
      <label class="form-label">Кино нэр оруулах</label>
      <input type="text" id="movie-review-input" placeholder="Жишээ: Inception, Parasite, Avengers...">
      <div style="margin-top:10px;margin-bottom:4px;display:flex;gap:8px;flex-wrap:wrap;">
        <label style="font-size:12px;color:rgba(255,255,255,0.5);">Тоймын урт:</label>
        <label style="display:flex;align-items:center;gap:5px;font-size:12px;color:rgba(255,255,255,0.5);cursor:pointer;"><input type="radio" name="review-len" value="short" style="accent-color:#4ade80;"> Богино</label>
        <label style="display:flex;align-items:center;gap:5px;font-size:12px;color:rgba(255,255,255,0.5);cursor:pointer;"><input type="radio" name="review-len" value="medium" checked style="accent-color:#4ade80;"> Дунд</label>
        <label style="display:flex;align-items:center;gap:5px;font-size:12px;color:rgba(255,255,255,0.5);cursor:pointer;"><input type="radio" name="review-len" value="long" style="accent-color:#4ade80;"> Дэлгэрэнгүй</label>
      </div>
      <button class="run-btn" onclick="runMovieReview()">🎬 Тойм бичих</button>
      <div class="notice-box" id="movie-review-notice">
        💎 Кредит хүрэлцэхгүй байна — <a href="pricing.html">тариф сонгох →</a>
      </div>
      <div class="result" id="movie-review-result"></div>
    </div>
  </div>

  <!-- ── 9. Субтитр нийлүүлэгч ── -->
  <div class="svc-card">
    <div class="svc-head">
      <div class="svc-ico violet">🎞️</div>
      <div class="svc-info">
        <div class="svc-name">Субтитр нийлүүлэгч</div>
        <div class="svc-desc">Видео файл болон SRT субтитр оруулахад нийлүүлж MP4 болгоно.</div>
        <div class="badges">
          <span class="badge badge-pro">Про</span>
          <span class="badge badge-new">🆕 Шинэ</span>
          <span class="badge badge-credit">⚡ 50 кредит/видео</span>
        </div>
      </div>
    </div>
    <button class="svc-btn" onclick="toggleBox('merge-sub-box',this)">🎞️ Туршиж үзэх</button>
    <div class="svc-box" id="merge-sub-box">
      <div class="cost-pill">⚡ Үнэ: 50 кредит/видео</div>
      <label class="form-label">Видео файл (MP4, MKV, AVI)</label>
      <div class="upload-area" id="merge-video-area" onclick="document.getElementById('merge-video-file').click()"
        ondragover="event.preventDefault();this.classList.add('drag')"
        ondragleave="this.classList.remove('drag')"
        ondrop="handleMergeVideoDrop(event)">
        <input type="file" id="merge-video-file" accept=".mp4,.mkv,.avi,.mov" onchange="handleMergeVideoFile(event)">
        <div class="upload-icon">🎥</div>
        <div style="font-size:13px;color:rgba(255,255,255,0.5)">MP4, MKV, AVI файл оруулах</div>
        <div class="upload-name" id="merge-video-name"></div>
      </div>
      <label class="form-label">SRT Субтитр файл</label>
      <div class="upload-area" id="merge-srt-area" onclick="document.getElementById('merge-srt-file').click()"
        ondragover="event.preventDefault();this.classList.add('drag')"
        ondragleave="this.classList.remove('drag')"
        ondrop="handleMergeSRTDrop(event)">
        <input type="file" id="merge-srt-file" accept=".srt,.ass,.vtt" onchange="handleMergeSRTFile(event)">
        <div class="upload-icon">📄</div>
        <div style="font-size:13px;color:rgba(255,255,255,0.5)">SRT, ASS, VTT файл оруулах</div>
        <div class="upload-name" id="merge-srt-name"></div>
      </div>
      <button class="run-btn" onclick="runMergeSubtitle()">🎞️ Нийлүүлэх</button>
      <div class="notice-box" id="merge-sub-notice">
        💎 Кредит хүрэлцэхгүй байна — <a href="pricing.html">тариф сонгох →</a>
      </div>
      <div class="result" id="merge-sub-result"></div>
    </div>
  </div>

  <!-- ── 10. Видео хуваагч ── -->
  <div class="svc-card">
    <div class="svc-head">
      <div class="svc-ico amber">✂️</div>
      <div class="svc-info">
        <div class="svc-name">Видео хуваагч</div>
        <div class="svc-desc">Видеог үзэгдэл, хэсгийн дагуу автоматаар хуваана. Монтаж хийхэд хялбар болгоно.</div>
        <div class="badges">
          <span class="badge badge-pro">Про</span>
          <span class="badge badge-new">🆕 Шинэ</span>
          <span class="badge badge-credit">⚡ 30 кредит/видео</span>
        </div>
      </div>
    </div>
    <button class="svc-btn" onclick="toggleBox('video-split-box',this)">✂️ Туршиж үзэх</button>
    <div class="svc-box" id="video-split-box">
      <div class="cost-pill">⚡ Үнэ: 30 кредит/видео</div>
      <label class="form-label">Видео файл оруулах</label>
      <div class="upload-area" id="vsplit-area" onclick="document.getElementById('vsplit-file').click()"
        ondragover="event.preventDefault();this.classList.add('drag')"
        ondragleave="this.classList.remove('drag')"
        ondrop="handleVsplitDrop(event)">
        <input type="file" id="vsplit-file" accept=".mp4,.mkv,.avi,.mov" onchange="handleVsplitFile(event)">
        <div class="upload-icon">🎬</div>
        <div style="font-size:13px;color:rgba(255,255,255,0.5)">MP4, MKV, AVI файл оруулах</div>
        <div class="upload-name" id="vsplit-file-name"></div>
      </div>
      <label class="form-label">Хуваах арга</label>
      <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:12px;">
        <label style="display:flex;align-items:center;gap:5px;font-size:12px;color:rgba(255,255,255,0.5);cursor:pointer;"><input type="radio" name="split-mode" value="scene" checked style="accent-color:#4ade80;"> Үзэгдлийн дагуу</label>
        <label style="display:flex;align-items:center;gap:5px;font-size:12px;color:rgba(255,255,255,0.5);cursor:pointer;"><input type="radio" name="split-mode" value="interval" style="accent-color:#4ade80;"> Тогтмол хугацаагаар</label>
        <label style="display:flex;align-items:center;gap:5px;font-size:12px;color:rgba(255,255,255,0.5);cursor:pointer;"><input type="radio" name="split-mode" value="custom" style="accent-color:#4ade80;"> Гараар</label>
      </div>
      <div id="vsplit-interval" style="display:none;margin-bottom:12px;">
        <label class="form-label">Хугацаа (секунд)</label>
        <input type="text" id="vsplit-interval-val" placeholder="Жишээ: 30">
      </div>
      <button class="run-btn" onclick="runVideoSplit()">✂️ Хуваах</button>
      <div class="notice-box" id="video-split-notice">
        💎 Кредит хүрэлцэхгүй байна — <a href="pricing.html">тариф сонгох →</a>
      </div>
      <div class="result" id="video-split-result"></div>
    </div>
  </div>

  <!-- ── 11. Дүрийн нэр орчуулагч ── -->
  <div class="svc-card">
    <div class="svc-head">
      <div class="svc-ico cyan">🎭</div>
      <div class="svc-info">
        <div class="svc-name">Дүрийн нэр орчуулагч</div>
        <div class="svc-desc">Кинон дахь гадаад нэрийг монгол стандарт дуудлагаар орчуулж, жигдлэнэ.</div>
        <div class="badges">
          <span class="badge badge-free">Үнэгүй</span>
          <span class="badge badge-new">🆕 Шинэ</span>
          <span class="badge badge-credit">⚡ 1 нэр = 2 кредит</span>
        </div>
      </div>
    </div>
    <button class="svc-btn" onclick="toggleBox('name-translate-box',this)">🎭 Туршиж үзэх</button>
    <div class="svc-box" id="name-translate-box">
      <div class="cost-pill">⚡ Үнэ: нэр тус бүр = 2 кредит</div>
      <label class="form-label">Орчуулах нэрс (мөр тус бүрт нэг нэр)</label>
      <textarea id="name-translate-input" placeholder="John Smith&#10;Elizabeth Turner&#10;Tony Stark" style="height:120px;"></textarea>
      <label class="form-label" style="margin-top:10px;">Эх хэл</label>
      <select class="lang-select" id="name-translate-lang" style="width:100%;margin-bottom:10px;">
        <option value="en">🇺🇸 Англи</option>
        <option value="ru">🇷🇺 Орос</option>
        <option value="zh">🇨🇳 Хятад</option>
        <option value="ja">🇯🇵 Япон</option>
        <option value="ko">🇰🇷 Солонгос</option>
      </select>
      <button class="run-btn" onclick="runNameTranslate()">🎭 Орчуулах</button>
      <div class="notice-box" id="name-translate-notice">
        💎 Кредит хүрэлцэхгүй байна — <a href="pricing.html">тариф сонгох →</a>
      </div>
      <div class="result" id="name-translate-result"></div>
    </div>
  </div>

  <!-- ════════════════════════════════════ -->
  <!-- КОНТЕНТ БҮТЭЭГЧ -->
  <!-- ════════════════════════════════════ -->
  <div class="section-title">Контент бүтээгч</div>

  <!-- ── 12. Пост үүсгэгч ── -->
  <div class="svc-card">
    <div class="svc-head">
      <div class="svc-ico blue">📱</div>
      <div class="svc-info">
        <div class="svc-name">Пост үүсгэгч</div>
        <div class="svc-desc">Агуулга, санаанаас Facebook болон Instagram пост монголоор автоматаар үүсгэнэ.</div>
        <div class="badges">
          <span class="badge badge-free">Үнэгүй</span>
          <span class="badge badge-new">🆕 Шинэ</span>
          <span class="badge badge-credit">⚡ 3 кредит/пост</span>
        </div>
      </div>
    </div>
    <button class="svc-btn" onclick="toggleBox('post-gen-box',this)">📱 Туршиж үзэх</button>
    <div class="svc-box" id="post-gen-box">
      <div class="cost-pill">⚡ Үнэ: 3 кредит/пост</div>
      <label class="form-label">Агуулга / Санаа</label>
      <textarea id="post-gen-input" placeholder="Постын агуулга эсвэл санаагаа энд бичнэ үү..."></textarea>
      <div style="display:flex;gap:8px;margin:10px 0;flex-wrap:wrap;">
        <label style="font-size:12px;color:rgba(255,255,255,0.5);">Платформ:</label>
        <label style="display:flex;align-items:center;gap:5px;font-size:12px;color:rgba(255,255,255,0.5);cursor:pointer;"><input type="radio" name="post-platform" value="facebook" checked style="accent-color:#4ade80;"> Facebook</label>
        <label style="display:flex;align-items:center;gap:5px;font-size:12px;color:rgba(255,255,255,0.5);cursor:pointer;"><input type="radio" name="post-platform" value="instagram" style="accent-color:#4ade80;"> Instagram</label>
        <label style="display:flex;align-items:center;gap:5px;font-size:12px;color:rgba(255,255,255,0.5);cursor:pointer;"><input type="radio" name="post-platform" value="both" style="accent-color:#4ade80;"> Хоёулаа</label>
      </div>
      <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:4px;">
        <label style="font-size:12px;color:rgba(255,255,255,0.5);">Өнгө аяс:</label>
        <label style="display:flex;align-items:center;gap:5px;font-size:12px;color:rgba(255,255,255,0.5);cursor:pointer;"><input type="radio" name="post-tone" value="fun" checked style="accent-color:#4ade80;"> Хөгжилтэй</label>
        <label style="display:flex;align-items:center;gap:5px;font-size:12px;color:rgba(255,255,255,0.5);cursor:pointer;"><input type="radio" name="post-tone" value="pro" style="accent-color:#4ade80;"> Мэргэжлийн</label>
        <label style="display:flex;align-items:center;gap:5px;font-size:12px;color:rgba(255,255,255,0.5);cursor:pointer;"><input type="radio" name="post-tone" value="info" style="accent-color:#4ade80;"> Мэдээлэл</label>
      </div>
      <button class="run-btn" onclick="runPostGen()">📱 Пост үүсгэх</button>
      <div class="notice-box" id="post-gen-notice">
        💎 Кредит хүрэлцэхгүй байна — <a href="pricing.html">тариф сонгох →</a>
      </div>
      <div class="result" id="post-gen-result"></div>
    </div>
  </div>

  <!-- ── 13. Thumbnail гарчиг ── -->
  <div class="svc-card">
    <div class="svc-head">
      <div class="svc-ico rose">🖼️</div>
      <div class="svc-info">
        <div class="svc-name">Thumbnail гарчиг</div>
        <div class="svc-desc">YouTube thumbnail-д зориулсан богино, хүртэмжтэй монгол гарчиг үүсгэнэ.</div>
        <div class="badges">
          <span class="badge badge-free">Үнэгүй</span>
          <span class="badge badge-new">🆕 Шинэ</span>
          <span class="badge badge-credit">⚡ 2 кредит/гарчиг</span>
        </div>
      </div>
    </div>
    <button class="svc-btn" onclick="toggleBox('thumbnail-box',this)">🖼️ Туршиж үзэх</button>
    <div class="svc-box" id="thumbnail-box">
      <div class="cost-pill">⚡ Үнэ: 2 кредит/гарчиг</div>
      <label class="form-label">Видеогийн агуулга / сэдэв</label>
      <textarea id="thumbnail-input" placeholder="Видеогийн тухай товч тайлбарлана уу..."></textarea>
      <div style="display:flex;gap:8px;margin:10px 0;flex-wrap:wrap;">
        <label style="font-size:12px;color:rgba(255,255,255,0.5);">Хэлбэр:</label>
        <label style="display:flex;align-items:center;gap:5px;font-size:12px;color:rgba(255,255,255,0.5);cursor:pointer;"><input type="radio" name="thumb-style" value="shock" checked style="accent-color:#4ade80;"> Сонирхол татах</label>
        <label style="display:flex;align-items:center;gap:5px;font-size:12px;color:rgba(255,255,255,0.5);cursor:pointer;"><input type="radio" name="thumb-style" value="question" style="accent-color:#4ade80;"> Асуулт хэлбэр</label>
        <label style="display:flex;align-items:center;gap:5px;font-size:12px;color:rgba(255,255,255,0.5);cursor:pointer;"><input type="radio" name="thumb-style" value="list" style="accent-color:#4ade80;"> Жагсаалт</label>
      </div>
      <button class="run-btn" onclick="runThumbnail()">🖼️ Гарчиг үүсгэх</button>
      <div class="notice-box" id="thumbnail-notice">
        💎 Кредит хүрэлцэхгүй байна — <a href="pricing.html">тариф сонгох →</a>
      </div>
      <div class="result" id="thumbnail-result"></div>
    </div>
  </div>

  <!-- ── 14. Транскрипт засагч ── -->
  <div class="svc-card">
    <div class="svc-head">
      <div class="svc-ico lime">🧹</div>
      <div class="svc-info">
        <div class="svc-name">Транскрипт засагч</div>
        <div class="svc-desc">STT текстийн "ааа", "тэгээд", дүүргэгч үг болон давтагдсан хэсгийг цэвэрлэнэ.</div>
        <div class="badges">
          <span class="badge badge-free">Үнэгүй</span>
          <span class="badge badge-new">🆕 Шинэ</span>
          <span class="badge badge-credit">⚡ 1 тэмдэгт = 1 кредит</span>
        </div>
      </div>
    </div>
    <button class="svc-btn" onclick="toggleBox('transcript-clean-box',this)">🧹 Туршиж үзэх</button>
    <div class="svc-box" id="transcript-clean-box">
      <div class="cost-pill">⚡ Үнэ: 1 тэмдэгт = 1 кредит</div>
      <label class="form-label">Транскрипт текст (STT гаралт)</label>
      <textarea id="transcript-clean-input" placeholder="Тэгээд ааа... тиймээ тэгэхлээр тэр... тэгж байгаа юм уу..." style="height:120px;"></textarea>
      <div style="display:flex;gap:8px;margin-top:10px;flex-wrap:wrap;">
        <label style="display:flex;align-items:center;gap:6px;font-size:12px;color:rgba(255,255,255,0.5);cursor:pointer;">
          <input type="checkbox" id="clean-fillers" checked style="accent-color:#4ade80;"> Дүүргэгч үг
        </label>
        <label style="display:flex;align-items:center;gap:6px;font-size:12px;color:rgba(255,255,255,0.5);cursor:pointer;">
          <input type="checkbox" id="clean-repeat" checked style="accent-color:#4ade80;"> Давтагдсан хэсэг
        </label>
        <label style="display:flex;align-items:center;gap:6px;font-size:12px;color:rgba(255,255,255,0.5);cursor:pointer;">
          <input type="checkbox" id="clean-format" style="accent-color:#4ade80;"> Өгүүлбэр болгох
        </label>
      </div>
      <button class="run-btn" onclick="runTranscriptClean()">🧹 Цэвэрлэх</button>
      <div class="notice-box" id="transcript-clean-notice">
        💎 Кредит хүрэлцэхгүй байна — <a href="pricing.html">тариф сонгох →</a>
      </div>
      <div class="split" id="transcript-clean-result" style="display:none">
        <div class="split-card">
          <div class="split-label red">Анхны транскрипт</div>
          <div class="split-text" id="transcript-clean-before"></div>
        </div>
        <div class="split-card">
          <div class="split-label grn">Цэвэрлэсэн текст</div>
          <div class="split-text" id="transcript-clean-after"></div>
        </div>
      </div>
    </div>
  </div>

  <!-- ── 15. SEO гарчиг ── -->
  <div class="svc-card">
    <div class="svc-head">
      <div class="svc-ico sky">🔍</div>
      <div class="svc-info">
        <div class="svc-name">SEO гарчиг</div>
        <div class="svc-desc">Агуулгаас хайлтанд өндөр эрэмбэлэгдэх SEO гарчиг болон мета тайлбар үүсгэнэ.</div>
        <div class="badges">
          <span class="badge badge-free">Үнэгүй</span>
          <span class="badge badge-new">🆕 Шинэ</span>
          <span class="badge badge-credit">⚡ 5 кредит/иж бүрдэл</span>
        </div>
      </div>
    </div>
    <button class="svc-btn" onclick="toggleBox('seo-title-box',this)">🔍 Туршиж үзэх</button>
    <div class="svc-box" id="seo-title-box">
      <div class="cost-pill">⚡ Үнэ: 5 кредит/иж бүрдэл</div>
      <label class="form-label">Агуулга / Нийтлэлийн тайлбар</label>
      <textarea id="seo-title-input" placeholder="Нийтлэл, видео, эсвэл хуудасны агуулгыг товч тайлбарлана уу..."></textarea>
      <div style="display:flex;gap:8px;margin:10px 0;flex-wrap:wrap;">
        <label style="font-size:12px;color:rgba(255,255,255,0.5);">Зорилтот платформ:</label>
        <label style="display:flex;align-items:center;gap:5px;font-size:12px;color:rgba(255,255,255,0.5);cursor:pointer;"><input type="radio" name="seo-platform" value="web" checked style="accent-color:#4ade80;"> Вэб</label>
        <label style="display:flex;align-items:center;gap:5px;font-size:12px;color:rgba(255,255,255,0.5);cursor:pointer;"><input type="radio" name="seo-platform" value="youtube" style="accent-color:#4ade80;"> YouTube</label>
        <label style="display:flex;align-items:center;gap:5px;font-size:12px;color:rgba(255,255,255,0.5);cursor:pointer;"><input type="radio" name="seo-platform" value="social" style="accent-color:#4ade80;"> Нийгмийн сүлжээ</label>
      </div>
      <button class="run-btn" onclick="runSeoTitle()">🔍 SEO үүсгэх</button>
      <div class="notice-box" id="seo-title-notice">
        💎 Кредит хүрэлцэхгүй байна — <a href="pricing.html">тариф сонгох →</a>
      </div>
      <div class="result" id="seo-title-result"></div>
    </div>
  </div>

  <!-- ════════════════════════════════════ -->
  <!-- ТЕХНИКИЙН ХЭРЭГСЭЛ -->
  <!-- ════════════════════════════════════ -->
  <div class="section-title">Техникийн хэрэгсэл</div>

  <!-- ── 16. Plagiarism шалгагч ── -->
  <div class="svc-card">
    <div class="svc-head">
      <div class="svc-ico orange">🔎</div>
      <div class="svc-info">
        <div class="svc-name">Plagiarism шалгагч</div>
        <div class="svc-desc">Монгол текст дэх давхардсан агуулга, эх сурвалж дахин хэрэглэлтийг илрүүлнэ.</div>
        <div class="badges">
          <span class="badge badge-pro">Про</span>
          <span class="badge badge-new">🆕 Шинэ</span>
          <span class="badge badge-credit">⚡ 10 кредит/шалгалт</span>
        </div>
      </div>
    </div>
    <button class="svc-btn" onclick="toggleBox('plagiarism-box',this)">🔎 Туршиж үзэх</button>
    <div class="svc-box" id="plagiarism-box">
      <div class="cost-pill">⚡ Үнэ: 10 кредит/шалгалт</div>
      <label class="form-label">Шалгах монгол текст</label>
      <textarea id="plagiarism-input" placeholder="Шалгах текстийг энд оруулна уу..." style="height:130px;"></textarea>
      <button class="run-btn" onclick="runPlagiarism()">🔎 Шалгах</button>
      <div class="notice-box" id="plagiarism-notice">
        💎 Кредит хүрэлцэхгүй байна — <a href="pricing.html">тариф сонгох →</a>
      </div>
      <div class="result" id="plagiarism-result"></div>
    </div>
  </div>

  <!-- ── 17. PDF → Текст ── -->
  <div class="svc-card">
    <div class="svc-head">
      <div class="svc-ico red">📑</div>
      <div class="svc-info">
        <div class="svc-name">PDF → Текст (OCR)</div>
        <div class="svc-desc">Монгол PDF файлаас OCR технологиор текст гаргаж авна. Скан хийсэн баримт бичигт зориулсан.</div>
        <div class="badges">
          <span class="badge badge-free">Үнэгүй</span>
          <span class="badge badge-new">🆕 Шинэ</span>
          <span class="badge badge-credit">⚡ 5 кредит/хуудас</span>
        </div>
      </div>
    </div>
    <button class="svc-btn" onclick="toggleBox('pdf-ocr-box',this)">📑 Туршиж үзэх</button>
    <div class="svc-box" id="pdf-ocr-box">
      <div class="cost-pill">⚡ Үнэ: 5 кредит/хуудас</div>
      <label class="form-label">PDF файл оруулах</label>
      <div class="upload-area" id="pdf-ocr-area" onclick="document.getElementById('pdf-ocr-file').click()"
        ondragover="event.preventDefault();this.classList.add('drag')"
        ondragleave="this.classList.remove('drag')"
        ondrop="handlePdfOcrDrop(event)">
        <input type="file" id="pdf-ocr-file" accept=".pdf" onchange="handlePdfOcrFile(event)">
        <div class="upload-icon">📄</div>
        <div style="font-size:13px;color:rgba(255,255,255,0.5)">PDF файл оруулах (хамгийн ихдээ 20 хуудас)</div>
        <div style="font-size:11px;color:rgba(255,255,255,0.25);margin-top:4px">эсвэл энд чирж тавих</div>
        <div class="upload-name" id="pdf-ocr-file-name"></div>
      </div>
      <div id="pdf-ocr-info" style="font-size:12px;color:rgba(255,255,255,0.4);margin-bottom:8px;display:none"></div>
      <button class="run-btn" onclick="runPdfOcr()">📑 Текст гаргах</button>
      <div class="notice-box" id="pdf-ocr-notice">
        💎 Кредит хүрэлцэхгүй байна — <a href="pricing.html">тариф сонгох →</a>
      </div>
      <div class="result" id="pdf-ocr-result"></div>
    </div>
  </div>

  <!-- ── 18. AI илрүүлэгч ── -->
  <div class="svc-card">
    <div class="svc-head">
      <div class="svc-ico fuchsia">🤖</div>
      <div class="svc-info">
        <div class="svc-name">AI илрүүлэгч</div>
        <div class="svc-desc">Монгол текст AI-р бичигдсэн эсэхийг тодорхойлж, магадлалыг харуулна.</div>
        <div class="badges">
          <span class="badge badge-free">Үнэгүй</span>
          <span class="badge badge-new">🆕 Шинэ</span>
          <span class="badge badge-credit">⚡ 5 кредит/шалгалт</span>
        </div>
      </div>
    </div>
    <button class="svc-btn" onclick="toggleBox('ai-detect-box',this)">🤖 Туршиж үзэх</button>
    <div class="svc-box" id="ai-detect-box">
      <div class="cost-pill">⚡ Үнэ: 5 кредит/шалгалт</div>
      <label class="form-label">Шалгах текст</label>
      <textarea id="ai-detect-input" placeholder="AI-р бичигдсэн эсэхийг шалгах монгол текстийг оруулна уу..." style="height:130px;"></textarea>
      <button class="run-btn" onclick="runAiDetect()">🤖 Шалгах</button>
      <div class="notice-box" id="ai-detect-notice">
        💎 Кредит хүрэлцэхгүй байна — <a href="pricing.html">тариф сонгох →</a>
      </div>
      <div class="result" id="ai-detect-result"></div>
    </div>
  </div>

  <!-- ── 19. Монгол Chatbot ── -->
  <div class="svc-card">
    <div class="svc-head">
      <div class="svc-ico green">💬</div>
      <div class="svc-info">
        <div class="svc-name">Монгол Chatbot</div>
        <div class="svc-desc">КиноЭзэн сайтын агуулгаас суралцсан AI туслах. Кино, мэдээ, үйлчилгээний асуултад хариулна.</div>
        <div class="badges">
          <span class="badge badge-free">Үнэгүй</span>
          <span class="badge badge-new">🆕 Шинэ</span>
          <span class="badge badge-hot">Beta</span>
          <span class="badge badge-credit">⚡ 2 кредит/хариулт</span>
        </div>
      </div>
    </div>
    <button class="svc-btn" onclick="toggleBox('chatbot-box',this)">💬 Чат эхлэх</button>
    <div class="svc-box" id="chatbot-box">
      <div class="cost-pill">⚡ Үнэ: 2 кредит/хариулт</div>
      <div id="chatbot-messages" style="background:rgba(255,255,255,0.03);border-radius:10px;padding:12px;min-height:180px;max-height:320px;overflow-y:auto;margin-bottom:10px;border:1px solid rgba(255,255,255,0.07);">
        <div style="display:flex;gap:8px;margin-bottom:10px;">
          <div style="width:28px;height:28px;border-radius:50%;background:linear-gradient(135deg,#059669,#4ade80);display:flex;align-items:center;justify-content:center;font-size:13px;flex-shrink:0;">🤖</div>
          <div style="background:rgba(74,222,128,0.08);border-radius:0 10px 10px 10px;padding:10px 12px;font-size:13px;color:rgba(255,255,255,0.8);line-height:1.6;max-width:calc(100% - 40px);">Сайн байна уу! Би КиноЭзэний AI туслах. Кино, сериал, үйлчилгээний тухай асуугаарай 🎬</div>
        </div>
      </div>
      <div style="display:flex;gap:8px;">
        <input type="text" id="chatbot-input" placeholder="Асуулт бичнэ үү..." style="flex:1;" onkeydown="if(event.key==='Enter')runChatbot()">
        <button onclick="runChatbot()" style="padding:12px 16px;border-radius:10px;background:linear-gradient(90deg,#4ade80,#f4a261);border:none;color:#0a2a0a;font-size:14px;font-weight:700;cursor:pointer;white-space:nowrap;">➤</button>
      </div>
      <div class="notice-box" id="chatbot-notice">
        💎 Кредит хүрэлцэхгүй байна — <a href="pricing.html">тариф сонгох →</a>
      </div>
    </div>
  </div>

</div><!-- /services -->

<div class="footer">© 2025 КиноЭзэн — Монгол хэлний кино платформ</div>

<nav class="mobile-bottom-nav">
  <div class="mbn-inner">
    <a class="mbn-item" href="index.html">
      <svg viewBox="0 0 24 24"><path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H5a1 1 0 01-1-1V9.5z"/><path d="M9 21V12h6v9"/></svg>
      <span>Нүүр</span>
    </a>
    <a class="mbn-item" href="movies.html">
      <svg viewBox="0 0 24 24"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 2l-4 5M8 2l4 5"/></svg>
      <span>Кино</span>
    </a>
    <a class="mbn-item" href="news.html">
      <svg viewBox="0 0 24 24"><path d="M4 6h16M4 10h16M4 14h10"/><rect x="2" y="3" width="20" height="18" rx="2"/></svg>
      <span>Мэдээ</span>
    </a>
    <a class="mbn-item active" href="services.html">
      <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path d="M19.07 4.93a10 10 0 010 14.14M4.93 4.93a10 10 0 000 14.14"/></svg>
      <span>Үйлчилгээ</span>
    </a>
    <a class="mbn-item" href="profile.html">
      <svg viewBox="0 0 24 24"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg>
      <span>Профайл</span>
    </a>
  </div>
</nav>

<script src="services.js"></script>
</body>
</html>
