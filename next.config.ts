import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  serverExternalPackages: ['@prisma/client', 'prisma'],
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'raw.githubusercontent.com',
        pathname: '/yuhonas/free-exercise-db/**',
      },
      {
        protocol: 'https',
        hostname: 'cdn.jsdelivr.net',
        pathname: '/gh/JahelCuadrado/ExerciseGymGifsDB/**',
      },
      {
        protocol: 'https',
        hostname: 'wger.de',
        pathname: '/media/**',
      },
    ],
  },
};

export default nextConfig;
