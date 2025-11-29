/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '5000',
        pathname: '/uploads/**',
      },
      {
        protocol: 'https',
        hostname: 'hesabdonibackend.liara.run',
        pathname: '/uploads/**',
      },
    ],
    domains: ['localhost', 'hesabdonibackend.liara.run'],
  },
  output: 'standalone',
  // Ensure public directory is recognized
  publicRuntimeConfig: {},
}

module.exports = nextConfig

