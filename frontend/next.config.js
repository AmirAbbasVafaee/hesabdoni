/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['localhost', 'hesabdonibackend.liara.run'],
  },
  output: 'standalone',
  // Ensure public directory is recognized
  publicRuntimeConfig: {},
}

module.exports = nextConfig

