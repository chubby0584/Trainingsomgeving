/* Service worker: maakt de app installeerbaar en bruikbaar zonder verbinding.
   Alleen de eigen bestanden worden gecachet — verkeer naar Supabase gaat altijd
   rechtstreeks naar het netwerk, zodat je nooit verouderde gegevens te zien krijgt. */

const VERSIE = 'trainersomgeving-v3';

const SCHIL = [
  './',
  './index.html',
  './manifest.webmanifest',
  './assets/css/app.css',
  './assets/js/util.js',
  './assets/js/seed.js',
  './assets/js/store.js',
  './assets/js/sync.js',
  './assets/js/views-dashboard.js',
  './assets/js/views-spelers.js',
  './assets/js/views-trainingen.js',
  './assets/js/views-oefeningen.js',
  './assets/js/views-wedstrijden.js',
  './assets/js/views-instellingen.js',
  './assets/js/app.js',
  './assets/icons/icon-192.png',
  './assets/icons/icon-512.png',
  './assets/icons/icon-maskable-512.png',
  './assets/icons/apple-touch-icon.png'
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(VERSIE)
      // Losse toevoegingen: één ontbrekend bestand mag de hele installatie niet blokkeren.
      .then(cache => Promise.all(SCHIL.map(pad => cache.add(pad).catch(() => null))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then(namen => Promise.all(namen.filter(n => n !== VERSIE).map(n => caches.delete(n))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const verzoek = e.request;
  if (verzoek.method !== 'GET') return;

  const url = new URL(verzoek.url);
  if (url.origin !== self.location.origin) return; // Supabase e.d. nooit onderscheppen

  // Netwerk eerst, cache als terugval — zo zie je na een update meteen de nieuwe versie,
  // maar blijft de app werken op een veld zonder bereik.
  e.respondWith(
    fetch(verzoek)
      .then(antwoord => {
        if (antwoord && antwoord.status === 200 && antwoord.type === 'basic') {
          const kopie = antwoord.clone();
          caches.open(VERSIE).then(cache => cache.put(verzoek, kopie));
        }
        return antwoord;
      })
      .catch(() => caches.match(verzoek).then(hit => hit || caches.match('./index.html')))
  );
});
