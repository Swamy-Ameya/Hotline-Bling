/**
 * Service Worker for Outbreak Radar PWA & Web Push Notifications
 */

const CACHE_NAME = 'outbreak-radar-v1';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// Push notification event listener
self.addEventListener('push', (event) => {
  let payload = {
    title: 'Outbreak Radar Alert',
    body: 'New hostel health advisory received.',
    url: '/app/alerts',
  };

  try {
    if (event.data) {
      payload = event.data.json();
    }
  } catch {
    if (event.data) {
      payload.body = event.data.text();
    }
  }

  const options = {
    body: payload.body,
    icon: '/favicon.ico',
    badge: '/favicon.ico',
    vibrate: [200, 100, 200],
    data: {
      url: payload.url || '/app/alerts',
    },
    actions: [
      { action: 'open', title: 'Open Advisory' },
      { action: 'dismiss', title: 'Dismiss' },
    ],
  };

  event.waitUntil(self.registration.showNotification(payload.title, options));
});

// Notification click event listener
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = event.notification.data?.url || '/app/alerts';

  if (event.action === 'dismiss') return;

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes(targetUrl) && 'focus' in client) {
          return client.focus();
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
    }),
  );
});
