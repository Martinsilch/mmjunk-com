/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      {
        source: '/services',
        destination: '/services/index.html',
      },
      {
        source: '/services/:path*',
        destination: '/services/:path*/index.html',
      },
      {
        source: '/jobs',
        destination: '/jobs/index.html',
      },
      {
        source: '/jobs/:path*',
        destination: '/jobs/:path*/index.html',
      },
    ];
  },
};

module.exports = nextConfig;
