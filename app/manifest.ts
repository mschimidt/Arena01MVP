import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Arena01 — Gestão de Futevôlei',
    short_name: 'Arena01',
    description: 'Sistema de check-in e gestão da Arena01 Futevôlei',
    start_url: '/',
    display: 'standalone',
    background_color: '#080C14',
    theme_color: '#B8E000',
    orientation: 'portrait',
    categories: ['sports', 'fitness'],
    icons: [
      {
        src: '/icons/icon-192x192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'maskable',
      },
      {
        src: '/icons/icon-512x512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
    ],
    shortcuts: [
      {
        name: 'Minhas Aulas',
        short_name: 'Aulas',
        description: 'Ver grade de aulas da semana',
        url: '/aluno/aulas',
        icons: [{ src: '/icons/icon-192x192.png', sizes: '192x192' }],
      },
    ],
  };
}
