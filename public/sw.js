
// Enhanced Service Worker with Stale-While-Revalidate Strategy
// Version bumped to v9 to force cache update for V3 audio fix
const CACHE_NAME = 'formula-racing-trivia-v9';
const urlsToCache = [
  '/',
  '/manifest.json',
  '/icon-192x192.png',
  '/icon-512x512.png',
  '/formula-trivia-launch.jpg',
  '/apple-touch-icon.png'
];

// Install service worker and cache core assets
self.addEventListener('install', (event) => {
  console.log('[SW] Installing Service Worker v8...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[SW] Caching core assets');
        return cache.addAll(urlsToCache);
      })
      .then(() => {
        console.log('[SW] Skip waiting to activate immediately');
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('[SW] Cache installation failed:', error);
      })
  );
});

// Activate service worker and clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating Service Worker v8...');
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME) {
              console.log('[SW] Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('[SW] Service Worker v8 activated! 🚀');
        console.log('[SW] Taking control of all clients');
        return self.clients.claim();
      })
      .then(() => {
        // Notify all clients that a new version is available
        return self.clients.matchAll().then((clients) => {
          clients.forEach((client) => {
            client.postMessage({
              type: 'SW_UPDATED',
              version: 'v8',
              message: 'New version available!'
            });
          });
        });
      })
  );
});

// Fetch event - Stale-While-Revalidate strategy
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Skip API calls and auth endpoints (always use network)
  if (url.pathname.startsWith('/api/') || url.pathname.includes('auth')) {
    event.respondWith(fetch(request));
    return;
  }

  // For images: Stale-While-Revalidate
  if (request.destination === 'image' || url.pathname.match(/\.(jpg|jpeg|png|gif|webp|svg|ico)$/i)) {
    event.respondWith(staleWhileRevalidate(request));
    return;
  }

  // For other assets: Cache-first with network fallback
  event.respondWith(
    caches.match(request)
      .then((cachedResponse) => {
        if (cachedResponse) {
          // Return cached version immediately
          return cachedResponse;
        }
        // If not in cache, fetch from network
        return fetch(request)
          .then((response) => {
            // Cache the new response for future use
            if (response.status === 200) {
              const responseClone = response.clone();
              caches.open(CACHE_NAME).then((cache) => {
                cache.put(request, responseClone);
              });
            }
            return response;
          });
      })
      .catch(() => {
        // Return offline fallback if available
        if (request.destination === 'document') {
          return caches.match('/');
        }
      })
  );
});

// Stale-While-Revalidate Strategy
async function staleWhileRevalidate(request) {
  const cache = await caches.open(CACHE_NAME);
  const cachedResponse = await cache.match(request);
  
  // Fetch from network in background
  const fetchPromise = fetch(request)
    .then((networkResponse) => {
      // Update cache with fresh content
      if (networkResponse.status === 200) {
        cache.put(request, networkResponse.clone());
      }
      return networkResponse;
    })
    .catch((error) => {
      console.log('[SW] Network fetch failed:', error);
      return cachedResponse; // Fallback to cache if network fails
    });

  // Return cached response immediately, or wait for network
  return cachedResponse || fetchPromise;
}

// Handle messages from clients
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    console.log('[SW] Received SKIP_WAITING message');
    self.skipWaiting();
  }
});

// Background sync for offline actions (future enhancement)
self.addEventListener('sync', (event) => {
  console.log('[SW] Background sync event:', event.tag);
});
