// ============================================================
// services.js — КиноЭзэн AI Үйлчилгээнүүд (БҮРЭН ХУВИЛБАР)
// ============================================================

// ===== Үйлчилгээ бүрийн холбоос =====
const SERVICE_LINKS = {
  // Аудио / Дуу
  tts: 'tts.html',
  stt: 'speech-to-text.html',
  transcript_cleaner: 'transcript-cleaner.html',

  // Зураг / Дизайн
  ai_image: 'ai-image.html',
  thumbnail_title: 'thumbnail-title.html',

  // Бичвэр / Контент
  humanizer: 'humanizer.html',
  translate: 'translate.html',
  text_editor: 'text-editor.html',
  post_generator: 'post-generator.html',
  seo_title: 'seo-title.html',
  plagiarism: 'plagiarism-checker.html',
  pdf_ocr: 'pdf-ocr.html',

  // Кино / Видео
  srt: 'srt-translate.html',
  script: 'script-writer.html',
  subtitle_mux: 'subtitle-mux.html',
  video_splitter: 'video-splitter.html',
  name_translate: 'name-translate.html',

  // AI туслах
  movie_review: 'movie-review.html',
  ai_detector: 'ai-detector.html',
  chatbot: 'chatbot.html'
};

// ===== Үйлчилгээний нэрс (товчнуудтай тааруулах) =====
const SERVICE_KEYS = {
  'TTS': 'tts',
  'AI Зураг': 'ai_image',
  'Humanizer': 'humanizer',
  'SRT Орчуулагч': 'srt',
  'Script бичигч': 'script',
  'Орчуулагч': 'translate',
  'Дуу → Текст': 'stt',
  'Текст засагч': 'text_editor',
  'Кино тоймч': 'movie_review',
  'Субтитр нийлүүлэгч': 'subtitle_mux',
  'Видео хуваагч': 'video_splitter',
  'Дүрийн нэр орчуулагч': 'name_translate',
  'Пост үүсгэгч': 'post_generator',
  'Thumbnail гарчиг': 'thumbnail_title',
  'Транскрипт засагч': 'transcript_cleaner',
  'SEO гарчиг': 'seo_title',
  'Plagiarism шалгагч': 'plagiarism',
  'PDF → Текст (OCR)': 'pdf_ocr',
  'AI илрүүлэгч': 'ai_detector',
  'Монгол Chatbot': 'chatbot'
};

// ===== Үйлчилгээ нээх функц =====
function openService(serviceKey) {
  const url = SERVICE_LINKS[serviceKey];
  if (url) {
    window.location.href = url;
  } else {
    showToast('❌ Энэ үйлчилгээ одоогоор бэлэн биш байна. Тун удахгүй нээгдэнэ!', 'warning');
  }
}

// ===== Toast мэдэгдэл =====
function showToast(message, type = 'info') {
  const old = document.querySelector('.toast');
  if (old) old.remove();
  
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.textContent = message;
  toast.style.cssText = `
    position: fixed;
    bottom: 100px;
    left: 50%;
    transform: translateX(-50%);
    background: ${type === 'success' ? 'rgba(74,222,128,0.15)' : 'rgba(255,255,255,0.08)'};
    color: ${type === 'success' ? '#4ade80' : '#fff'};
    padding: 12px 24px;
    border-radius: 12px;
    font-size: 14px;
    font-weight: 600;
    font-family: 'Nunito', sans-serif;
    z-index: 9999;
    border: 1px solid ${type === 'success' ? 'rgba(74,222,128,0.3)' : 'rgba(255,255,255,0.1)'};
    backdrop-filter: blur(12px);
    box-shadow: 0 8px 32px rgba(0,0,0,0.4);
    transition: all 0.3s;
  `;
  document.body.appendChild(toast);
  
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(-50%) translateY(20px)';
    setTimeout(() => toast.remove(), 400);
  }, 3000);
}

// ============================================================
// АВТОМАТААР ТОВЧНУУДЫГ ХОЛБОХ
// ============================================================
document.addEventListener('DOMContentLoaded', function() {
  
  // 1. Бүх "Турших" товчнуудыг олох
  const tryBtns = document.querySelectorAll('.try-btn');
  
  tryBtns.forEach(btn => {
    btn.addEventListener('click', function(e) {
      e.stopPropagation();
      
      // Кардны өгөгдлийг авах
      const card = this.closest('.service-card');
      if (!card) {
        showToast('⚠️ Кард олдсонгүй', 'warning');
        return;
      }
      
      // Гарчгийг авах
      const titleEl = card.querySelector('h3');
      const title = titleEl ? titleEl.textContent.trim() : '';
      
      // Түлхүүрийг олох
      let key = null;
      
      // Яг таарч байгаа эсэх
      if (SERVICE_KEYS[title]) {
        key = SERVICE_KEYS[title];
      } else {
        // Хэсэгчлэн тааруулах
        for (const [name, k] of Object.entries(SERVICE_KEYS)) {
          if (title.includes(name) || name.includes(title)) {
            key = k;
            break;
          }
        }
      }
      
      // Хэрэв түлхүүр олдсон бол нээх
      if (key) {
        openService(key);
      } else {
        showToast(`⚠️ "${title}" үйлчилгээний холбоос олдсонгүй`, 'warning');
      }
    });
  });
  
  // 2. Filter товчнууд
  const filterBtns = document.querySelectorAll('.filter-btn');
  const serviceCards = document.querySelectorAll('.service-card');
  
  filterBtns.forEach(btn => {
    btn.addEventListener('click', function() {
      filterBtns.forEach(b => b.classList.remove('active'));
      this.classList.add('active');
      
      const filter = this.dataset.filter;
      
      serviceCards.forEach(card => {
        const category = card.dataset.category;
        if (filter === 'all' || category === filter) {
          card.classList.remove('hidden');
        } else {
          card.classList.add('hidden');
        }
      });
    });
  });
  
  console.log('✅ services.js ачаалагдлаа! Бүртгэлтэй үйлчилгээний тоо:', Object.keys(SERVICE_LINKS).length);
});
