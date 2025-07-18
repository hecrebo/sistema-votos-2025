const CACHE_NAME = 'votos2025-cache-v3'; // Incremented cache version
const urlsToCache = [
  // Core HTML
  './', // Alias for index.html
  './index.html',
  './login.html',
  './admin-panel.html',
  './offline.html',

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
  './manifest.json',
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

// Background sync for offline data
const BACKGROUND_SYNC_TAG = 'votos2025-sync';

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        return cache.addAll(urlsToCache);
      })
      .catch(error => {
        // Solo log crítico en caso de error real
        console.error('[Service Worker] Error crítico al cachear:', error);
      })
  );
  // Skip waiting to activate immediately
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    Promise.all([
      // Clean up old caches
      caches.keys().then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => {
            if (cacheName !== CACHE_NAME) {
              return caches.delete(cacheName);
            }
          })
        );
      }),
      // Take control of all clients immediately
      self.clients.claim()
    ])
  );
});

// Background sync for offline data
self.addEventListener('sync', event => {
  if (event.tag === BACKGROUND_SYNC_TAG) {
    event.waitUntil(
      syncOfflineData()
    );
  }
});

// Push notifications
self.addEventListener('push', event => {
  let notificationData = {
    title: 'Sistema de Votos 2025',
    body: 'Nuevo voto registrado',
    icon: './favicon.ico/android-icon-192x192.png',
    badge: './favicon.ico/android-icon-96x96.png',
    tag: 'voto-notification',
    requireInteraction: true,
    actions: [
      {
        action: 'view',
        title: 'Ver',
        icon: './favicon.ico/android-icon-96x96.png'
      },
      {
        action: 'dismiss',
        title: 'Cerrar'
      }
    ]
  };

  // Try to parse push data
  if (event.data) {
    try {
      const data = event.data.json();
      notificationData = { ...notificationData, ...data };
    } catch (e) {
      // Error silencioso para datos push inválidos
    }
  }

  event.waitUntil(
    self.registration.showNotification(notificationData.title, notificationData)
  );
});

// Handle notification clicks
self.addEventListener('notificationclick', event => {
  event.notification.close();

  if (event.action === 'view') {
    event.waitUntil(
      clients.openWindow('./index.html?page=statistics')
    );
  } else if (event.action === 'dismiss') {
    // Just close the notification
    return;
  } else {
    // Default action - open the app
    event.waitUntil(
      clients.openWindow('./index.html')
    );
  }
});

// Handle notification close
self.addEventListener('notificationclose', event => {
  // Evento silencioso
});

// Background sync function
async function syncOfflineData() {
  try {
    // Get all clients
    const clients = await self.clients.matchAll();
    
    // Send sync message to all clients
    clients.forEach(client => {
      client.postMessage({
        type: 'SYNC_OFFLINE_DATA',
        timestamp: Date.now()
      });
    });
  } catch (error) {
    // Solo log crítico en caso de error real
    console.error('[Service Worker] Error crítico en sincronización:', error);
  }
}

self.addEventListener('fetch', event => {
  // For navigation requests, try network first, then cache, then offline page
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .catch(() => {
          return caches.match(event.request)
            .then(response => {
              return response || caches.match('./offline.html'); // Use custom offline page
            });
        })
    );
    return;
  }

  // For API requests, use network first with background sync
  if (event.request.url.includes('/api/') || event.request.url.includes('firebase')) {
    event.respondWith(
      fetch(event.request)
        .catch(() => {
          // If network fails, register background sync
          if ('serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype) {
            navigator.serviceWorker.ready.then(registration => {
              registration.sync.register(BACKGROUND_SYNC_TAG);
            });
          }
          // Return cached response if available
          return caches.match(event.request);
        })
    );
    return;
  }

  // For other requests (CSS, JS, images), use cache-first strategy
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        if (response) {
          return response;
        }
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
        // Solo log crítico en caso de error real
        console.error('[Service Worker] Error crítico en fetch:', error, event.request.url);
        // Optionally, provide a fallback for specific asset types, e.g., a placeholder image
        // if (event.request.destination === 'image') {
        //   return caches.match('./placeholder-image.png');
        // }
      })
  );
});

// Handle messages from the main thread
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'GET_VERSION') {
    event.ports[0].postMessage({ version: CACHE_NAME });
  }
}); 