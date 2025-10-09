const CACHE_NAME = 'goldisle-music-v1';
const toCache = [
  './',
  './index.html',
  './styles.css',
  './player.js',
  './songs.json'
];

self.addEventListener('install', e=>{
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(toCache))
  );
});
self.addEventListener('fetch', e=>{
  const req = e.request;
  // avoid caching large media by default - only use network-first for media
  if(req.destination === 'audio') return; 
  e.respondWith(
    caches.match(req).then(r => r || fetch(req))
  );
});
