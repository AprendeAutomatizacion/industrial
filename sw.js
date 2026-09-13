/* ============================================
   SERVICE WORKER - APRENDE AUTOMATIZACIÓN
   Versión: v1.1.0
   ✅ Auto-actualización habilitada
   ✅ Network First para HTML (cambios visibles al instante)
   ============================================ */

const CACHE_NAME = 'aprende-automatizacion-v1.1.0';
const RUNTIME_CACHE = 'aprende-automatizacion-runtime-v1.1.0';

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
// INSTALL - Precachea y activa INMEDIATAMENTE
// ============================================
self.addEventListener('install', (event) => {
  console.log('🔧 [SW] Instalando nueva versión...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('📦 [SW] Precargando recursos esenciales');
        return Promise.allSettled(
          URLS_TO_CACHE.map((url) =>
            cache.add(url).catch((err) => {
              console.warn(`⚠️ [SW] No se pudo cachear: ${url}`, err);
            })
          )
        );
      })
      .then(() => {
        console.log('✅ [SW] Instalación completa. Forzando activación inmediata...');
        // 🔥 CLAVE #1: skipWaiting() activa el SW nuevo SIN esperar a que
        //              se cierren todas las pestañas del usuario
        return self.skipWaiting();
      })
  );
});

// ============================================
// ACTIVATE - Limpia cachés antiguos y toma control
// ============================================
self.addEventListener('activate', (event) => {
  console.log('🚀 [SW] Activando nueva versión...');
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
        console.log('✅ [SW] Activación completa. Tomando control de todas las pestañas...');
        // 🔥 CLAVE #2: clients.claim() toma el control SIN recargar
        //              todas las pestañas abiertas
        return self.clients.claim();
      })
  );
});

// ============================================
// FETCH - Estrategia de caché inteligente
// ============================================
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // 1. Ignorar peticiones que no sean GET
  if (request.method !== 'GET') return;

  // 2. Ignorar peticiones a otros dominios (APIs externas)
  if (url.origin !== self.location.origin) {
    return;
  }

  // 3. Ignorar peticiones de extensiones de Chrome
  if (url.protocol === 'chrome-extension:') return;

  // 4. Estrategia especial para APIs de Google Apps Script (nunca cachear)
  if (url.hostname.includes('script.google.com')) {
    return;
  }

  // ==========================================
  // 🔥 CLAVE #3: NETWORK FIRST para HTML
  // ==========================================
  // El HTML siempre se pide primero a la red. Esto significa que
  // CUALQUIER cambio en index.html, catalogo.html, etc. se verá
  // INMEDIATAMENTE sin que el usuario tenga que hacer nada.
  const isHTML = request.mode === 'navigate' || 
                 (request.method === 'GET' && 
                  request.headers.get('accept')?.includes('text/html'));

  if (isHTML) {
    event.respondWith(
      fetch(request)
        .then((networkResponse) => {
          // Guardar copia actualizada en caché (para uso offline)
          if (networkResponse && networkResponse.status === 200) {
            const responseClone = networkResponse.clone();
            caches.open(RUNTIME_CACHE).then((cache) => {
              cache.put(request, responseClone);
            });
          }
          return networkResponse;
        })
        .catch((error) => {
          // Si no hay red → servir desde caché
          console.warn(`⚠️ [SW] Sin red, sirviendo HTML desde caché: ${request.url}`);
          return caches.match(request).then((cached) => {
            return cached || caches.match('/index.html');
          });
        })
    );
    return;
  }

  // ==========================================
  // Para CSS, JS, imágenes, etc: Cache First con actualización
  // ==========================================
  event.respondWith(
    caches.match(request)
      .then((cachedResponse) => {
        if (cachedResponse) {
          // ✅ Encontrado en caché → devolver y actualizar en background
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

            // Fallback para imágenes
            if (request.destination === 'image') {
              return caches.match('/img/favicon.webp');
            }

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