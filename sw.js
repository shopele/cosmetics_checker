// Service Worker（オフライン対応）
// 静的アセットをキャッシュし、ネットワーク切断時でもアプリと履歴を閲覧可能にする
const CACHE_NAME = 'yakki-checker-v1';
const ASSETS = [
  '/',
  '/index.html',
  '/css/style.css',
  '/js/app.js',
  '/js/rules.js'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS)).catch(() => {})
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
    ))
  );
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  const req = event.request;
  const url = new URL(req.url);

  // API リクエストはキャッシュしない（常にネットワーク）
  if (url.pathname.startsWith('/api/')) return;

  // 静的アセットは cache-first
  if (req.method === 'GET' && url.origin === self.location.origin) {
    event.respondWith(
      caches.match(req).then(cached => {
        if (cached) return cached;
        return fetch(req).then(res => {
          // 成功時のみキャッシュ更新（チャンクなど）
          if (res.ok && req.url.match(/\.(html|css|js)$/)) {
            const clone = res.clone();
            caches.open(CACHE_NAME).then(cache => cache.put(req, clone));
          }
          return res;
        }).catch(() => cached || new Response(
          'オフラインです。ネットワーク接続を確認してください。',
          { status: 503, statusText: 'Service Unavailable', headers: { 'Content-Type': 'text/plain; charset=utf-8' } }
        ));
      })
    );
  }
});
