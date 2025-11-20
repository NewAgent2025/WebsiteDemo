// service-worker.js
self.addEventListener('install', evt => {
  console.log('SW installed');
  self.skipWaiting();
});

self.addEventListener('activate', evt => {
  console.log('SW activated');
  self.clients.claim();
});

// handle messages from page
self.addEventListener('message', event => {
  const data = event.data;
  if (!data) return;
  if (data.cmd === 'show-notification' && data.payload) {
    showLocalNotification(data.payload, event.source);
  }
});

async function showLocalNotification(payload, sourceClient) {
  const title = payload.title || 'Notification';
  const options = {
    body: payload.body || '',
    icon: '/icons/icon-192.png',
    badge: '/icons/icon-192.png',
    data: { url: payload.url || '/' },
    tag: payload.tag || 'local-sim' // collapse similar ones
  };
  try {
    await self.registration.showNotification(title, options);
    // optionally reply back to client
    if (sourceClient && sourceClient.postMessage) {
      try { sourceClient.postMessage({type:'notif-shown', tag: options.tag}); } catch(e){}
    }
  } catch (e) {
    console.warn('showNotification failed', e);
  }
}

self.addEventListener('notificationclick', event => {
  event.notification.close();
  const url = event.notification.data && event.notification.data.url ? event.notification.data.url : '/';
  // notify clients that user clicked
  event.waitUntil(
    (async () => {
      const all = await clients.matchAll({ type: 'window', includeUncontrolled: true });
      if (all && all.length > 0) {
        // focus existing
        all[0].postMessage({ type: 'notification-clicked', url });
        return all[0].focus();
      } else {
        // open a new window
        return clients.openWindow(url);
      }
    })()
  );
});
