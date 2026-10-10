/* ============================================================
   AuditPro - Service Worker
   Cache-first strategy for all static assets.
   Data is stored locally (file or IndexedDB) so the app works
   fully offline once installed. Google Fonts are cached
   opportunistically on first successful online load so the
   distinctive typography also persists offline afterwards.
   ============================================================ */

const CACHE_NAME = 'auditpro-v4.4';
const FONTS_CACHE = 'auditpro-fonts-v1';
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './css/main.css',
  './css/components.css',
  './css/print.css',
  './js/storage.js',
  './js/db.js',
  './js/utils.js',
  './js/app.js',
  './js/modules/attachments.js',
  './js/modules/audit-trail.js',
  './js/modules/clients.js',
  './js/modules/dashboard.js',
  './js/modules/findings.js',
  './js/modules/letters.js',
  './js/modules/materiality.js',
  './js/modules/planning.js',
  './js/modules/programs.js',
  './js/modules/quality.js',
  './js/modules/reports.js',
  './js/modules/search.js',
  './js/modules/settings.js',
  './js/modules/tools.js',
  './js/modules/workpapers.js'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME && k !== FONTS_CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const url = event.request.url;

  // خطوط Google Fonts (عابرة النطاق): تخزين مؤقت انتهازي — استخدام
  // النسخة المخزَّنة فوراً إن وُجدت، وتحديثها في الخلفية عند الاتصال
  // (Stale-While-Revalidate)، بحيث تعمل الخطوط المميّزة دون اتصال
  // أيضاً بعد أول تحميل ناجح للتطبيق.
  if (url.startsWith('https://fonts.googleapis.com') || url.startsWith('https://fonts.gstatic.com')) {
    event.respondWith(
      caches.open(FONTS_CACHE).then(cache =>
        cache.match(event.request).then(cached => {
          const network = fetch(event.request).then(response => {
            if (response && response.status === 200) cache.put(event.request, response.clone());
            return response;
          }).catch(() => cached);
          return cached || network;
        })
      )
    );
    return;
  }

  // Only intercept same-origin requests for our own assets
  if (!url.startsWith(self.location.origin)) return;
  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;
      return fetch(event.request).then(response => {
        if (!response || response.status !== 200 || response.type !== 'basic') return response;
        const clone = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        return response;
      }).catch(() => {
        // If offline and not cached, return a basic offline page
        if (event.request.mode === 'navigate') return caches.match('./index.html');
      });
    })
  );
});
