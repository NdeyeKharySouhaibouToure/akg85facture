/* Service worker AKG 85 Facturation
   Objectif: rendre l'app installable (PWA) et disponible hors-ligne pour la
   coquille locale (index.html, style.css, app.js, logo...).
   Les requêtes vers Supabase et les CDN restent en réseau direct. */

const CACHE = 'akg85-facture-v1';
const APP_SHELL = [
  './',
  './index.html',
  './style.css',
  './app.js',
  './manifest.json',
  './logo_akg.png',
  './carte-visite.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE)
      .then((cache) => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
      .catch(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);
  // On ne gère que le même origine (coquille locale).
  // Supabase / CDN / polices => réseau direct, non interceptés.
  if (url.origin !== self.location.origin) return;

  // Stratégie "network-first": on tente toujours d'obtenir la dernière version
  // en ligne (donc les redéploiements sont pris en compte immédiatement), et on
  // ne retombe sur le cache que hors-ligne. On met à jour le cache au passage.
  event.respondWith(
    fetch(req).then((res) => {
      if (res && res.status === 200 && res.type === 'basic') {
        const copy = res.clone();
        caches.open(CACHE).then((cache) => cache.put(req, copy)).catch(() => {});
      }
      return res;
    }).catch(() => caches.match(req).then((cached) => cached || Response.error()))
  );
});
