const CACHE_NAME = 'focusforge-v1';
const ASSETS = [
  '.',
  'index.html',
  'assets/css/style.css',
  'assets/js/app.js',
  'assets/images/logo.svg'
];

self.addEventListener('install', (evt) => {
  evt.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (evt) => {
  evt.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
    ))
  );
  self.clients.claim();
});

self.addEventListener('fetch', (evt) => {
  if (evt.request.method !== 'GET') return;
  const url = new URL(evt.request.url);
  // Prefer cache, then network for same-origin assets
  evt.respondWith(
    caches.match(evt.request).then(cached => cached || fetch(evt.request).then(resp => {
      // Cache new GET responses for future visits
      if (resp && resp.status === 200 && resp.type !== 'opaque') {
        const respClone = resp.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(evt.request, respClone));
      }
      return resp;
    }).catch(() => {
      // Fallback to index.html for navigation requests
      if (evt.request.mode === 'navigate') return caches.match('index.html');
    }))
  );
});