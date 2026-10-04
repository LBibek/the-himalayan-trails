/**
 * The Himalayan Trails — Wilderness Offline Service Worker
 * Version: 1.0.0
 */

const CACHE_NAME = 'himalayan-trails-offline-v1';
const PRECACHE_URLS = [
  '/',
  '/offline',
  '/manifest.json',
  '/logo.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => {
        return cache.addAll(PRECACHE_URLS).catch((err) => {
          console.warn('[Wilderness SW] Precache partial error:', err);
        });
      })
      .then(() => {
        return self.skipWaiting();
      })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME) {
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        return self.clients.claim();
      })
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);

  // Bypass chrome extensions or non-http protocols
  if (!url.protocol.startsWith('http')) return;

  // Navigation requests (HTML pages)
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req)
        .then((response) => {
          if (response && response.status === 200) {
            const copy = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(req, copy));
          }
          return response;
        })
        .catch(async () => {
          const cache = await caches.open(CACHE_NAME);
          const cachedMatch = await cache.match(req);
          if (cachedMatch) return cachedMatch;

          const offlinePage = await cache.match('/offline');
          if (offlinePage) return offlinePage;

          return new Response(
            `<!DOCTYPE html>
            <html lang="en">
            <head>
              <meta charset="UTF-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <title>Wilderness Mode — Offline</title>
              <style>
                body { background: #020617; color: #f8fafc; font-family: sans-serif; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; padding: 20px; text-align: center; }
                .card { background: #0f172a; border: 1px solid #334155; padding: 32px; border-radius: 24px; max-width: 400px; }
                h1 { color: #B68D40; margin-bottom: 8px; font-size: 20px; }
                p { color: #94a3b8; font-size: 14px; line-height: 1.5; margin-bottom: 20px; }
                a { display: inline-block; background: #B68D40; color: #020617; font-weight: bold; text-decoration: none; padding: 10px 20px; border-radius: 12px; }
              </style>
            </head>
            <body>
              <div class="card">
                <h1>Wilderness Offline Mode</h1>
                <p>Internet connectivity is unavailable in this alpine corridor. Access your pre-cached routes and emergency SOS protocols.</p>
                <a href="/offline">Open Wilderness Hub</a>
              </div>
            </body>
            </html>`,
            {
              headers: { 'Content-Type': 'text/html' },
              status: 200,
            }
          );
        })
    );
    return;
  }

  // Static assets (CSS, JS, Fonts, Images, Tile Maps)
  const isStaticAsset =
    url.pathname.startsWith('/_next/static/') ||
    url.pathname.endsWith('.png') ||
    url.pathname.endsWith('.jpg') ||
    url.pathname.endsWith('.jpeg') ||
    url.pathname.endsWith('.webp') ||
    url.pathname.endsWith('.svg') ||
    url.pathname.endsWith('.ico') ||
    url.pathname.endsWith('.woff2') ||
    url.pathname.endsWith('.woff') ||
    url.pathname.endsWith('.css') ||
    url.pathname.endsWith('.js') ||
    url.pathname.endsWith('.webmanifest') ||
    url.hostname.includes('basemaps.cartocdn.com');

  if (isStaticAsset) {
    event.respondWith(
      caches.match(req).then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }
        return fetch(req)
          .then((networkResponse) => {
            if (
              networkResponse &&
              networkResponse.status === 200 &&
              (networkResponse.type === 'basic' || networkResponse.type === 'cors')
            ) {
              const copy = networkResponse.clone();
              caches.open(CACHE_NAME).then((cache) => cache.put(req, copy));
            }
            return networkResponse;
          })
          .catch(() => {
            return caches.match(req);
          });
      })
    );
  }
});
