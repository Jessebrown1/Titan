// Service worker for the installed admin app (scope: /admin).
// Data always comes live from Supabase; only the app's own files are cached,
// so it opens quickly and shows a friendly screen when there's no connection.
const CACHE = 'titan-admin-v2';
const OFFLINE = `<!doctype html><meta name="viewport" content="width=device-width,initial-scale=1"><title>TITAN Admin</title>
<body style="margin:0;min-height:100vh;display:grid;place-content:center;gap:8px;text-align:center;padding:24px;background:#0a0a0b;color:#f4f4f2;font-family:system-ui,sans-serif">
<strong style="font-size:20px">You're offline</strong><span style="opacity:.65">Reconnect to manage your vehicles and enquiries.</span>
<button onclick="location.reload()" style="margin-top:12px;height:44px;border:0;border-radius:99px;background:#f4f4f2;color:#0a0a0b;font-weight:600">Try again</button></body>`;

self.addEventListener('push', (event) => {
  const data = event.data ? event.data.json() : {};
  event.waitUntil(self.registration.showNotification(data.title || 'TITAN Admin', {
    body: data.body || 'You have a new message.',
    icon: '/icons/icon-192.png',
    badge: '/icons/icon-192.png',
    tag: data.tag,
    data: { url: data.url || '/admin' },
  }));
});

// Tapping a notification opens the app on the right page.
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = event.notification.data?.url || '/admin';
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windows) => {
      const open = windows.find((w) => new URL(w.url).pathname.startsWith('/admin'));
      if (open) return open.focus().then((w) => w.navigate(url));
      return self.clients.openWindow(url);
    }),
  );
});

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  if (request.method !== 'GET' || url.origin !== self.location.origin) return;

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(() => caches.match('/admin').then((hit) => hit
        || new Response(OFFLINE, { headers: { 'Content-Type': 'text/html' } }))),
    );
    return;
  }

  if (url.pathname.startsWith('/assets/') || url.pathname.startsWith('/images/') || url.pathname.startsWith('/icons/')) {
    event.respondWith(
      caches.open(CACHE).then(async (cache) => {
        const hit = await cache.match(request);
        if (hit) return hit;
        const response = await fetch(request);
        if (response.ok) cache.put(request, response.clone());
        return response;
      }),
    );
  }
});
