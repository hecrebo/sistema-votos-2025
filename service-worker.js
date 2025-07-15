const CACHE_NAME = 'votos2025-cache-v4'; // Incremented cache version
const urlsToCache = [
  // Core HTML
  './', // Alias for index.html
  './index.html',
  './login.html',
  './admin-panel.html',
  './offline.html',
  './estadisticas-avanzadas.html',

  // Styles
  './styles.css',
  './estadisticas-avanzadas.css',

  // Core JS
  './config.js',
  './script-firebase.js', // Firebase specific logic
  './firebase-config.js',
  './queue-manager.js',
  './sync-manager.js',
  './service-manager.js',
  './auto-init.js',
  './init-system.js',
  './pwa-installer.js',

  // Admin Panel JS
  './admin-dashboard.js',
  './admin-sync-panel.js',

  // Estadísticas avanzadas JS
  './estadisticas-avanzadas.js',

  // Key Images
  './logo.jpg',
  './logo 2.png',

  // PWA Manifest & Core Icons
  './manifest.json',
  './logo 2.png',
  
  // External libraries (cache for offline)
  'https://cdnjs.cloudflare.com/ajax/libs/Chart.js/3.9.1/chart.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.8.2/jspdf.plugin.autotable.min.js',
  'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap',
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
    icon: './logo 2.png',
    badge: './logo 2.png',
    tag: 'voto-notification',
    requireInteraction: true,
    actions: [
      {
        action: 'view',
        title: 'Ver',
        icon: './logo 2.png'
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
        .then(response => {
          // Cache successful responses
          if (response.status === 200) {
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then(cache => {
              cache.put(event.request, responseClone);
            });
          }
          return response;
        })
        .catch(() => {
          return caches.match(event.request)
            .then(response => {
              return response || caches.match('./offline.html');
            });
        })
    );
    return;
  }

  // For static assets, use cache first, then network
  if (event.request.destination === 'script' || 
      event.request.destination === 'style' || 
      event.request.destination === 'image' ||
      event.request.url.includes('cdnjs.cloudflare.com') ||
      event.request.url.includes('fonts.googleapis.com')) {
    event.respondWith(
      caches.match(event.request)
        .then(response => {
          return response || fetch(event.request)
            .then(fetchResponse => {
              // Cache successful responses
              if (fetchResponse.status === 200) {
                const responseClone = fetchResponse.clone();
                caches.open(CACHE_NAME).then(cache => {
                  cache.put(event.request, responseClone);
                });
              }
              return fetchResponse;
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