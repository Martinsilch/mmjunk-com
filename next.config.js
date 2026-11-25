/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'assets.amzy.me',
      },
      {
        protocol: 'https',
        hostname: 's3-media*.fl.yelpcdn.com',
      },
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
      },
      {
        protocol: 'https',
        hostname: 'www.mmjunk.com',
      },
    ],
  },
  async rewrites() {
    return [
      {
        source: '/preview-1',
        destination: '/preview-1/index.html',
      },
      {
        source: '/preview-1/',
        destination: '/preview-1/index.html',
      },
      {
        source: '/preview-2',
        destination: '/preview-2/index.html',
      },
      {
        source: '/preview-2/',
        destination: '/preview-2/index.html',
      },
      {
        source: '/preview-3',
        destination: '/preview-3/index.html',
      },
      {
        source: '/preview-3/',
        destination: '/preview-3/index.html',
      },
      {
        source: '/privacy-policy',
        destination: '/privacy-policy/index.html',
      },
      {
        source: '/privacy-policy/',
        destination: '/privacy-policy/index.html',
      },
    ];
  },
  async redirects() {
    return [
      {
        source: '/light-demolition-services',
        destination: '/services/light-demolition-services',
        permanent: true,
      },
      {
        source: '/light-demolition-services/',
        destination: '/services/light-demolition-services',
        permanent: true,
      },
      {
        source: '/light-demolition',
        destination: '/services/light-demolition-services',
        permanent: true,
      },
      {
        source: '/light-demolition/',
        destination: '/services/light-demolition-services',
        permanent: true,
      },
      {
        source: '/shed-demolition',
        destination: '/services/light-demolition-services',
        permanent: true,
      },
      {
        source: '/shed-demolition/',
        destination: '/services/light-demolition-services',
        permanent: true,
      },
      {
        source: '/basketball-court-wall-demolition-renton-skyway',
        destination: '/jobs/basketball-court-wall-demolition-renton-skyway',
        permanent: true,
      },
      {
        source: '/basketball-court-wall-demolition-renton-skyway/',
        destination: '/jobs/basketball-court-wall-demolition-renton-skyway',
        permanent: true,
      },
      {
        source: '/security.txt',
        destination: '/.well-known/security.txt',
        permanent: true,
      },
    ];
  },
  async headers() {
    return [
      {
        source: '/:path*.md',
        headers: [
          { key: 'Content-Type', value: 'text/markdown; charset=utf-8' },
          { key: 'Cache-Control', value: 'public, max-age=3600, stale-while-revalidate=86400' },
          { key: 'Access-Control-Allow-Origin', value: '*' },
        ],
      },
      {
        source: '/llms.txt',
        headers: [
          { key: 'Content-Type', value: 'text/markdown; charset=utf-8' },
          { key: 'Cache-Control', value: 'public, max-age=60, s-maxage=60, stale-while-revalidate=600' },
          { key: 'Access-Control-Allow-Origin', value: '*' },
        ],
      },
      {
        source: '/llms-full.txt',
        headers: [
          { key: 'Content-Type', value: 'text/markdown; charset=utf-8' },
          { key: 'Cache-Control', value: 'public, max-age=60, s-maxage=60, stale-while-revalidate=600' },
          { key: 'Access-Control-Allow-Origin', value: '*' },
        ],
      },
      {
        source: '/llms-workflows.txt',
        headers: [
          { key: 'Content-Type', value: 'text/markdown; charset=utf-8' },
          { key: 'Cache-Control', value: 'public, max-age=60, s-maxage=60, stale-while-revalidate=600' },
          { key: 'Access-Control-Allow-Origin', value: '*' },
        ],
      },
      {
        source: '/llm-examples.md',
        headers: [
          { key: 'Content-Type', value: 'text/markdown; charset=utf-8' },
          { key: 'Cache-Control', value: 'public, max-age=60, s-maxage=60, stale-while-revalidate=600' },
          { key: 'Access-Control-Allow-Origin', value: '*' },
        ],
      },
      {
        source: '/.well-known/security.txt',
        headers: [
          { key: 'Content-Type', value: 'text/plain; charset=utf-8' },
          { key: 'Cache-Control', value: 'public, max-age=3600, stale-while-revalidate=86400' },
          { key: 'Access-Control-Allow-Origin', value: '*' },
        ],
      },
      {
        source: '/humans.txt',
        headers: [
          { key: 'Content-Type', value: 'text/plain; charset=utf-8' },
          { key: 'Cache-Control', value: 'public, max-age=3600, stale-while-revalidate=86400' },
          { key: 'Access-Control-Allow-Origin', value: '*' },
        ],
      },
      {
        source: '/.well-known/pricing.json',
        headers: [
          { key: 'Content-Type', value: 'application/json; charset=utf-8' },
          { key: 'Cache-Control', value: 'public, max-age=60, s-maxage=60, stale-while-revalidate=600' },
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET, HEAD, OPTIONS' },
        ],
      },
      {
        source: '/.well-known/agent.json',
        headers: [
          { key: 'Content-Type', value: 'application/json; charset=utf-8' },
          { key: 'Cache-Control', value: 'public, max-age=60, s-maxage=60, stale-while-revalidate=600' },
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET, HEAD, OPTIONS' },
        ],
      },
      {
        source: '/knowledge/:path*.json',
        headers: [
          { key: 'Content-Type', value: 'application/json; charset=utf-8' },
          { key: 'Cache-Control', value: 'public, max-age=3600, stale-while-revalidate=86400' },
          { key: 'Access-Control-Allow-Origin', value: '*' },
        ],
      },
      {
        source: '/knowledge/:path*.md',
        headers: [
          { key: 'Content-Type', value: 'text/markdown; charset=utf-8' },
          { key: 'Cache-Control', value: 'public, max-age=3600, stale-while-revalidate=86400' },
          { key: 'Access-Control-Allow-Origin', value: '*' },
        ],
      },
      {
        source: '/feeds/:path*',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400' },
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET, HEAD, OPTIONS' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
        ],
      },
      {
        source: '/api/feeds/:path*',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400' },
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET, HEAD, OPTIONS' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
