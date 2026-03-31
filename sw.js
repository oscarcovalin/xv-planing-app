const CACHE_NAME = 'xv-planner-v4';
const ASSETS = [
  './',
  './index.html',
  './style.css',
  './app.js',
  './logo.png',
  './manifest.json',
  'https://fonts.googleapis.com/css2?family=Montserrat:ital,wght@0,300;0,400;0,500;0,600;0,700;0,800;1,400;1,600&display=swap',
  'https://cdn.jsdelivr.net/npm/canvas-confetti@1.6.0/dist/confetti.browser.min.js'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('[SW] Guardando caché inicial');
        return cache.addAll(ASSETS);
      })
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.map(key => {
          if (key !== CACHE_NAME) {
            console.log('[SW] Borrando caché vieja:', key);
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Cache, fall back to network
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  
  event.respondWith(
    caches.match(event.request).then(cachedResponse => {
      return cachedResponse || fetch(event.request).then(fetchResponse => {
        return caches.open(CACHE_NAME).then(cache => {
          // Solo guardamos tráfico estático/assets
          cache.put(event.request, fetchResponse.clone());
          return fetchResponse;
        });
      });
    }).catch(() => {
      // Fallback offline genérico si la red falla y no está en caché (ej. una nueva imagen).
    })
  );
});
