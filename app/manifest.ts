import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: '/',
    name: 'RemedyAfrica',
    short_name: 'RemedyAfrica',
    description:
      'Traditional African herbal remedies, plant identification, and verified practitioners.',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    display_override: ['standalone', 'browser'],
    background_color: '#FFFFFF',
    theme_color: '#1C2920',
    orientation: 'portrait-primary',
    lang: 'en',
    categories: ['health', 'medical', 'lifestyle'],
    icons: [
      {
        src: '/icons/icon-192.png?v=2',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icons/icon-512.png?v=2',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icons/icon-192-maskable.png?v=2',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'maskable',
      },
      {
        src: '/icons/icon-512-maskable.png?v=2',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
    shortcuts: [
      {
        name: 'Identify a herb',
        short_name: 'Identify',
        description: 'Photograph a plant and match it to traditional uses.',
        url: '/identify',
        icons: [{ src: '/icons/icon-192.png?v=2', sizes: '192x192', type: 'image/png' }],
      },
      {
        name: 'Search the library',
        short_name: 'Search',
        description: 'Search remedies and ailments.',
        url: '/search',
        icons: [{ src: '/icons/icon-192.png?v=2', sizes: '192x192', type: 'image/png' }],
      },
    ],
  };
}
