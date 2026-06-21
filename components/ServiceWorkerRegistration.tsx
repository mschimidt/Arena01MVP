'use client';

import { useEffect } from 'react';

export default function ServiceWorkerRegistration() {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js')
        .then((registration) => {
          console.log('[Arena01 PWA] Service Worker registrado:', registration.scope);
        })
        .catch((error) => {
          console.warn('[Arena01 PWA] Falha ao registrar Service Worker:', error);
        });
    }
  }, []);

  return null;
}
