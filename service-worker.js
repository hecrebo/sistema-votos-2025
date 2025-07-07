const CACHE_NAME = 'votos2025-cache-v2'; // Incremented cache version
const urlsToCache = [
  // Core HTML
  './', // Alias for index.html
  './index.html',
  './login.html',
  './admin-panel.html',

  // Styles
  './styles.css',

  // Core JS
  './config.js',
  './script.js', // Main logic for index.html
  './script-firebase.js', // Firebase specific logic
  './firebase-config.js',
  './queue-manager.js',
  './sync-manager.js',
  './service-manager.js',
  './auto-init.js',
  './init-system.js',

  // Admin Panel JS (if it should work offline)
  './admin-dashboard.js',
  './admin-sync-panel.js',

  // Key Images
  './logo.jpg',

  // PWA Manifest & Core Icons (ensure these paths match your manifest and HTML)
  './favicon.ico/manifest.json',
  './favicon.ico/favicon.ico',
  './favicon.ico/android-icon-192x192.png',
  './favicon.ico/apple-icon-180x180.png',
  './favicon.ico/favicon-32x32.png',
  './favicon.ico/favicon-16x16.png',
  // Add other icon sizes if they are critical and frequently used by devices
  // e.g. './favicon.ico/ms-icon-144x144.png'

  // Potentially cache test/debug files if needed for offline debugging, otherwise omit
  // './test-automatico.js',
  // './test-proyeccion.js',
  // './debug-ubch-filter.js',
  // './test-filtro-ubch.js',
  // './test-exportacion-mejorada.js',
];

self.addEventListener('install', event => {
  console.log('[Service Worker] Install event');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('[Service Worker] Caching app shell');
        return cache.addAll(urlsToCache);
      })
      .catch(error => {
        console.error('[Service Worker] Failed to cache app shell:', error);
      })
  );
});

self.addEventListener('activate', event => {
  console.log('[Service Worker] Activate event');
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('[Service Worker] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  return self.clients.claim(); // Ensure new SW takes control immediately
});

self.addEventListener('fetch', event => {
  // For navigation requests, try network first, then cache, then offline page
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .catch(() => {
          return caches.match(event.request)
            .then(response => {
              return response || caches.match('./index.html'); // Fallback to index.html or an offline.html page
            });
        })
    );
    return;
  }

  // For other requests (CSS, JS, images), use cache-first strategy
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        if (response) {
          // console.log('[Service Worker] Serving from cache:', event.request.url);
          return response;
        }
        // console.log('[Service Worker] Fetching from network:', event.request.url);
        return fetch(event.request).then(
          networkResponse => {
            // Optionally, cache new requests dynamically if needed (e.g., for images not in urlsToCache)
            // Be careful with caching everything, especially API responses if not handled properly.
            // Example: Caching images on the fly
            if (event.request.destination === 'image') {
              return caches.open(CACHE_NAME).then(cache => {
                cache.put(event.request, networkResponse.clone());
                return networkResponse;
              });
            }
            return networkResponse;
          }
        );
      })
      .catch(error => {
        console.error('[Service Worker] Fetch error:', error, event.request.url);
        // Optionally, provide a fallback for specific asset types, e.g., a placeholder image
        // if (event.request.destination === 'image') {
        //   return caches.match('./placeholder-image.png');
        // }
      })
  );
}); 