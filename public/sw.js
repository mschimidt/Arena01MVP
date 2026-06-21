// Service Worker para Arena01 PWA
// Cache-first para assets estáticos, Network-first para páginas

const CACHE_NAME = 'arena01-v1';
const STATIC_ASSETS = [
  '/',
  '/login',
  '/aluno/aulas',
  '/aluno/meu-plano',
  '/aluno/meus-checkins',
  '/offline',
];

// Instalar e pré-cachear assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch(() => {
        // Silenciar erros de pré-cache (rotas podem não estar disponíveis offline)
      });
    })
  );
  self.skipWaiting();
});

// Ativar e limpar caches antigos
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) =>
      Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      )
    )
  );
  self.clients.claim();
});

// Interceptar requests
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Ignorar requests de extensões, APIs e Supabase
  if (
    url.origin !== location.origin ||
    url.pathname.startsWith('/api/') ||
    url.pathname.startsWith('/_next/') ||
    url.pathname.includes('supabase')
  ) {
    return;
  }

  // Fontes e imagens: Cache-First
  if (
    request.destination === 'image' ||
    request.destination === 'font' ||
    url.hostname.includes('fonts.googleapis.com') ||
    url.hostname.includes('fonts.gstatic.com')
  ) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;
        return fetch(request).then((response) => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          return response;
        }).catch(() => cached || new Response('', { status: 404 }));
      })
    );
    return;
  }

  // Páginas: Network-First com fallback para cache
  event.respondWith(
    fetch(request)
      .then((response) => {
        // Cachear respostas bem-sucedidas de páginas
        if (response.ok && request.method === 'GET') {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
        }
        return response;
      })
      .catch(() => {
        // Offline: tentar cache, senão /offline
        return caches.match(request).then((cached) => {
          return cached || caches.match('/offline') || new Response(
            '<html><body style="background:#080C14;color:#B8E000;font-family:sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;"><div style="text-align:center"><h1>Sem conexão</h1><p style="color:#94A3B8">Você está offline. Reconecte para usar o Arena01.</p></div></body></html>',
            { headers: { 'Content-Type': 'text/html' } }
          );
        });
      })
  );
});

// Receber push notifications (quando implementadas via Supabase Edge Functions)
self.addEventListener('push', (event) => {
  if (!event.data) return;
  const data = event.data.json();

  event.waitUntil(
    self.registration.showNotification(data.title || 'Arena01', {
      body: data.body || 'Nova notificação da Arena01',
      icon: '/icons/icon-192x192.png',
      badge: '/icons/icon-192x192.png',
      tag: data.tag || 'arena01',
      data: data.url || '/aluno/aulas',
    })
  );
});

// Clicar na notificação → abrir página correspondente
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then((windowClients) => {
      for (const client of windowClients) {
        if (client.url === event.notification.data && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(event.notification.data || '/aluno/aulas');
      }
    })
  );
});
