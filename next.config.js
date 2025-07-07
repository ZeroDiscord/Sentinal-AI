/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  basePath: '/Sentinal-AI',
  assetPrefix: '/Sentinal-AI/',
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
    ],
  },
};

module.exports = nextConfig;
