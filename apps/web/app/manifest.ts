import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Crank',
    short_name: 'Crank',
    description: 'AI-matched playlists for your CrossFit workouts',
    start_url: '/',
    display: 'standalone',
    background_color: '#0C0C10',
    theme_color: '#0C0C10',
    icons: [
      {
        src: '/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  }
}
