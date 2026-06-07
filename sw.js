// ROH FamilySync Service Worker
const CACHE = 'roh-v3';
const ASSETS = ['/familysync/', '/familysync/index.html'];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE)
      .then(c => c.addAll(ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// Network-first
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  if (e.request.url.includes('supabase') || e.request.url.includes('open-meteo') || e.request.url.includes('nominatim')) return;
  e.respondWith(
    fetch(e.request)
      .then(resp => {
        if (resp.ok) {
          caches.open(CACHE).then(c => c.put(e.request, resp.clone()));
        }
        return resp;
      })
      .catch(() => caches.match(e.request))
  );
});

// Push notification received
self.addEventListener('push', e => {
  if (!e.data) return;
  let data = {};
  try { data = e.data.json(); } catch { data = { title: 'ROH', body: e.data.text() }; }
  e.waitUntil(
    self.registration.showNotification(data.title || 'ROH FamilySync', {
      body: data.body || '',
      icon: '/familysync/icon.svg',
      badge: '/familysync/icon.svg',
      vibrate: [200, 100, 200],
      data: { url: '/familysync/' }
    })
  );
});

// Tap on notification → open app
self.addEventListener('notificationclick', e => {
  e.notification.close();
  e.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(cls => {
      const appClient = cls.find(c => c.url.includes('/familysync/'));
      if (appClient) return appClient.focus();
      return clients.openWindow('/familysync/');
    })
  );
});

// Skip waiting on message
self.addEventListener('message', e => {
  if (e.data === 'skipWaiting') self.skipWaiting();
});
