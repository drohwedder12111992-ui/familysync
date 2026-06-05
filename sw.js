// FamilySync Service Worker
const CACHE = 'familysync-v1';

self.addEventListener('install', e => {
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', e => {
  // Network first for API calls
  if (e.request.url.includes('supabase.co') || e.request.url.includes('anthropic.com')) return;
  e.respondWith(
    fetch(e.request).catch(() => caches.match(e.request))
  );
});

self.addEventListener('push', e => {
  const data = e.data ? e.data.json() : { title: 'FamilySync', body: 'Neue Änderung' };
  e.waitUntil(
    self.registration.showNotification(data.title || 'FamilySync', {
      body: data.body || 'Neue Änderung in eurem Plan.',
      icon: '/icon.png',
      badge: '/icon.png',
      vibrate: [100, 50, 100],
      data: { url: '/' }
    })
  );
});

self.addEventListener('notificationclick', e => {
  e.notification.close();
  e.waitUntil(clients.openWindow('/'));
});
