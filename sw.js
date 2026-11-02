/* =========================================================
   نظامي — Service Worker
   يوفّر التثبيت والعمل دون اتصال بعد الزيارة الأولى.
   ملاحظة: إشعارات المتصفح المغلقة تحتاج Web Push + خادم VAPID.
   هذا الملف يهيّئ مستقبل الإشعارات فقط، ولا يضيف خادمًا.
   ========================================================= */
'use strict';

const CACHE_NAME = 'nizami-shell-v1';
const APP_SHELL = [
  './',
  './index.html',
  './css/styles.css',
  './js/utils.js',
  './js/db.js',
  './js/store.js',
  './js/views.js',
  './js/views-extra.js',
  './js/modals.js',
  './js/app.js',
  './assets/icon.svg',
  './manifest.webmanifest'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(APP_SHELL))
      .catch((error) => console.warn('[نظامي] تعذر تخزين ملفات التطبيق', error))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // صفحات التنقل: الشبكة أولًا ثم النسخة المخزنة، مع الرجوع إلى index.html دون اتصال.
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, copy)).catch(() => {});
          return response;
        })
        .catch(async () => (await caches.match(request)) || caches.match('./index.html'))
    );
    return;
  }

  // بقية الملفات: الشبكة أولًا مع تحديث النسخة المخزنة، ثم الكاش عند الانقطاع.
  event.respondWith(
    fetch(request)
      .then((response) => {
        if (response && response.ok) {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, copy)).catch(() => {});
        }
        return response;
      })
      .catch(() => caches.match(request))
  );
});

/* إشعارات الويب الحقيقية (اختياري): لا تُستخدم قبل ربط خادم Web Push. */
self.addEventListener('push', (event) => {
  let payload = {};
  try {
    payload = event.data ? event.data.json() : {};
  } catch (error) {
    payload = { body: event.data ? event.data.text() : '' };
  }
  const title = payload.title || 'نظامي';
  const options = {
    body: payload.body || 'لديك تذكير جديد',
    icon: 'assets/icon.svg',
    badge: 'assets/icon.svg',
    dir: 'rtl',
    lang: 'ar',
    tag: payload.tag || 'nizami-push',
    data: { url: payload.url || './?view=reminders' }
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const target = new URL(event.notification.data?.url || './?view=reminders', self.location.origin).href;
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ('focus' in client) {
          client.postMessage({ type: 'nizami:navigate', view: 'reminders' });
          return client.focus();
        }
      }
      if (self.clients.openWindow) return self.clients.openWindow(target);
      return undefined;
    })
  );
});

/* رسائل من الصفحة: إظهار إشعار عبر Service Worker عند الحاجة. */
self.addEventListener('message', (event) => {
  const data = event.data || {};
  if (data.type === 'nizami:notify' && data.title) {
    event.waitUntil(
      self.registration.showNotification(data.title, {
        body: data.body || '',
        icon: 'assets/icon.svg',
        badge: 'assets/icon.svg',
        dir: 'rtl',
        lang: 'ar',
        tag: data.tag || 'nizami',
        data: { url: data.url || './?view=reminders' }
      })
    );
  }
});
