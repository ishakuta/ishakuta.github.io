// Thought Capture PWA - Service Worker
// Handles background sync when app is closed

const CACHE_NAME = 'thought-capture-v3'; // Multi-file architecture
const ASSETS_TO_CACHE = [
  '/thoughts/',
  '/thoughts/index.html',
  '/thoughts/manifest.json',
  '/thoughts/styles.css',
  '/thoughts/js/app.js',
  '/thoughts/js/components/capture-area.js',
  '/thoughts/js/components/settings-modal.js',
  '/thoughts/js/components/thoughts-list.js',
  '/thoughts/js/services/storage.js',
  '/thoughts/js/services/sync.js',
  '/thoughts/js/utils/datetime.js',
  '/thoughts/js/utils/markdown.js'
];

// Install event - cache assets
self.addEventListener('install', event => {
  console.log('[SW] Installing...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(ASSETS_TO_CACHE))
      .then(() => {
        console.log('[SW] Skip waiting - activating new SW immediately');
        return self.skipWaiting();
      })
  );
});

// Activate event - clean old caches
self.addEventListener('activate', event => {
  console.log('[SW] Activating...');
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames
          .filter(name => name !== CACHE_NAME)
          .map(name => {
            console.log('[SW] Deleting old cache:', name);
            return caches.delete(name);
          })
      );
    }).then(() => {
      console.log('[SW] Claiming clients - taking control immediately');
      return self.clients.claim();
    }).then(() => {
      // Notify all clients that SW has updated
      return self.clients.matchAll().then(clients => {
        clients.forEach(client => {
          client.postMessage({
            type: 'SW_UPDATED',
            version: CACHE_NAME
          });
        });
      });
    })
  );
});

// Fetch event - network first, fallback to cache
self.addEventListener('fetch', event => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') return;

  // Skip GitHub API requests (always need fresh)
  if (event.request.url.includes('api.github.com')) return;

  event.respondWith(
    fetch(event.request)
      .catch(() => {
        return caches.match(event.request).then(cachedResponse => {
          if (cachedResponse) {
            return cachedResponse;
          }
          // No cache found, return 404
          return new Response('Not found', {
            status: 404,
            statusText: 'Not Found'
          });
        });
      })
  );
});

// Background Sync event - sync thoughts to GitHub
self.addEventListener('sync', event => {
  console.log('[SW] Background sync event:', event.tag);

  if (event.tag === 'sync-thoughts') {
    event.waitUntil(syncThoughtsInBackground());
  }
});

async function syncThoughtsInBackground() {
  console.log('[SW] Starting background sync...');

  try {
    // Get all clients (open tabs/windows)
    const clients = await self.clients.matchAll({ type: 'window' });

    if (clients.length > 0) {
      // App is open - message it to sync
      console.log('[SW] App is open, messaging client to sync');
      clients.forEach(client => {
        client.postMessage({
          type: 'BACKGROUND_SYNC_REQUESTED'
        });
      });
    } else {
      // App is closed - can't access localStorage
      // For full offline sync, would need IndexedDB migration
      console.log('[SW] App is closed, cannot sync (localStorage not accessible from SW)');
      console.log('[SW] Sync will occur when app reopens');

      // Note: This is a known limitation. To sync when app is fully closed,
      // we'd need to migrate from localStorage to IndexedDB.
      // Current implementation syncs when:
      // 1. App is open (immediate or delayed via Background Sync)
      // 2. App reopens (checks for unsynced thoughts)
    }

    return Promise.resolve();
  } catch (err) {
    console.error('[SW] Background sync failed:', err);
    return Promise.reject(err);
  }
}

// Message handler - for future use
self.addEventListener('message', event => {
  console.log('[SW] Message received:', event.data);

  if (event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

console.log('[SW] Service Worker loaded');
