import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'fitMetrics — трекер тренировок',
    short_name: 'fitMetrics',
    description: 'Отслеживай тренировки, вес и прогресс в упражнениях',
    start_url: '/dashboard',
    display: 'standalone',
    background_color: '#0d0d0d',
    theme_color: '#22c55e',
    orientation: 'portrait-primary',
    icons: [
      { src: '/icon', sizes: 'any', type: 'image/png', purpose: 'any' },
      { src: '/icon', sizes: 'any', type: 'image/png', purpose: 'maskable' },
    ],
  };
}
