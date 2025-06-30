const CACHE_NAME = 'votos2025-cache-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/styles.css',
  '/script.js',
  '/logo.jpg',
  '/admin-panel.html',
  '/login.html',
  '/favicon.ico/favicon.ico',
  '/favicon.ico/manifest.json',
  // Agrega aquí otros archivos críticos si es necesario
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(urlsToCache))
  );
});

self.addEventListener('fetch', event => {
  // No intentar hacer fetch a localhost si no estamos en desarrollo
  if (event.request.url.includes('localhost') && !self.location.hostname.includes('localhost')) {
    console.log('🚫 Bloqueando fetch a localhost en producción:', event.request.url);
    return;
  }
  
  event.respondWith(
    caches.match(event.request).then(response => {
      if (response) {
        return response;
      }
      // Solo hacer fetch si no es una URL de localhost
      if (!event.request.url.includes('localhost')) {
        return fetch(event.request).catch(error => {
          console.log('❌ Error en fetch:', error);
          // Retornar una respuesta vacía en caso de error
          return new Response('', { status: 404 });
        });
      }
      // Para URLs de localhost, retornar respuesta vacía
      return new Response('', { status: 404 });
    })
  );
}); 