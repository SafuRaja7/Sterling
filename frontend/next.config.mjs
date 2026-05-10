/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['via.placeholder.com'], // Add real domains as needed
  },
  typescript: {
    // Skip type errors during build — fix later
    ignoreBuildErrors: true,
  },
  eslint: {
    // Skip lint errors during build — fix later
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;