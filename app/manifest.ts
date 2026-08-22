import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Outbreak Radar — MUJ Hostel Surveillance',
    short_name: 'Radar',
    description: 'Hostel Micro-Outbreak Early Warning System and Sickness Surveillance',
    start_url: '/app',
    display: 'standalone',
    background_color: '#eef2f6',
    theme_color: '#eef2f6',
    icons: [
      {
        src: '/favicon.ico',
        sizes: 'any',
        type: 'image/x-icon',
      },
    ],
  };
}
