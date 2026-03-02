// Questo file dice al telefono che l'app è sicura e installabile.
const CACHE_NAME = 'ricettario-cache-v1';

self.addEventListener('install', (event) => {
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    event.waitUntil(clients.claim());
});

self.addEventListener('fetch', (event) => {
    // Per ora lasciamo che la rete faccia il suo lavoro normalmente.
    // In futuro potremmo usarlo per far funzionare l'app anche offline (senza internet)!
    event.respondWith(fetch(event.request).catch(() => {
        return new Response('Sei offline. Connettiti a internet per vedere il tuo ricettario.');
    }));
});