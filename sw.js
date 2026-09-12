/* ============================================
   SERVICE WORKER - APRENDE AUTOMATIZACIÓN
   Versión: v1.0.0
   ============================================ */

const CACHE_NAME = 'aprende-automatizacion-v1';
const RUNTIME_CACHE = 'aprende-automatizacion-runtime-v1';

// Recursos que se cachean al instalar (los esenciales)
const URLS_TO_CACHE = [
  '/',
  '/index.html',
  '/img/favicon.webp',
  '/img/icon-192.png',
  '/img/icon-512.png',
  '/img/apple-touch-icon.png',
  '/manifest.json'
];

// ============================================
// INSTALL - Precachea los recursos esenciales
// ============================================
self.addEventListener('install', (event) => {
  console.log('🔧 [SW] Instalando...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('📦 [SW] Precargando recursos esenciales');
        // addAll falla si UNO solo falla, por eso hacemos individual
        return Promise.allSettled(
          URLS_TO_CACHE.map((url) =>
            cache.add(url).catch((err) => {
              console.warn(`⚠️ [SW] No se pudo cachear: ${url}`, err);
            })
          )
        );
      })
      .then(() => {
        console.log('✅ [SW] Instalación completa');
        return self.skipWaiting();
      })
  );
});

// ============================================
// ACTIVATE - Limpia cachés antiguos
// ============================================
self.addEventListener('activate', (event) => {
  console.log('🚀 [SW] Activando...');
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((name) => name !== CACHE_NAME && name !== RUNTIME_CACHE)
            .map((name) => {
              console.log(`🗑️ [SW] Eliminando caché antigua: ${name}`);
              return caches.delete(name);
            })
        );
      })
      .then(() => {
        console.log('✅ [SW] Activación completa');
        return self.clients.claim();
      })
  );
});

// ============================================
// FETCH - Estrategia de caché
// ============================================
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // 1. Ignorar peticiones que no sean GET
  if (request.method !== 'GET') return;

  // 2. Ignorar peticiones a otros dominios (APIs externas, Google Scripts, etc.)
  if (url.origin !== self.location.origin) {
    return;
  }

  // 3. Ignorar peticiones de extensiones de Chrome
  if (url.protocol === 'chrome-extension:') return;

  // 4. Estrategia especial para APIs de Google Apps Script
  //    (nunca cachear, siempre red)
  if (url.hostname.includes('script.google.com')) {
    return;
  }

  // 5. Estrategia: Cache First con Network Fallback
  //    Para HTML, JS, CSS, imágenes, fuentes
  event.respondWith(
    caches.match(request)
      .then((cachedResponse) => {
        if (cachedResponse) {
          // ✅ Encontrado en caché → devolver y actualizar en background
          //    (Stale-While-Revalidate)
          event.waitUntil(
            fetch(request)
              .then((networkResponse) => {
                if (networkResponse && networkResponse.status === 200) {
                  return caches.open(RUNTIME_CACHE).then((cache) => {
                    cache.put(request, networkResponse.clone());
                  });
                }
              })
              .catch(() => { /* Offline, no pasa nada */ })
          );
          return cachedResponse;
        }

        // ❌ No está en caché → ir a la red
        return fetch(request)
          .then((networkResponse) => {
            // Guardar en caché runtime para próxima vez
            if (
              networkResponse &&
              networkResponse.status === 200 &&
              networkResponse.type === 'basic'
            ) {
              const responseClone = networkResponse.clone();
              caches.open(RUNTIME_CACHE).then((cache) => {
                cache.put(request, responseClone);
              });
            }
            return networkResponse;
          })
          .catch((error) => {
            console.warn(`⚠️ [SW] Fetch fallido: ${request.url}`, error);

            // Fallback para páginas HTML → devolver index.html cacheado
            if (request.mode === 'navigate' || 
                (request.method === 'GET' && request.headers.get('accept')?.includes('text/html'))) {
              return caches.match('/index.html');
            }

            // Fallback para imágenes → devolver favicon
            if (request.destination === 'image') {
              return caches.match('/img/favicon.webp');
            }

            // Sin fallback, dejar que falle
            return new Response('Sin conexión', {
              status: 503,
              statusText: 'Service Unavailable',
              headers: new Headers({ 'Content-Type': 'text/plain; charset=utf-8' })
            });
          });
      })
  );
});

// ============================================
// MESSAGE - Permite forzar actualización desde la página
// ============================================
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    console.log('⏭️ [SW] Saltando espera, activando nueva versión');
    self.skipWaiting();
  }
});

// ============================================
// PUSH - Notificaciones push (opcional, listo para futuro)
// ============================================
self.addEventListener('push', (event) => {
  if (!event.data) return;
  
  const data = event.data.json();
  const options = {
    body: data.body || 'Nueva notificación',
    icon: '/img/icon-192.png',
    badge: '/img/icon-192.png',
    vibrate: [100, 50, 100],
    data: { url: data.url || '/' }
  };

  event.waitUntil(
    self.registration.showNotification(data.title || 'Aprende Automatización', options)
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.openWindow(event.notification.data.url || '/')
  );
});