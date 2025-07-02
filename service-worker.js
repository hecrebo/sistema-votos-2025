const CACHE_NAME = 'votos2025-cache-v1';
const urlsToCache = [
  './',
  './index.html',
  './styles.css',
  './script-firebase.js',
  './firebase-config.js',
  './logo.jpg',
  './admin-panel.html',
  './login.html',
  './favicon.ico/favicon.ico',
  './favicon.ico/manifest.json',
  // Agrega aquí otros archivos críticos si es necesario
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(urlsToCache))
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(response => response || fetch(event.request))
  );
}); 