const CACHE = 'personal-workbench-v3-mobile-capsule-1';
const FILES = ['./','./index.html','./style.css','./app.js','./manifest.json','./icons/icon-192.png','./icons/icon-512.png'];
self.addEventListener('install', event => { self.skipWaiting(); event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(FILES))); });
self.addEventListener('activate', event => event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())));
self.addEventListener('fetch', event => event.respondWith(fetch(event.request).catch(() => caches.match(event.request))));
